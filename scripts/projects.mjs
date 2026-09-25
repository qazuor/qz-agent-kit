#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
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
  let backup = null
  if (existsSync(registryPath)) {
    const backupDir = join(stateDir, 'backups')
    mkdirSync(backupDir, { recursive: true })
    backup = join(backupDir, `projects-${new Date().toISOString().replaceAll(':', '-')}.json`)
    copyFileSync(registryPath, backup)
  }
  const temp = `${registryPath}.tmp-${process.pid}`
  writeFileSync(temp, `${JSON.stringify(registry, null, 2)}\n`)
  renameSync(temp, registryPath)
  return backup
}
const print = (data) => console.log(JSON.stringify(data, null, 2))

if (command === 'list') {
  print({ ...readRegistry(), registry: registryPath, mutations: 'none', secretValues: 'not-read' })
  process.exit(0)
}
if (command === 'init') {
  const initializer = resolve(new URL('./project-init.mjs', import.meta.url).pathname)
  const result = spawnSync(process.execPath, [initializer, ...args], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}
if (command === 'register') {
  const projectRoot = resolve(args[0] || '')
  if (!args[0] || !existsSync(join(projectRoot, '.qz/project.json'))) throw new Error('el proyecto debe tener .qz/project.json')
  const config = JSON.parse(readFileSync(join(projectRoot, '.qz/project.json'), 'utf8'))
  const validator = resolve(new URL('./validate-project.mjs', import.meta.url).pathname)
  const validation = spawnSync(process.execPath, [validator, projectRoot], { encoding: 'utf8' })
  let validationResult = null
  if (validation.stdout) {
    try { validationResult = JSON.parse(validation.stdout) } catch { validationResult = { output: validation.stdout.trim() } }
  }
  if (validation.status !== 0) {
    if (validation.stdout) process.stdout.write(validation.stdout)
    throw new Error('el proyecto no se registró porque su adapter es inválido')
  }
  const id = value('--id') || config.projectId
  const adapter = value('--adapter') || config.adapter
  const registry = readRegistry()
  const entry = { id, root: projectRoot, adapter, registeredAt: new Date().toISOString() }
  registry.projects = [...registry.projects.filter((item) => item.id !== id), entry].sort((a, b) => a.id.localeCompare(b.id))
  const backup = writeRegistry(registry)
  print({ registered: entry, validation: validationResult, registry: registryPath, backup, mutations: [registryPath, ...(backup ? [backup] : [])], secretValues: 'not-read' })
  process.exit(0)
}
if (command === 'restore') {
  const backupPath = resolve(args[0] || '')
  if (!args[0] || !existsSync(backupPath)) throw new Error('falta un backup existente del registry')
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'))
  if (backup.schemaVersion !== 1 || !Array.isArray(backup.projects)) throw new Error('backup de registry inválido')
  const current = readRegistry()
  const saved = writeRegistry(backup)
  print({ restoredFrom: backupPath, previous: current.projects.length, restored: backup.projects.length, registry: registryPath, backup: saved, mutations: [registryPath, ...(saved ? [saved] : [])], secretValues: 'not-read' })
  process.exit(0)
}
if (command === 'unregister') {
  const id = args[0]
  if (!id) throw new Error('falta el id del proyecto')
  const registry = readRegistry()
  const previous = registry.projects.length
  registry.projects = registry.projects.filter((item) => item.id !== id)
  if (registry.projects.length === previous) throw new Error(`no existe el proyecto registrado: ${id}`)
  const backup = writeRegistry(registry)
  print({ unregistered: id, registry: registryPath, backup, mutations: [registryPath, ...(backup ? [backup] : [])], secretValues: 'not-read' })
  process.exit(0)
}
if (command === 'validate') {
  const projectRoot = resolve(args[0] || '')
  const script = resolve(new URL('./validate-project.mjs', import.meta.url).pathname)
  const result = spawnSync(process.execPath, [script, projectRoot], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}
if (command === 'inspect') {
  const registry = readRegistry()
  const projects = registry.projects.map((project) => {
    const manifest = join(project.root, '.qz/project.json')
    const result = spawnSync(process.execPath, [resolve(new URL('./validate-project.mjs', import.meta.url).pathname), project.root], { encoding: 'utf8' })
    return { ...project, manifest, exists: existsSync(manifest), valid: result.status === 0, validatorOutput: result.stdout?.trim() || null }
  })
  print({ registry: registryPath, projects, mutations: 'none', secretValues: 'not-read' })
  process.exit(projects.every((project) => project.exists && project.valid) ? 0 : 1)
}
console.log('Uso: qz-kit project list | init [path] [--plan|--apply] | register <path> [--id <id>] [--adapter <adapter>] | unregister <id> | restore <backup.json> | validate <path> | inspect')
process.exit(command === 'help' ? 0 : 2)
