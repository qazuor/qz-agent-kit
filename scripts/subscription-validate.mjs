#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const file = args[0] && !args[0].startsWith('-') ? resolve(args[0]) : null
if (!file || args.includes('--help')) {
  console.log('Uso: qz-kit subscriptions validate <snapshot.json>')
  process.exit(file ? 0 : 2)
}
if (!existsSync(file)) throw new Error(`no existe el snapshot: ${file}`)
let document
try { document = JSON.parse(readFileSync(file, 'utf8')) } catch (error) { throw new Error(`snapshot no parseable: ${error.message}`) }
const errors = []
if (document?.schemaVersion !== 1) errors.push('schemaVersion debe ser 1')
if (!Array.isArray(document?.snapshots)) errors.push('snapshots debe ser una lista')
const providers = new Set(['claude', 'openai', 'nan'])
const statuses = new Set(['verified', 'partial', 'manual', 'unavailable'])
const confidences = new Set(['high', 'medium', 'low'])
for (const [index, snapshot] of (document?.snapshots || []).entries()) {
  if (!snapshot || typeof snapshot !== 'object') { errors.push(`snapshots[${index}] no es un objeto`); continue }
  if (!providers.has(snapshot.provider)) errors.push(`snapshots[${index}].provider inválido`)
  if (!statuses.has(snapshot.status)) errors.push(`snapshots[${index}].status inválido`)
  if (!confidences.has(snapshot.confidence)) errors.push(`snapshots[${index}].confidence inválido`)
  for (const field of ['observedAt', 'periodStart', 'periodEnd', 'renewalAt']) {
    if (snapshot[field] !== undefined && snapshot[field] !== null && (typeof snapshot[field] !== 'string' || Number.isNaN(Date.parse(snapshot[field])))) errors.push(`snapshots[${index}].${field} no es fecha ISO válida`)
  }
  if (typeof snapshot.source !== 'string' || !snapshot.source) errors.push(`snapshots[${index}].source ausente`)
}
const output = { schemaVersion: 1, file, valid: errors.length === 0, providers: [...new Set((document?.snapshots || []).map((snapshot) => snapshot?.provider).filter(Boolean))], snapshotCount: Array.isArray(document?.snapshots) ? document.snapshots.length : 0, errors, mutations: 'none', secretValues: 'not-read' }
console.log(JSON.stringify(output, null, 2))
if (errors.length) process.exit(1)
