#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { assertValidPlan } from './plan-schema.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const component = value('--component')
const receiptPath = value('--receipt')
const approval = value('--approve')
const planPath = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
const home = resolve(value('--home') || homedir())
const fail = (message) => { console.error(`external-apply bloqueado: ${message}`); process.exit(2) }
if (component !== 'gentle-ai') fail('por ahora sólo existe el apply explícito de Gentle AI')
if (approval !== 'GENTLE_AI_APPLY') fail('falta --approve GENTLE_AI_APPLY')
if (!receiptPath) fail('falta --receipt <preview-receipt.json>')
if (!existsSync(planPath)) fail(`no existe el plan: ${planPath}`)
if (!existsSync(resolve(receiptPath))) fail(`no existe el receipt: ${resolve(receiptPath)}`)
const plan = assertValidPlan(JSON.parse(readFileSync(planPath, 'utf8')))
const receipt = JSON.parse(readFileSync(resolve(receiptPath), 'utf8'))
if (receipt.type !== 'qz-external-preview-receipt' || receipt.schemaVersion !== 1) fail('receipt incompatible')
if (receipt.plan !== planPath) fail('el receipt no corresponde al plan indicado')
const result = receipt.results?.find((item) => item.component === component)
if (!result || result.status !== 'ok') fail('el preview del componente no terminó en ok')
const manifestPath = resolve(root, 'adapters/gentle-ai/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const command = manifest.installPlan?.command
if (typeof command !== 'string' || !command.startsWith('gentle-ai install ')) fail('manifest sin comando de instalación permitido')
if (/[;&|><`$(){}]/.test(command)) fail('comando del manifest contiene shell')
const tokens = command.match(/[^\s"']+|"[^"]*"|'[^']*'/g)?.map((token) => token.replace(/^(['"]).*\1$/, (quoted) => quoted.slice(1, -1))) || []
if (!tokens.includes('--agent') || !tokens.includes('--scope') || tokens[0] !== 'gentle-ai') fail('comando del manifest no cumple allowlist')
const backupStatus = (phase) => {
  const probe = spawnSync(process.execPath, [resolve(root, 'scripts/external-backup-status.mjs'), '--component', 'gentle-ai', '--home', home], { encoding: 'utf8', timeout: 10000 })
  let parsed = null
  try { parsed = JSON.parse(probe.stdout) } catch {}
  return { phase, status: probe.status === 0 ? 'ok' : 'error', latestSnapshot: parsed?.snapshots?.latest?.id || null, snapshotCount: parsed?.snapshots?.count ?? null, mutations: 'none' }
}
const before = backupStatus('before')
const apply = spawnSync(tokens[0], tokens.slice(1), { stdio: 'inherit', timeout: 10 * 60 * 1000, windowsHide: true })
const after = backupStatus('after')
// Mantener el mismo HOME/PATH del apply evita validar accidentalmente otra instalación
// global y permite que el receipt sea reproducible en un entorno aislado.
const verification = spawnSync('gentle-ai', ['doctor'], { stdio: 'ignore', timeout: 30000, windowsHide: true, env: process.env })
const output = { schemaVersion: 1, type: 'qz-external-apply-receipt', component, plan: planPath, previewReceipt: resolve(receiptPath), command: tokens, before, apply: { exitCode: apply.status ?? null, status: apply.error?.code === 'ETIMEDOUT' ? 'timeout' : apply.status === 0 ? 'ok' : 'failed' }, after, nativeSnapshotChanged: Boolean(after.latestSnapshot && after.latestSnapshot !== before.latestSnapshot), verification: { doctorExitCode: verification.status ?? null, status: verification.status === 0 ? 'ok' : 'failed' }, mutations: 'external-apply', secretValues: 'not-read' }
console.log(JSON.stringify(output, null, 2))
if (apply.status !== 0 || verification.status !== 0) process.exit(1)
