#!/usr/bin/env node
/** Plan/apply a bounded qz instruction block without replacing native content. */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const json = has('--json')
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
if (!has('--plan') && !has('--apply')) throw new Error('elegí --plan o --apply')
if (has('--apply') && value('--approve') !== 'QZ_INSTRUCTIONS_MERGE') throw new Error('instructions-merge --apply requiere --approve QZ_INSTRUCTIONS_MERGE')
const home = resolve(value('--home') || homedir())
const sourcePath = join(root, 'source/instructions/AGENTS.md')
const source = readFileSync(sourcePath, 'utf8').trim()
const sourceHash = createHash('sha256').update(source).digest('hex')
const start = '<!-- qz-agent-kit:instructions:start -->'
const end = '<!-- qz-agent-kit:instructions:end -->'
const block = `${start}\n\n## QZ portable instructions\n\n${source}\n\n${end}`
const targets = [
  { client: 'opencode', path: join(home, '.config/opencode/AGENTS.md'), mode: 'append-or-replace' },
  { client: 'codex', path: join(home, '.codex/AGENTS.md'), mode: 'create-or-replace' }
]
const plans = targets.map((target) => {
  const exists = existsSync(target.path)
  const before = exists ? readFileSync(target.path, 'utf8').trim() : ''
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm')
  const after = before.includes(start) ? before.replace(pattern, block) : before ? `${before}\n\n${block}` : block
  const beforeHash = createHash('sha256').update(before).digest('hex')
  const afterHash = createHash('sha256').update(after).digest('hex')
  return { ...target, exists, beforeBytes: Buffer.byteLength(before), afterBytes: Buffer.byteLength(after), beforeHash, afterHash, state: beforeHash === afterHash ? 'current' : exists ? 'merge-required' : 'create-required' }
})
const output = { source: 'source/instructions/AGENTS.md', sourceHash, targets: plans, mutations: has('--apply') ? 'bounded qz instruction files only' : 'none', secretValues: 'not-read' }
if (!has('--apply')) {
  if (json) console.log(JSON.stringify(output, null, 2))
  else {
    console.log('qz-kit · plan de merge de instrucciones')
    for (const item of plans) console.log(`  ${item.state === 'current' ? '✓' : '·'} ${item.client.padEnd(10)} ${item.state.padEnd(18)} ${item.path}`)
    console.log('  alcance: bloque qz acotado en OpenCode y Codex · mutaciones: ninguna')
    console.log('  para aplicar: --apply --approve QZ_INSTRUCTIONS_MERGE')
  }
  process.exit(plans.some((item) => item.state !== 'current') ? 1 : 0)
}
const backupRoot = join(home, '.local/state/qz-agent-kit/instruction-backups', new Date().toISOString().replaceAll(':', '-'))
mkdirSync(backupRoot, { recursive: true })
const applied = []
for (const [index, target] of targets.entries()) {
  const plan = plans[index]
  if (plan.state === 'current') continue
  if (plan.exists) {
    const backup = join(backupRoot, target.client, 'AGENTS.md')
    mkdirSync(dirname(backup), { recursive: true })
    copyFileSync(target.path, backup)
    applied.push({ client: target.client, path: target.path, backup })
  }
  const before = plan.exists ? readFileSync(target.path, 'utf8').trim() : ''
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm')
  const after = before.includes(start) ? before.replace(pattern, block) : before ? `${before}\n\n${block}` : block
  mkdirSync(dirname(target.path), { recursive: true })
  writeFileSync(target.path, `${after}\n`)
}
writeFileSync(join(backupRoot, 'merge-receipt.json'), `${JSON.stringify({ ...output, applied, backup: backupRoot }, null, 2)}\n`, { mode: 0o600 })
const appliedOutput = { ...output, applied, backup: backupRoot }
if (json) console.log(JSON.stringify(appliedOutput, null, 2))
else {
  console.log('qz-kit · merge aplicado')
  for (const item of applied) console.log(`  ✓ ${item.client}: ${item.path}`)
  console.log(`  backup: ${backupRoot}`)
  console.log('  secretos: no leídos')
}
