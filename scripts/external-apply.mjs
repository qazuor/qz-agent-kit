#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
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
const project = value('--project')
const backupPath = value('--backup') ? resolve(value('--backup')) : null
const planPath = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
const home = resolve(value('--home') || homedir())
const fail = (message) => { console.error(`external-apply bloqueado: ${message}`); process.exit(2) }
if (!['gentle-ai', 'engram'].includes(component)) fail('componentes soportados: gentle-ai, engram')
if (component === 'engram') {
  if (approval !== 'ENGRAM_APPLY') fail('falta --approve ENGRAM_APPLY')
  if (!project) fail('falta --project <nombre>')
  if (!backupPath || !existsSync(backupPath)) fail('Engram requiere --backup <manifest.json>')
} else if (approval !== 'GENTLE_AI_APPLY') fail('falta --approve GENTLE_AI_APPLY')
if (!receiptPath) fail('falta --receipt <preview-receipt.json>')
if (!existsSync(planPath)) fail(`no existe el plan: ${planPath}`)
if (!existsSync(resolve(receiptPath))) fail(`no existe el receipt: ${resolve(receiptPath)}`)
const plan = assertValidPlan(JSON.parse(readFileSync(planPath, 'utf8')))
const receipt = JSON.parse(readFileSync(resolve(receiptPath), 'utf8'))
if (receipt.type !== 'qz-external-preview-receipt' || receipt.schemaVersion !== 1) fail('receipt incompatible')
if (receipt.plan !== planPath) fail('el receipt no corresponde al plan indicado')
const result = receipt.results?.find((item) => item.component === component)
if (!result || result.status !== 'ok') fail('el preview del componente no terminó en ok')
if (!/^[a-f0-9]{64}$/.test(result.outputSha256 || '') || result.output !== 'not-included' || result.mutations !== 'none' || result.secretValues !== 'not-read') {
  fail('el resultado del preview no cumple el contrato seguro')
}
const manifestPath = resolve(root, `adapters/${component}/manifest.json`)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const command = manifest.installPlan?.command
if (typeof command !== 'string' || (component === 'gentle-ai' && !command.startsWith('gentle-ai install ')) || (component === 'engram' && command !== 'engram setup opencode --protocol=full')) fail('manifest sin comando de instalación permitido')
if (/[;&|><`$(){}]/.test(command)) fail('comando del manifest contiene shell')
const tokens = command.match(/[^\s"']+|"[^"]*"|'[^']*'/g)?.map((token) => token.replace(/^(['"]).*\1$/, (quoted) => quoted.slice(1, -1))) || []
if (component === 'gentle-ai' && (!tokens.includes('--agent') || !tokens.includes('--scope') || tokens[0] !== 'gentle-ai')) fail('comando del manifest no cumple allowlist')
if (component === 'engram' && (tokens.length !== 4 || tokens[0] !== 'engram' || tokens[1] !== 'setup' || tokens[2] !== 'opencode' || tokens[3] !== '--protocol=full')) fail('comando de Engram no cumple allowlist')
const engramBackup = component === 'engram' ? JSON.parse(readFileSync(backupPath, 'utf8')) : null
if (component === 'engram') {
  if (engramBackup.type !== 'qz-engram-backup' || engramBackup.schemaVersion !== 1 || engramBackup.backup?.integrity !== 'ok' || engramBackup.project !== project) fail('manifest de backup Engram incompatible')
  if (!existsSync(resolve(backupPath, '..', engramBackup.backup.database))) fail('no existe la DB indicada en el backup Engram')
}
const backupStatus = (phase) => {
  if (component === 'engram') {
    const probe = spawnSync(process.execPath, [resolve(root, 'scripts/external-backup-status.mjs'), '--component', 'engram', '--home', home, '--project', project], { encoding: 'utf8', timeout: 30000 })
    let parsed = null
    try { parsed = JSON.parse(probe.stdout) } catch {}
    return { phase, status: probe.status === 0 ? 'ok' : 'error', dataDir: parsed?.dataDir || null, diagnostic: parsed?.diagnostic || null, mutations: 'none' }
  }
  const probe = spawnSync(process.execPath, [resolve(root, 'scripts/external-backup-status.mjs'), '--component', 'gentle-ai', '--home', home], { encoding: 'utf8', timeout: 10000 })
  let parsed = null
  try { parsed = JSON.parse(probe.stdout) } catch {}
  return { phase, status: probe.status === 0 ? 'ok' : 'error', statePresent: parsed?.state?.present === true, latestSnapshot: parsed?.snapshots?.latest?.id || null, latestChecksumPresent: parsed?.snapshots?.latest?.checksumPresent === true, snapshotCount: parsed?.snapshots?.count ?? null, mutations: 'none' }
}
const before = backupStatus('before')
if (before.status !== 'ok') fail('no se pudo verificar el estado de backup antes del apply')
if (component === 'engram' && (!engramBackup || before.dataDir?.present !== true)) fail('no se pudo verificar la DB activa de Engram')
if (before.statePresent && (!before.latestSnapshot || !before.latestChecksumPresent)) fail('el estado existente de Gentle AI no tiene un snapshot nativo verificable')
const applyEnv = { ...process.env, HOME: home }
const apply = spawnSync(tokens[0], tokens.slice(1), { stdio: 'inherit', timeout: 10 * 60 * 1000, windowsHide: true, env: applyEnv })
const after = backupStatus('after')
// Mantener el mismo HOME/PATH del apply evita validar accidentalmente otra instalación
// global y permite que el receipt sea reproducible en un entorno aislado.
const verificationArgs = component === 'engram' ? ['doctor', '--json', '--check', 'sqlite_lock_contention', '--project', project] : ['doctor']
const verification = spawnSync(component === 'engram' ? 'engram' : 'gentle-ai', verificationArgs, { stdio: 'ignore', timeout: 30000, windowsHide: true, env: applyEnv })
const nativeSnapshotChanged = Boolean(after.latestSnapshot && after.latestSnapshot !== before.latestSnapshot)
const output = { schemaVersion: 1, type: 'qz-external-apply-receipt', component, plan: planPath, previewReceipt: resolve(receiptPath), command: tokens, commandSha256: createHash('sha256').update(tokens.join('\0')).digest('hex'), before, apply: { exitCode: apply.status ?? null, status: apply.error?.code === 'ETIMEDOUT' ? 'timeout' : apply.status === 0 ? 'ok' : 'failed' }, after, nativeSnapshotChanged, verification: { doctorExitCode: verification.status ?? null, status: verification.status === 0 ? 'ok' : 'failed' }, mutations: 'external-apply', secretValues: 'not-read' }
console.log(JSON.stringify(output, null, 2))
if (component === 'gentle-ai' && (apply.status !== 0 || verification.status !== 0 || after.status !== 'ok' || !after.latestSnapshot || !after.latestChecksumPresent || !nativeSnapshotChanged)) process.exit(1)
if (component === 'engram' && (apply.status !== 0 || verification.status !== 0 || after.status !== 'ok')) process.exit(1)
