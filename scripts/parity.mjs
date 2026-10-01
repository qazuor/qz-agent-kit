#!/usr/bin/env node
/** Read-only parity check for the portable qz layer in all supported CLIs. */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const json = args.includes('--json')
const home = resolve(args.includes('--home') ? args[args.indexOf('--home') + 1] : homedir())
const clients = {
  opencode: join(home, '.config/opencode/skills'),
  claude: join(home, '.claude/skills'),
  codex: join(home, '.codex/skills'),
  'gentle-shell': join(home, '.gentle-shell/agent/skills')
}
const resources = [
  ['qz-output-style', 'source/skills/qz-output-style/SKILL.md'],
  ['qz-permissions', 'source/skills/qz-permissions/SKILL.md']
]
const hash = (path) => existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null
const rows = []
for (const [client, skillRoot] of Object.entries(clients)) {
  for (const [id, source] of resources) {
    const sourcePath = join(root, source)
    const target = join(skillRoot, id, 'SKILL.md')
    const sourceHash = hash(sourcePath)
    const targetHash = hash(target)
    rows.push({ client, id, target, state: targetHash === null ? 'missing' : targetHash === sourceHash ? 'current' : 'drift' })
  }
}
const claudeOutputStyle = join(home, '.claude/output-styles/qz-output-style.md')
const outputStyleSource = join(root, 'source/skills/qz-output-style/SKILL.md')
const nativeStyleState = !existsSync(claudeOutputStyle) ? 'missing' : hash(claudeOutputStyle) === hash(outputStyleSource) ? 'current' : 'drift'
const native = {
  opencode: { path: join(home, '.config/opencode/AGENTS.md'), status: existsSync(join(home, '.config/opencode/AGENTS.md')) ? 'existing-needs-merge' : 'missing', note: 'OpenCode V1 requiere una estrategia de merge; no se sobrescribe el AGENTS global automáticamente' },
  claude: { path: claudeOutputStyle, status: nativeStyleState, note: 'el output style nativo se gestiona con backup y drift; la selección automática queda separada' },
  codex: { path: join(home, '.codex/AGENTS.md'), status: existsSync(join(home, '.codex/AGENTS.md')) ? 'existing-needs-merge' : 'missing', note: 'Codex reconoce AGENTS global; qz-kit no debe reemplazar uno existente sin merge explícito' },
  'gentle-shell': { path: join(home, '.gentle-shell/agent/APPEND_SYSTEM.md'), status: 'gentle-owned', note: 'APPEND_SYSTEM pertenece a Gentle Shell; qz-kit no lo crea ni lo sobrescribe' }
}
const result = {
  clients: Object.keys(clients),
  portable: { resources: resources.map(([id]) => id), rows, missing: rows.filter((row) => row.state === 'missing').length, drift: rows.filter((row) => row.state === 'drift').length },
  nativeOutputStyle: { client: 'claude', target: claudeOutputStyle, state: nativeStyleState },
  native,
  valid: rows.every((row) => row.state === 'current') && nativeStyleState === 'current',
  mutations: 'none',
  secretValues: 'not-read'
}
if (json) console.log(JSON.stringify(result, null, 2))
else {
  console.log('qz-kit · paridad de la capa portable')
  for (const row of rows) console.log(`  ${row.state === 'current' ? '✓' : '·'} ${row.client.padEnd(12)} ${row.id.padEnd(18)} ${row.state}`)
  console.log(`  portable: ${result.portable.missing === 0 && result.portable.drift === 0 ? 'completa' : `${result.portable.missing} faltantes, ${result.portable.drift} con drift`}`)
  console.log(`  Claude output style: ${nativeStyleState}`)
  console.log('  mutaciones: ninguna · secretos: no leídos')
}
process.exit(result.valid ? 0 : 1)
