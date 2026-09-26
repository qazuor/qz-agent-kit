#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const planPath = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
if (!existsSync(planPath)) throw new Error(`no se encontró el plan: ${planPath}`)
const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const manifests = Object.fromEntries(readdirSync(resolve(root, 'adapters')).flatMap((adapter) => {
  const path = resolve(root, 'adapters', adapter, 'manifest.json')
  if (!existsSync(path)) return []
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  return [[manifest.id, manifest]]
}))
const actions = []
for (const component of plan.components || []) {
  const manifest = manifests[component]
  if (!manifest) { actions.push({ component, status: 'unknown', requiresApproval: true, reason: 'no existe manifest declarativo' }); continue }
  if (component === 'gentle-ai') actions.push({ component, status: 'planned', requiresApproval: true, command: 'gentle-ai install --agent opencode --scope global --preset full-gentleman --persona gentleman --sdd-mode single --opencode-background-subagents=off --pi-background-subagents=off', preview: 'gentle-ai install --dry-run --agent opencode --scope global --preset full-gentleman --persona gentleman --sdd-mode single --opencode-background-subagents=off --pi-background-subagents=off', prerequisites: ['preflight aprobado', 'preview sin drift', 'backup de configuraciones administradas'], forbiddenWithoutApproval: manifest.lifecycle.mutating })
  else if (component === 'engram') actions.push({ component, status: 'planned', requiresApproval: true, command: 'engram setup opencode', preview: 'engram doctor --json --check sqlite_lock_contention --project <project>', prerequisites: ['backup externo de ~/.engram', 'check SQLite por proyecto', 'decidir integración MCP'], forbiddenWithoutApproval: manifest.lifecycle.mutating })
  else actions.push({ component, status: 'pending-adapter', requiresApproval: true, prerequisites: ['adapter específico'], forbiddenWithoutApproval: manifest.lifecycle?.mutating || [] })
}
console.log(JSON.stringify({ schemaVersion: 1, plan: planPath, actions, approval: 'required-per-action', mutations: 'none', secretValues: 'not-read' }, null, 2))
