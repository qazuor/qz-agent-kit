#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const path = resolve(value('--receipt') || value('--check') || '')
if (!path || path === resolve('.')) throw new Error('uso: qz-kit external-receipt --check <receipt.json>')
if (!existsSync(path)) throw new Error(`no se encontró el receipt: ${path}`)
let receipt
try { receipt = JSON.parse(readFileSync(path, 'utf8')) } catch (error) { throw new Error(`receipt inválido: JSON no parseable (${error.message})`) }
const errors = []
if (receipt?.schemaVersion !== 1) errors.push('schemaVersion debe ser 1')
if (receipt?.type !== 'qz-external-preview-receipt') errors.push('type inválido')
if (typeof receipt?.createdAt !== 'string' || !receipt.createdAt) errors.push('createdAt ausente')
if (typeof receipt?.plan !== 'string' || !receipt.plan) errors.push('plan ausente')
if (!Array.isArray(receipt?.results) || receipt.results.length === 0) errors.push('results debe ser una lista no vacía')
if (receipt?.secretValues !== 'not-read') errors.push('secretValues debe ser not-read')
for (const [index, result] of (receipt.results || []).entries()) {
  if (!result || typeof result !== 'object') { errors.push(`results[${index}] no es un objeto`); continue }
  if (!['ok', 'failed', 'timeout', 'unavailable', 'needs-project', 'blocked', 'pending-adapter', 'unknown'].includes(result.status)) errors.push(`results[${index}].status inválido`)
  if (result.status === 'ok' && !/^[a-f0-9]{64}$/.test(result.outputSha256 || '')) errors.push(`results[${index}].outputSha256 inválido`)
  if (result.output !== 'not-included') errors.push(`results[${index}].output debe ser not-included`)
  if (result.mutations !== 'none') errors.push(`results[${index}] declara mutaciones`)
}
const result = { schemaVersion: 1, receipt: path, valid: errors.length === 0, errors, summary: receipt.summary || null, mutations: 'none', secretValues: 'not-read' }
console.log(JSON.stringify(result, null, 2))
if (errors.length) process.exit(1)
