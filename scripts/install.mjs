#!/usr/bin/env node
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(new URL('..', import.meta.url).pathname)
const manifest = JSON.parse(readFileSync(join(root, 'manifests/qz-command-manifest.json'), 'utf8'))
const contentManifestPath = join(root, 'manifests/qz-content-manifest.json')
const contentManifest = existsSync(contentManifestPath) ? JSON.parse(readFileSync(contentManifestPath, 'utf8')) : null
const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }

if (has('--help') || args.length === 0) {
  console.log('Usage: node scripts/install.mjs --plan|--check|--apply [--client <name>] [--home <dir>]')
  console.log('Default is read-only. --apply creates a scoped backup and writes only qz-managed files.')
  process.exit(args.length === 0 ? 2 : 0)
}
if (![ '--plan', '--check', '--apply' ].some(has)) throw new Error('elegí --plan, --check o --apply')

const names = ['opencode', 'claude', 'codex', 'gentle-shell']
const selected = value('--client') ? [value('--client')] : names
if (selected.some((name) => !names.includes(name))) throw new Error(`cliente inválido: ${selected.join(', ')}`)
const home = resolve(value('--home') || homedir())
const destination = {
  opencode: join(home, '.config/opencode/commands'),
  claude: join(home, '.claude/commands'),
  codex: join(home, '.codex/skills/qz-commands'),
  'gentle-shell': join(home, '.gentle-shell/agent/prompts')
}
const executable = {
  opencode: 'opencode',
  claude: 'claude',
  codex: 'codex',
  'gentle-shell': 'gentle-shell'
}
const commandFiles = manifest.commands.map((entry) => ({ ...entry, sourcePath: resolve(root, entry.source) }))
const skillSource = resolve(root, 'source/skills/qz-commands/SKILL.md')
const agentsSkillSource = resolve(root, 'source/skills/qz-agents/SKILL.md')
const qzSource = resolve(root, 'bin/qz')
const instructionsSource = resolve(root, 'source/instructions/AGENTS.md')
const agentFiles = readdirSync(resolve(root, 'source/agents')).filter((name) => name.startsWith('qz-') && name.endsWith('.md')).sort().map((name) => ({ id: name.slice(0, -3), sourcePath: resolve(root, 'source/agents', name) }))
const guardFiles = readdirSync(resolve(root, 'source/guards')).filter((name) => name.endsWith('.sh')).sort().map((name) => ({ id: name.slice(0, -3), sourcePath: resolve(root, 'source/guards', name) }))
const detect = (name) => {
  const result = spawnSync('command', ['-v', executable[name]], { shell: true, encoding: 'utf8' })
  return { detected: result.status === 0, executable: result.status === 0 ? result.stdout.trim() : null }
}
const clients = Object.fromEntries(selected.map((name) => [name, detect(name)]))
const targets = []
targets.push({ client: 'kit', id: 'qz', source: qzSource, target: join(home, '.local/bin/qz'), executable: true })
targets.push({ client: 'kit', id: 'AGENTS', source: instructionsSource, target: join(home, '.config/qz-agent-kit/instructions/AGENTS.md'), executable: false })
for (const guard of guardFiles) targets.push({ client: 'kit', id: guard.id, source: guard.sourcePath, target: join(home, '.config/qz-agent-kit/guards', guard.id + '.sh'), executable: true })
for (const client of selected) {
  if (!clients[client].detected && !value('--home')) continue
  for (const entry of commandFiles) {
    const target = client === 'codex'
      ? join(destination[client], entry.id + '.md')
      : join(destination[client], entry.id + '.md')
    targets.push({ client, id: entry.id, source: entry.sourcePath, target, executable: false })
  }
  if (client === 'codex') targets.push({ client, id: 'qz-commands-skill', source: skillSource, target: join(home, '.codex/skills/qz-commands/SKILL.md'), executable: false })
  if (client === 'gentle-shell') targets.push({ client, id: 'qz-commands-skill', source: skillSource, target: join(home, '.gentle-shell/agent/skills/qz-commands/SKILL.md'), executable: false })
  if (client === 'codex') targets.push({ client, id: 'qz-agents-skill', source: agentsSkillSource, target: join(home, '.codex/skills/qz-agents/SKILL.md'), executable: false })
  for (const agent of agentFiles) {
    const agentTarget = client === 'codex' ? join(home, '.codex/skills/qz-agents', agent.id + '.md') : client === 'gentle-shell' ? join(home, '.gentle-shell/agent/agents', agent.id + '.md') : join(home, client === 'opencode' ? '.config/opencode/agents' : '.claude/agents', agent.id + '.md')
    targets.push({ client, id: agent.id, source: agent.sourcePath, target: agentTarget, executable: false })
  }
}
const missing = [...(!existsSync(qzSource) ? ['qz'] : []), ...(!existsSync(instructionsSource) ? ['AGENTS'] : []), ...guardFiles.filter((entry) => !existsSync(entry.sourcePath)).map((entry) => entry.id), ...commandFiles.filter((entry) => !existsSync(entry.sourcePath)).map((entry) => entry.id), ...agentFiles.filter((entry) => !existsSync(entry.sourcePath)).map((entry) => entry.id), ...(!existsSync(skillSource) ? ['qz-commands-skill'] : []), ...(!existsSync(agentsSkillSource) ? ['qz-agents-skill'] : [])]
const drift = targets.filter(({ source, target }) => existsSync(target) && createHash('sha256').update(readFileSync(source)).digest('hex') !== createHash('sha256').update(readFileSync(target)).digest('hex')).map(({ client, id, target }) => ({ client, id, target }))
const contentDrift = contentManifest
  ? contentManifest.content.filter(({ path, sha256 }) => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex') !== sha256).map(({ path }) => path)
  : ['manifests/qz-content-manifest.json']
const result = {
  mode: has('--apply') ? 'apply' : has('--check') ? 'check' : 'plan',
  kit: manifest.manifestId,
  version: manifest.schemaVersion,
  selected,
  clients,
  targets: targets.length,
  missing,
  drift,
  contentDrift,
  mutations: has('--apply') ? 'scoped qz-managed files only' : 'none',
  secretValues: 'not-read'
}

if (!has('--apply')) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(missing.length || contentDrift.length ? 1 : 0)
}
if (missing.length) throw new Error(`faltan fuentes: ${missing.join(', ')}`)

const backupRoot = join(home, '.local/state/qz-agent-kit/backups', new Date().toISOString().replaceAll(':', '-'))
mkdirSync(backupRoot, { recursive: true })
const backed = []
for (const item of targets) {
  if (existsSync(item.target)) {
    const backup = join(backupRoot, item.client, item.id + (item.executable ? '' : '.md'))
    mkdirSync(join(backupRoot, item.client), { recursive: true })
    copyFileSync(item.target, backup)
    backed.push({ target: item.target, backup })
  }
  mkdirSync(dirname(item.target), { recursive: true })
  copyFileSync(item.source, item.target)
  if (item.executable) chmodSync(item.target, 0o755)
}
const installManifest = { kit: manifest.manifestId, sourceVersion: manifest.schemaVersion, installedAt: new Date().toISOString(), clients: selected, targets: targets.map(({ client, id, target }) => ({ client, id, target })), backups: backed, rollback: backupRoot, secrets: 'values-not-read' }
writeFileSync(join(backupRoot, 'install-manifest.json'), `${JSON.stringify(installManifest, null, 2)}\n`)
console.log(JSON.stringify({ ...result, backup: backupRoot, installed: targets.length, rollbackManifest: join(backupRoot, 'install-manifest.json') }, null, 2))
