#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { assertValidPlan } from './plan-schema.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const strict = args.includes('--strict')
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const planPath = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
if (!existsSync(planPath)) throw new Error(`no se encontró el plan: ${planPath}`)
const plan = assertValidPlan(JSON.parse(readFileSync(planPath, 'utf8')))
const manifests = Object.fromEntries(readdirSync(resolve(root, 'adapters')).flatMap((adapter) => {
  const path = resolve(root, 'adapters', adapter, 'manifest.json')
  if (!existsSync(path)) return []
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  return [[manifest.id, manifest]]
}))
const actions = []
const detect = (manifest) => {
  const command = manifest?.detection?.command
  if (!command) return { detected: false, executable: null, version: null }
  const pathResult = spawnSync('command', ['-v', command], { shell: true, encoding: 'utf8', timeout: 5000 })
  const executable = pathResult.status === 0 ? pathResult.stdout.trim() : null
  if (!executable) return { detected: false, executable: null, version: null }
  const versionArgs = manifest.detection.versionArgs || ['--version']
  const versionResult = spawnSync(executable, versionArgs, { encoding: 'utf8', timeout: 5000 })
  const output = `${versionResult.stdout || ''}\n${versionResult.stderr || ''}`.trim()
  return { detected: true, executable, version: versionResult.status === 0 && output ? output.split('\n').slice(0, 2).join(' ').replace(/\s+/g, ' ') : null }
}
for (const component of plan.components || []) {
  const manifest = manifests[component]
  if (!manifest) { actions.push({ component, status: 'unknown', requiresApproval: true, reason: 'no existe manifest declarativo' }); continue }
  const runtime = detect(manifest)
  if (manifest.installPlan) {
    const selectedClients = plan.clients || []
    const targetMismatch = component === 'gentle-ai' && (selectedClients.length !== 1 || selectedClients[0] !== 'opencode')
    actions.push({ component, status: !runtime.detected ? 'unavailable' : targetMismatch ? 'review-required' : 'planned', requiresApproval: true, ...runtime, ...manifest.installPlan, selectedClients, targetMismatch, note: !runtime.detected ? 'No se encontró el ejecutable; instalarlo queda fuera de este plan read-only.' : targetMismatch ? 'El comando verificado cubre OpenCode; revisar agentes adicionales antes de ejecutar.' : null, forbiddenWithoutApproval: manifest.lifecycle.mutating })
  }
  else actions.push({ component, status: !runtime.detected ? 'unavailable' : 'pending-adapter', requiresApproval: true, ...runtime, prerequisites: ['adapter específico'], forbiddenWithoutApproval: manifest.lifecycle?.mutating || [] })
}
console.log(JSON.stringify({ schemaVersion: 1, plan: planPath, actions, approval: 'required-per-action', summary: { strict, ready: actions.every((action) => action.requiresApproval !== true) }, mutations: 'none', secretValues: 'not-read' }, null, 2))
if (strict && actions.some((action) => action.requiresApproval === true)) process.exit(1)
