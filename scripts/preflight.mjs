#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const planPath = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
const strict = args.includes('--strict')
if (!existsSync(planPath)) throw new Error(`no se encontró el plan: ${planPath}`)
const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const probe = spawnSync(process.execPath, [resolve(root, 'scripts/ecosystem.mjs')], { encoding: 'utf8' })
if (probe.status !== 0) throw new Error(probe.stderr || 'falló el inventario del ecosistema')
const ecosystem = JSON.parse(probe.stdout)
const byId = Object.fromEntries(ecosystem.components.map((component) => [component.id, component]))
const checks = []
for (const client of plan.clients || []) {
  const found = byId[client]
  checks.push({ id: `client:${client}`, status: found?.installed ? 'ok' : 'warning', message: found?.installed ? `${client} disponible (${found.version || 'versión no reportada'})` : `${client} no está instalado; qz puede preparar archivos, pero el CLI requerirá instalación aparte.` })
}
for (const component of plan.components || []) {
  const binary = component === 'gentle-ai' ? byId['gentle-ai'] : component === 'engram' ? byId.engram : null
  checks.push({ id: `component:${component}`, status: binary?.installed ? 'ok' : 'pending', message: binary?.installed ? `${component} disponible (${binary.version || 'versión no reportada'})` : `${component} está seleccionado pero su adapter de instalación aún es explícito/pending.` })
}
for (const client of plan.clients || []) {
  const auth = ecosystem.integrations.auth?.[client]
  if (auth) checks.push({ id: `auth:${client}`, status: auth.present ? 'ok' : 'warning', message: auth.present ? `auth presente para ${client} (contenido no leído)` : `auth no detectada para ${client}; login manual pendiente.` })
}
const warnings = checks.filter((check) => check.status !== 'ok')
const result = { schemaVersion: 1, plan: planPath, checks, summary: { total: checks.length, ok: checks.filter((check) => check.status === 'ok').length, pending: checks.filter((check) => check.status === 'pending').length, warnings: checks.filter((check) => check.status === 'warning').length }, readyForQzLayer: !strict || warnings.length === 0, mutations: 'none', secretValues: 'not-read' }
console.log(JSON.stringify(result, null, 2))
if (strict && warnings.length) process.exit(1)
