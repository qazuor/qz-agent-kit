#!/usr/bin/env node
// Bootstraps only adapter-declared binaries. No shell is used and no command
// is accepted from the user or from a project configuration file.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { assertValidPlan } from './plan-schema.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const component = value('--component')
const approval = value('--approve')
const planPath = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
const output = value('--receipt') ? resolve(value('--receipt')) : null
const fail = (message) => { console.error(`external-bootstrap bloqueado: ${message}`); process.exit(2) }
if (!component || !['gentle-ai', 'engram'].includes(component)) fail('componente no allowlisted')
if (approval !== 'QZ_EXTERNAL_BOOTSTRAP') fail('falta --approve QZ_EXTERNAL_BOOTSTRAP')
if (!existsSync(planPath)) fail(`no existe el plan: ${planPath}`)
assertValidPlan(JSON.parse(readFileSync(planPath, 'utf8')))
const manifestPath = resolve(root, `adapters/${component}/manifest.json`)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const tokens = manifest.bootstrap?.tokens
if (!Array.isArray(tokens) || tokens.length < 2 || tokens.some((token) => typeof token !== 'string' || !token || /[;&|><`$(){}]/.test(token))) fail('manifest sin bootstrap allowlisted')
if (tokens[0] !== 'go' || tokens[1] !== 'install') fail('bootstrap debe usar go install')
const go = spawnSync('command', ['-v', 'go'], { shell: true, encoding: 'utf8' })
if (go.status !== 0) fail('Go no está disponible; instalar Go manualmente antes del bootstrap')
const startedAt = new Date().toISOString()
const result = spawnSync(tokens[0], tokens.slice(1), { encoding: 'utf8', timeout: 15 * 60 * 1000, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
const outputText = `${result.stdout || ''}\n${result.stderr || ''}`
const receipt = {
  schemaVersion: 1,
  type: 'qz-external-bootstrap-receipt',
  component,
  startedAt,
  finishedAt: new Date().toISOString(),
  command: tokens,
  commandSha256: createHash('sha256').update(tokens.join('\0')).digest('hex'),
  status: result.error?.code === 'ETIMEDOUT' ? 'timeout' : result.status === 0 ? 'ok' : 'failed',
  exitCode: result.status ?? null,
  outputBytes: Buffer.byteLength(outputText),
  outputSha256: createHash('sha256').update(outputText).digest('hex'),
  output: 'not-included',
  mutations: 'external-bootstrap',
  secretValues: 'not-read'
}
if (output) { mkdirSync(resolve(output, '..'), { recursive: true, mode: 0o700 }); writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 }) }
console.log(JSON.stringify({ ...receipt, receipt: output }, null, 2))
if (receipt.status !== 'ok') process.exit(1)
