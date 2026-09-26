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
  if (manifest.installPlan) actions.push({ component, status: 'planned', requiresApproval: true, ...manifest.installPlan, forbiddenWithoutApproval: manifest.lifecycle.mutating })
  else actions.push({ component, status: 'pending-adapter', requiresApproval: true, prerequisites: ['adapter específico'], forbiddenWithoutApproval: manifest.lifecycle?.mutating || [] })
}
console.log(JSON.stringify({ schemaVersion: 1, plan: planPath, actions, approval: 'required-per-action', mutations: 'none', secretValues: 'not-read' }, null, 2))
