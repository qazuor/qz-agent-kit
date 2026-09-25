#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const command = args.shift() || 'help'
const home = resolve(process.env.QZ_KIT_HOME || homedir())
const stateDir = join(home, '.config/qz-agent-kit')
const registryPath = join(stateDir, 'projects.json')
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }

const readRegistry = () => {
  if (!existsSync(registryPath)) return { schemaVersion: 1, projects: [] }
  return JSON.parse(readFileSync(registryPath, 'utf8'))
}
const writeRegistry = (registry) => {
  mkdirSync(stateDir, { recursive: true })
  const temp = `${registryPath}.tmp-${process.pid}`
  writeFileSync(temp, `${JSON.stringify(registry, null, 2)}\n`)
  renameSync(temp, registryPath)
}
const print = (data) => console.log(JSON.stringify(data, null, 2))

if (command === 'list') {
  print({ ...readRegistry(), registry: registryPath, mutations: 'none', secretValues: 'not-read' })
  process.exit(0)
}
if (command === 'register') {
  const projectRoot = resolve(args[0] || '')
  if (!args[0] || !existsSync(join(projectRoot, '.qz/project.json'))) throw new Error('el proyecto debe tener .qz/project.json')
  const config = JSON.parse(readFileSync(join(projectRoot, '.qz/project.json'), 'utf8'))
  const id = value('--id') || config.projectId
  const adapter = value('--adapter') || config.adapter
  const registry = readRegistry()
  const entry = { id, root: projectRoot, adapter, registeredAt: new Date().toISOString() }
  registry.projects = [...registry.projects.filter((item) => item.id !== id), entry].sort((a, b) => a.id.localeCompare(b.id))
  writeRegistry(registry)
  print({ registered: entry, registry: registryPath, mutations: [registryPath], secretValues: 'not-read' })
  process.exit(0)
}
if (command === 'validate') {
  const projectRoot = resolve(args[0] || '')
  const script = resolve(new URL('./validate-project.mjs', import.meta.url).pathname)
  const result = spawnSync(process.execPath, [script, projectRoot], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}
console.log('Uso: qz-kit project list | register <path> [--id <id>] [--adapter <adapter>] | validate <path>')
process.exit(command === 'help' ? 0 : 2)
