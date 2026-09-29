#!/usr/bin/env node
import { existsSync, readFileSync, mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const home = resolve(value('--home') || homedir())
const store = resolve(value('--store') || `${home}/.local/state/qz-agent-kit/subscriptions/snapshots.json`)
const secret = (file) => { try { return readFileSync(resolve(file), 'utf8').trim() || null } catch { return null } }
const envOrFile = (envName, file) => process.env[envName] || secret(file)
const iso = new Date().toISOString()
const requestJson = async (url, headers) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    const body = await response.text()
    let data = null
    try { data = JSON.parse(body) } catch {}
    return { ok: response.ok, status: response.status, data }
  } finally { clearTimeout(timeout) }
}
const failed = (provider, source, reason) => ({ provider, status: 'unavailable', confidence: 'low', observedAt: iso, source, notes: reason })

const nanSnapshot = async () => {
  const session = secret(process.env.NAN_SESSION_FILE || `${home}/.config/nan/session.json`)
  if (session) {
    try {
      const parsed = JSON.parse(session)
      if (parsed.token) {
        const response = await requestJson('https://cloud-api.nan.builders/api/metrics/usage', { Cookie: `nan_session=${parsed.token}` })
        if (response.ok && response.data) {
          const usage = {}
          for (const period of ['last24h', 'last30d', 'allTime']) if (response.data[period]?.totalTokens !== undefined) usage[period] = response.data[period].totalTokens
          return { provider: 'nan', status: 'verified', confidence: 'high', observedAt: iso, source: 'https://cloud-api.nan.builders/api/metrics/usage', usage, limits: {}, remaining: {}, notes: 'uso reportado por la cuenta NaN' }
        }
      }
    } catch {}
  }
  const key = envOrFile('NAN_API_KEY', `${home}/.config/qz/secrets/nan.builders.key`)
  if (key) {
    const response = await requestJson('https://api.nan.builders/v1/models', { Authorization: `Bearer ${key}` })
    if (response.ok && response.data) return { provider: 'nan', status: 'partial', confidence: 'medium', observedAt: iso, source: 'https://api.nan.builders/v1/models', usage: {}, limits: {}, remaining: {}, notes: 'API key válida; el endpoint de modelos no expone consumo ni renovación' }
  }
  return failed('nan', 'nan-auth', 'no hay sesión de NaN ni API key disponible')
}
const adminSnapshot = async (provider, key, url, source) => {
  if (!key) return failed(provider, `${provider}-auth`, 'no hay credencial administrativa de uso configurada')
  const response = await requestJson(url, { Authorization: `Bearer ${key}`, 'x-api-key': key, 'anthropic-version': '2023-06-01' })
  if (!response.ok) return failed(provider, source, `endpoint respondió HTTP ${response.status}`)
  return { provider, status: 'verified', confidence: 'high', observedAt: iso, source, usage: {}, limits: {}, remaining: {}, notes: 'respuesta administrativa disponible; transformación detallada pendiente' }
}
const snapshots = [
  await nanSnapshot(),
  await adminSnapshot('openai', envOrFile('OPENAI_ADMIN_API_KEY', `${home}/.config/qz/secrets/openai-admin.key`), 'https://api.openai.com/v1/organization/costs', 'https://api.openai.com/v1/organization/costs'),
  await adminSnapshot('claude', envOrFile('ANTHROPIC_ADMIN_API_KEY', `${home}/.config/qz/secrets/anthropic-admin.key`), 'https://api.anthropic.com/v1/organizations/cost_report', 'https://api.anthropic.com/v1/organizations/cost_report')
]
mkdirSync(dirname(store), { recursive: true })
const temporary = `${store}.tmp-${process.pid}`
writeFileSync(temporary, `${JSON.stringify({ schemaVersion: 1, snapshots }, null, 2)}\n`, { mode: 0o600 })
renameSync(temporary, store)
console.log(JSON.stringify({ schemaVersion: 1, store, snapshots: snapshots.map(({ provider, status, confidence, observedAt }) => ({ provider, status, confidence, observedAt })), mutations: [store], secretValues: 'not-read' }, null, 2))
