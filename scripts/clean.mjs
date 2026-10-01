#!/usr/bin/env node
import { confirm, intro, isCancel, outro } from '@clack/prompts'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const manifest = JSON.parse(readFileSync(join(root, 'manifests/qz-command-manifest.json'), 'utf8'))
const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const selected = value('--client') === 'all' || !value('--client')
  ? ['opencode', 'claude', 'codex', 'gentle-shell']
  : [...new Set((value('--client') || '').split(',').map((name) => name.trim()).filter(Boolean))]
const home = resolve(value('--home') || homedir())
const stateRoot = join(home, '.local/state/qz-agent-kit')
const timestamp = new Date().toISOString().replaceAll(':', '-')
const backupRoot = join(stateRoot, 'clean-backups', timestamp)
const protectedPattern = /(^|[._-])(auth|credential|token|secret|password|cookie|private[-_]?key|\.env)([._-]|$)|(^|[/])(settings|sessions?|memory|databases?)([/._-]|$)/i
const knownCommands = manifest.commands.map((entry) => entry.id)
const knownNames = new Map(knownCommands.map((id) => [normalize(id), id]))
const roots = {
  opencode: [
    ['commands', join(home, '.config/opencode/commands')],
    ['skills', join(home, '.config/opencode/skills')],
    ['agents', join(home, '.config/opencode/agents')]
  ],
  claude: [
    ['commands', join(home, '.claude/commands')],
    ['skills', join(home, '.claude/skills')],
    ['agents', join(home, '.claude/agents')]
  ],
  codex: [
    ['skills', join(home, '.codex/skills')],
    ['agents', join(home, '.codex/agents')]
  ],
  'gentle-shell': [
    ['prompts', join(home, '.gentle-shell/agent/prompts')],
    ['skills', join(home, '.gentle-shell/agent/skills')],
    ['agents', join(home, '.gentle-shell/agent/agents')]
  ]
}

function normalize(value) {
  return value.toLowerCase().replace(/\.md$/, '').replace(/[^a-z0-9]/g, '')
}

function walk(directory, out = []) {
  if (!existsSync(directory) || !lstatSync(directory).isDirectory()) return out
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) walk(path, out)
    else if (entry.isFile() && !protectedPattern.test(path)) out.push(path)
  }
  return out
}

function recommendation(client, category, path) {
  const relativeName = relative(roots[client].find(([kind, dir]) => kind === category)?.[1] || home, path)
  const base = relativeName.split('/').at(-1) || relativeName
  const parts = relativeName.split('/')
  const identity = category === 'skills' && parts.length > 1 ? parts.at(-2) : base
  const normalized = normalize(identity)
  if (normalized.startsWith('qz')) return { recommendation: 'eliminar', reason: 'recurso administrado por qz-agent-kit', confidence: 'alta', replacement: null }
  for (const [candidate, id] of knownNames) {
    if (candidate === normalized || candidate.replace(/^qz/, '') === normalized || normalized === candidate.replace(/^hops/, '')) {
      const replacement = id.startsWith('qz-') ? id : `qz-${id}`
      return { recommendation: 'reemplazado-por-qz', reason: `posible equivalente de ${replacement}`, confidence: 'alta', replacement }
    }
  }
  if (base.toLowerCase() === 'claude.md') return { recommendation: 'revisar', reason: 'instrucciones legacy; AGENTS.md es la fuente común actual', confidence: 'media', replacement: 'AGENTS.md' }
  return { recommendation: 'conservar', reason: 'no se encontró equivalente qz confiable', confidence: 'alta', replacement: null }
}

function buildPlan() {
  const items = []
  for (const client of selected) {
    if (!roots[client]) throw new Error(`cliente inválido: ${client}`)
    for (const [category, directory] of roots[client]) {
      for (const path of walk(directory)) {
        const advice = recommendation(client, category, path)
        items.push({ id: createHash('sha256').update(path).digest('hex').slice(0, 12), client, category, path, ...advice, protected: false })
      }
    }
  }
  return { schemaVersion: 1, mode: 'total-clean', generatedAt: new Date().toISOString(), clients: selected, items, summary: { total: items.length, remove: items.filter((item) => ['eliminar', 'reemplazado-por-qz'].includes(item.recommendation)).length, keep: items.filter((item) => item.recommendation === 'conservar').length, review: items.filter((item) => item.recommendation === 'revisar').length }, protectedPolicy: 'secret-like paths, auth, settings, sessions, memory and databases are excluded', mutations: 'none', secretValues: 'not-read' }
}

if (!has('--plan') && !has('--apply')) throw new Error('elegí --plan o --apply')
const plan = buildPlan()
if (has('--plan')) {
  console.log(JSON.stringify(plan, null, 2))
  process.exit(0)
}
if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('clean --apply requiere una terminal interactiva para confirmar cada elemento')
intro('qz-agent-kit · limpieza total interactiva')
const approved = []
for (const item of plan.items) {
  if (!['eliminar', 'reemplazado-por-qz', 'revisar'].includes(item.recommendation)) continue
  const label = `${item.client}/${item.category}: ${item.path}\n  ${item.recommendation} · ${item.reason}${item.replacement ? ` · reemplazo: ${item.replacement}` : ''}`
  const answer = await confirm({ message: label, initialValue: item.recommendation !== 'revisar' })
  if (isCancel(answer)) { outro('Limpieza cancelada; no se aplicaron cambios.'); process.exit(130) }
  if (answer) approved.push(item)
}
mkdirSync(backupRoot, { recursive: true })
const removed = []
for (const item of approved) {
  if (!existsSync(item.path) || !lstatSync(item.path).isFile()) continue
  const backup = join(backupRoot, item.client, relative(home, item.path))
  mkdirSync(dirname(backup), { recursive: true })
  copyFileSync(item.path, backup)
  rmSync(item.path, { force: true })
  removed.push({ path: item.path, backup, recommendation: item.recommendation })
}
const receipt = { ...plan, approved: approved.map(({ path, client, category, recommendation, replacement }) => ({ path, client, category, recommendation, replacement })), removed, backup: backupRoot, mutations: removed.map((entry) => entry.path), secretValues: 'not-read' }
const receiptPath = join(backupRoot, 'clean-receipt.json')
writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 })
console.log(JSON.stringify({ ...receipt, receipt: receiptPath }, null, 2))
