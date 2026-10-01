#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const fail = (message) => { console.error(`qz engram bloqueado: ${message}`); process.exit(2) }
if (args.length === 0 || args.includes('--help')) {
  console.log(`qz engram — wrapper read-only de Engram

Permitidos:
  version | doctor | stats | projects list | search | context | timeline
  conflicts list | cloud status | test --quick --json

Escritura explícita:
  save <title> <content> --project <name> --confirm ENGRAM_SAVE

Las demás operaciones de escritura, exportación, importación, sync, setup y
cloud config quedan bloqueadas. save exige proyecto explícito y confirmación
para evitar resolver una sesión ambigua o escribir en el proyecto equivocado.`)
  process.exit(0)
}

const forbidden = new Set(['delete', 'import', 'export', 'obsidian-export', 'sync', 'setup', 'consolidate', 'prune', 'enroll', 'config'])
const first = args[0]

if (first === 'save') {
  const projectIndex = args.indexOf('--project')
  const confirmIndex = args.indexOf('--confirm')
  const project = projectIndex >= 0 ? args[projectIndex + 1] : null
  const confirmation = confirmIndex >= 0 ? args[confirmIndex + 1] : null
  if (!project || project.startsWith('-')) fail('save requiere --project <nombre>')
  if (confirmation !== 'ENGRAM_SAVE') fail('save requiere --confirm ENGRAM_SAVE')
  const payload = args.filter((arg, index) => index !== confirmIndex && index !== confirmIndex + 1)
  const result = spawnSync('engram', payload, { stdio: 'inherit', windowsHide: true, shell: false, env: { ...process.env, ENGRAM_PROJECT: project } })
  if (result.error) { console.error(`qz engram: no se pudo ejecutar Engram (${result.error.code || result.error.message})`); process.exit(1) }
  process.exit(result.status ?? 1)
}

if (args.some((arg) => forbidden.has(arg))) fail('la operación no es read-only')

const valid = first === 'version' || first === 'doctor' || first === 'stats' || first === 'search' || first === 'context' || first === 'timeline' || (first === 'projects' && args[1] === 'list') || (first === 'conflicts' && args[1] === 'list') || (first === 'cloud' && args[1] === 'status') || (first === 'test' && args.includes('--quick') && args.includes('--json'))
if (!valid) fail('comando no incluido en la allowlist read-only')

const result = spawnSync('engram', args, { stdio: 'inherit', windowsHide: true, shell: false, env: process.env })
if (result.error) { console.error(`qz engram: no se pudo ejecutar Engram (${result.error.code || result.error.message})`); process.exit(1) }
process.exit(result.status ?? 1)
