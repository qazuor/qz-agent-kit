#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const fail = (message) => { console.error(`qz gentle bloqueado: ${message}`); process.exit(2) }
if (args.length === 0 || args.includes('--help')) {
  console.log(`qz gentle — wrapper read-only de Gentle AI

Permitidos:
  version | doctor | sdd-status [change] | review status [--cwd <repo>]
  telemetry status [--json] | update

Install, sync, upgrade, uninstall, restore, review mutations y telemetry
enable/disable/trigger quedan bloqueados.`)
  process.exit(0)
}

const first = args[0]
const valid = first === 'version' || first === 'doctor' || first === 'update' || first === 'sdd-status' || (first === 'review' && args[1] === 'status') || (first === 'telemetry' && args[1] === 'status')
if (!valid) fail('comando no incluido en la allowlist read-only')

const result = spawnSync('gentle-ai', args, { stdio: 'inherit', windowsHide: true, shell: false, env: process.env })
if (result.error) { console.error(`qz gentle: no se pudo ejecutar Gentle AI (${result.error.code || result.error.message})`); process.exit(1) }
process.exit(result.status ?? 1)
