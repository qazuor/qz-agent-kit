#!/usr/bin/env node
/** Render a project's declared knowledge layer for one CLI without installing it. */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const client = value('--client')
const projectRoot = resolve(args.find((arg, index) => !arg.startsWith('-') && args[index - 1] !== '--client' && args[index - 1] !== '--output') || process.cwd())
const output = value('--output')
if (args.includes('--help') || !client || !output) {
  console.log('Usage: node scripts/project-render.mjs <project-root> --client <opencode|claude|codex|gentle-shell> --output <dir>')
  process.exit(args.includes('--help') ? 0 : 2)
}
if (!['opencode', 'claude', 'codex', 'gentle-shell'].includes(client)) throw new Error(`cliente inválido: ${client}`)
const manifestPath = join(projectRoot, '.qz/project.json')
if (!existsSync(manifestPath)) throw new Error(`no existe ${manifestPath}`)
const config = JSON.parse(readFileSync(manifestPath, 'utf8'))
const knowledge = config.knowledge
if (!knowledge) {
  console.log(JSON.stringify({ projectRoot, client, output: resolve(output), resources: 0, mutations: [resolve(output)], note: 'el proyecto no declara knowledge' }, null, 2))
  process.exit(0)
}
const root = resolve(projectRoot, knowledge.root || '.qz/knowledge')
const safeRelative = (name, label) => {
  if (typeof name !== 'string' || !name || name.startsWith('/') || name.split(/[\\/]+/).includes('..')) throw new Error(`${label}: ruta insegura`)
  return name
}
const instructions = knowledge.instructions ? safeRelative(knowledge.instructions, 'knowledge.instructions') : null
const dirs = {
  skills: safeRelative(knowledge.skillsDir || 'skills', 'knowledge.skillsDir'),
  agents: safeRelative(knowledge.agentsDir || 'agents', 'knowledge.agentsDir'),
  commands: safeRelative(knowledge.commandsDir || 'commands', 'knowledge.commandsDir')
}
const destination = resolve(output)
mkdirSync(destination, { recursive: true })
const resources = []
const copyFile = (source, target) => {
  if (!existsSync(source) || !statSync(source).isFile()) throw new Error(`recurso ausente o inválido: ${source}`)
  mkdirSync(resolve(target, '..'), { recursive: true })
  cpSync(source, target)
  resources.push({ source, target })
}
if (instructions) {
  const source = join(projectRoot, instructions)
  const target = join(destination, 'instructions', 'AGENTS.md')
  copyFile(source, target)
}
const sourceRoot = root
const copyDirectory = (kind, clientDirectory) => {
  const source = join(sourceRoot, dirs[kind])
  if (!existsSync(source)) return
  for (const name of readdirSync(source).sort()) {
    const entry = join(source, name)
    if (statSync(entry).isFile() && name.endsWith('.md')) {
      copyFile(entry, join(destination, clientDirectory, name))
      continue
    }
    if (!statSync(entry).isDirectory()) continue
    const files = readdirSync(entry).filter((file) => file.endsWith('.md')).sort()
    for (const file of files) copyFile(join(entry, file), join(destination, clientDirectory, name, file))
  }
}
copyDirectory('skills', 'skills')
copyDirectory('agents', 'agents')
if (client === 'gentle-shell') {
  const source = join(sourceRoot, dirs.commands)
  if (existsSync(source)) for (const file of readdirSync(source).filter((name) => name.endsWith('.md')).sort()) copyFile(join(source, file), join(destination, 'prompts', file))
} else if (client === 'codex') {
  const source = join(sourceRoot, dirs.commands)
  if (existsSync(source)) for (const file of readdirSync(source).filter((name) => name.endsWith('.md')).sort()) copyFile(join(source, file), join(destination, 'skills', 'project-commands', file))
} else {
  const source = join(sourceRoot, dirs.commands)
  if (existsSync(source)) for (const file of readdirSync(source).filter((name) => name.endsWith('.md')).sort()) copyFile(join(source, file), join(destination, 'commands', file))
}
const commandDirectory = client === 'gentle-shell'
  ? join(destination, 'prompts')
  : client === 'codex'
    ? join(destination, 'skills', 'project-commands')
    : join(destination, 'commands')
for (const command of (Array.isArray(config.commands?.registry) ? config.commands.registry : [])) {
  if (!command || typeof command.id !== 'string' || typeof command.delegate !== 'string') continue
  if (Array.isArray(command.clients) && !command.clients.includes(client)) continue
  const target = join(commandDirectory, `${command.id}.md`)
  // A project may provide a richer prompt in knowledge.commands. Keep that
  // source authoritative and generate only commands without custom guidance.
  if (existsSync(target)) continue
  const mutation = command.mutates === true ? 'Este comando puede modificar estado; pedí autorización cuando corresponda.' : 'Este comando es read-only salvo que su ayuda indique lo contrario.'
  const content = `---\ndescription: ${JSON.stringify(command.description || command.id)}\n---\n\n# ${command.id}\n\nEjecutá el comando del adapter del proyecto y explicá el resultado:\n\n\`\`\`bash\nqz ${command.id} \"$ARGUMENTS\"\n\`\`\`\n\n${mutation}\n\nNo reemplaces este workflow por una reimplementación manual si el comando está disponible.\n`
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content)
  // The generated file is the rendered source consumed by project-sync.
  resources.push({ source: target, target })
}
console.log(JSON.stringify({ projectRoot, projectId: config.projectId, adapter: config.adapter, client, output: destination, resources: resources.length, files: resources, mutations: [destination], secretValues: 'not-read' }, null, 2))
