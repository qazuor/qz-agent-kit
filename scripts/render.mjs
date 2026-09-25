#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
if (args.includes('--help') || args.length === 0) {
  console.log('Usage: node scripts/render.mjs --client <opencode|claude|codex|gentle-shell> --output <dir>')
  process.exit(args.length === 0 ? 2 : 0)
}
const client = value('--client')
const output = value('--output')
if (!['opencode', 'claude', 'codex', 'gentle-shell'].includes(client) || !output) throw new Error('client y output son obligatorios')
const destination = resolve(output)
const source = resolve(root, 'source/commands')
const commands = readdirSync(source).filter((name) => name.startsWith('qz-') && name.endsWith('.md')).sort()
mkdirSync(destination, { recursive: true })

if (client === 'gentle-shell') {
  const prompts = join(destination, 'prompts')
  mkdirSync(prompts, { recursive: true })
  for (const name of commands) cpSync(join(source, name), join(prompts, name))
  mkdirSync(join(destination, 'skills', 'qz-commands'), { recursive: true })
  cpSync(resolve(root, 'source/skills/qz-commands/SKILL.md'), join(destination, 'skills/qz-commands/SKILL.md'))
} else if (client === 'codex') {
  const skill = join(destination, 'skills', 'qz-commands')
  mkdirSync(skill, { recursive: true })
  cpSync(resolve(root, 'source/skills/qz-commands/SKILL.md'), join(skill, 'SKILL.md'))
  for (const name of commands) cpSync(join(source, name), join(skill, name))
} else {
  const commandsDir = join(destination, 'commands')
  mkdirSync(commandsDir, { recursive: true })
  for (const name of commands) cpSync(join(source, name), join(commandsDir, name))
}

const manifest = JSON.parse(readFileSync(resolve(root, 'manifests/qz-command-manifest.json'), 'utf8'))
writeFileSync(join(destination, 'manifest.json'), `${JSON.stringify({ manifestId: manifest.manifestId, client, commands: manifest.commands }, null, 2)}\n`)
console.log(JSON.stringify({ client, output: destination, commands: commands.length, mutations: [destination] }, null, 2))
