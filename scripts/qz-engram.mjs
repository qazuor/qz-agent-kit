#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const fail = (message) => { console.error(`qz engram bloqueado: ${message}`); process.exit(2) }
if (args.length === 0 || args.includes('--help')) {
  console.log(`qz engram — wrapper read-only de Engram

Permitidos:
  version | doctor | stats | projects list | search | context | timeline
  conflicts list | cloud status | test --quick --json

Las operaciones de escritura, exportación, importación, sync, setup y cloud
config quedan bloqueadas. Para una mutación se requiere el procedimiento
explícito del adapter y su aprobación separada.`)
  process.exit(0)
}

const forbidden = new Set(['save', 'delete', 'import', 'export', 'obsidian-export', 'sync', 'setup', 'consolidate', 'prune', 'enroll', 'config'])
if (args.some((arg) => forbidden.has(arg))) fail('la operación no es read-only')

const first = args[0]
const valid = first === 'version' || first === 'doctor' || first === 'stats' || first === 'search' || first === 'context' || first === 'timeline' || (first === 'projects' && args[1] === 'list') || (first === 'conflicts' && args[1] === 'list') || (first === 'cloud' && args[1] === 'status') || (first === 'test' && args.includes('--quick') && args.includes('--json'))
if (!valid) fail('comando no incluido en la allowlist read-only')

const result = spawnSync('engram', args, { stdio: 'inherit', windowsHide: true, shell: false, env: process.env })
if (result.error) { console.error(`qz engram: no se pudo ejecutar Engram (${result.error.code || result.error.message})`); process.exit(1) }
process.exit(result.status ?? 1)
