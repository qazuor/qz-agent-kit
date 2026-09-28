#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { assertValidPlan } from './plan-schema.mjs'

// Execute only an adapter-declared preview. Never invokes a shell and never
// prints the command output, because previews can still mention paths or
// provider details that do not belong in a receipt.
const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const strict = args.includes('--strict')
const receiptPath = value('--receipt') ? resolve(value('--receipt')) : null
const forceReceipt = args.includes('--force-receipt')
const planPath = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
if (!existsSync(planPath)) throw new Error(`no se encontró el plan: ${planPath}`)
const plan = assertValidPlan(JSON.parse(readFileSync(planPath, 'utf8')))
const selected = value('--component') ? [value('--component')] : plan.components || []
const project = value('--project')
const manifests = Object.fromEntries(readdirSync(resolve(root, 'adapters')).flatMap((adapter) => {
  const path = resolve(root, 'adapters', adapter, 'manifest.json')
  if (!existsSync(path)) return []
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  return [[manifest.id, manifest]]
}))

const forbiddenShell = /[;&|><`$(){}]/
const tokenize = (command) => {
  if (typeof command !== 'string' || !command.trim() || forbiddenShell.test(command)) return null
  const tokens = command.match(/[^\s"']+|"[^"]*"|'[^']*'/g)?.map((token) => token.replace(/^(["']).*\1$/, (quoted) => quoted.slice(1, -1))) || []
  return tokens.length ? tokens : null
}
const previewFor = (id, manifest) => {
  if (!manifest?.installPlan?.preview) return { status: 'pending-adapter', reason: 'manifest sin installPlan.preview' }
  const command = manifest.installPlan.preview.replaceAll('<project>', project || '')
  if (manifest.installPlan.preview.includes('<project>') && !project) return { status: 'needs-project', reason: 'el preview requiere --project' }
  const tokens = tokenize(command)
  if (!tokens) return { status: 'blocked', reason: 'preview rechazado por contener shell o estar vacío' }
  if (id === 'gentle-ai' && (!tokens.includes('--dry-run') || tokens[0] !== 'gentle-ai')) return { status: 'blocked', reason: 'preview de Gentle AI debe usar gentle-ai install --dry-run' }
  if (id === 'engram' && (tokens[0] !== 'engram' || !tokens.includes('doctor') || !tokens.includes('--check'))) return { status: 'blocked', reason: 'preview de Engram debe usar doctor con check explícito' }
  const probe = spawnSync(tokens[0], tokens.slice(1), { encoding: 'utf8', timeout: 30000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const output = `${probe.stdout || ''}\n${probe.stderr || ''}`
  const timedOut = probe.error?.code === 'ETIMEDOUT'
  return {
    status: timedOut ? 'timeout' : probe.error ? 'unavailable' : probe.status === 0 ? 'ok' : 'failed',
    executable: tokens[0],
    exitCode: probe.status ?? null,
    outputBytes: Buffer.byteLength(output),
    outputSha256: createHash('sha256').update(output).digest('hex'),
    output: 'not-included',
    mutations: 'none',
    secretValues: 'not-read'
  }
}

const results = selected.map((id) => {
  const manifest = manifests[id]
  if (!manifest) return { component: id, status: 'unknown', reason: 'no existe manifest', mutations: 'none', secretValues: 'not-read' }
  return { component: id, ...previewFor(id, manifest) }
})
const failed = results.some((result) => !['ok', 'pending-adapter'].includes(result.status))
const mutations = receiptPath ? [receiptPath] : 'none'
const output = { schemaVersion: 1, plan: planPath, project: project || null, results, summary: { selected: selected.length, ok: results.filter((result) => result.status === 'ok').length, failed: results.filter((result) => !['ok', 'pending-adapter'].includes(result.status)).length }, mutations, secretValues: 'not-read' }
if (receiptPath) {
  if (existsSync(receiptPath) && !forceReceipt) throw new Error(`el receipt ya existe: ${receiptPath}; usar --force-receipt para reemplazarlo`)
  mkdirSync(dirname(receiptPath), { recursive: true })
  writeFileSync(receiptPath, `${JSON.stringify({ schemaVersion: 1, type: 'qz-external-preview-receipt', createdAt: new Date().toISOString(), plan: planPath, project: project || null, results, summary: output.summary, mutations: [receiptPath], secretValues: 'not-read' }, null, 2)}\n`)
}
console.log(JSON.stringify(output, null, 2))
if (strict && (failed || results.some((result) => result.status === 'pending-adapter'))) process.exit(1)
