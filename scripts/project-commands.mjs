#!/usr/bin/env node
/** List the commands declared by the current project's adapter. Read-only. */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const args = process.argv.slice(2)
const json = args.includes('--json')
const findRoot = (start) => {
  let current = resolve(start)
  while (true) {
    if (existsSync(join(current, '.qz/project.json'))) return current
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
}
const root = findRoot(process.cwd())
if (!root) {
  console.error('qz commands: no encontré .qz/project.json')
  process.exit(1)
}
const manifest = join(root, '.qz/project.json')
const config = JSON.parse(readFileSync(manifest, 'utf8'))
const commands = Array.isArray(config.commands?.registry) ? config.commands.registry : []
const result = {
  projectRoot: root,
  projectId: config.projectId,
  adapter: config.adapter,
  projectPrefix: config.commands?.projectPrefix || null,
  commands: commands.map((entry) => ({
    id: entry.id,
    delegate: entry.delegate,
    description: entry.description,
    mutates: entry.mutates === true,
    clients: entry.clients || ['opencode', 'claude', 'codex', 'gentle-shell']
  })),
  mutations: 'none',
  secretValues: 'not-read'
}
if (json) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(`${result.projectId || '(sin proyecto)'} · adapter=${result.adapter || '(sin adapter)'}`)
  if (result.commands.length === 0) {
    console.log('No hay comandos propios declarados.')
  } else {
    for (const command of result.commands) {
      const mode = command.mutates ? 'mutates' : 'read-only'
      console.log(`- ${command.id} → ${command.delegate} · ${mode} · ${command.description}`)
    }
  }
}
