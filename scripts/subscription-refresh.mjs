#!/usr/bin/env node
import { existsSync, readFileSync, mkdirSync, renameSync, writeFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'

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
const commandAvailable = (command, args = []) => {
  try {
    execFileSync(command, args, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 })
    return true
  } catch { return false }
}
const nanPublishedQuotas = {
  'deepseek-v4-flash': 3_000_000_000,
  'glm5.3-flash': 2_000_000_000,
  'qwen3.8-flash': 500_000_000,
  'mimo-v2.6-flash': 1_000_000_000
}
const utcDate = (date) => date.toISOString().slice(0, 10)
const monthWindow = () => {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { start: utcDate(start), end: utcDate(end), periodStart: start.toISOString(), periodEnd: end.toISOString() }
}
const nanApiUsage = async (apiKey) => {
  const window = monthWindow()
  let cursor
  const rows = []
  do {
    const query = new URLSearchParams({ start_date: window.start, end_date: window.end })
    if (cursor) query.set('cursor', cursor)
    const response = await requestJson(`https://api.nan.builders/v1/usage?${query}`, { Authorization: `Bearer ${apiKey}` })
    if (!response.ok || !response.data) return null
    rows.push(...(Array.isArray(response.data.data) ? response.data.data : []))
    cursor = response.data.has_more ? response.data.next_cursor : undefined
  } while (cursor)
  const byModel = {}
  let totalTokens = 0
  let apiRequests = 0
  for (const row of rows) {
    if (!row?.model) continue
    const tokens = Number(row.total_tokens || 0)
    byModel[row.model] = (byModel[row.model] || 0) + tokens
    totalTokens += tokens
    apiRequests += Number(row.api_requests || 0)
  }
  const usage = { monthToDate: totalTokens, apiRequests }
  const limits = {}
  const remaining = {}
  for (const [model, quota] of Object.entries(nanPublishedQuotas)) {
    const used = byModel[model] || 0
    usage[model] = used
    limits[model] = quota
    remaining[model] = Math.max(0, quota - used)
  }
  return { usage, limits, remaining, periodStart: window.periodStart, periodEnd: window.periodEnd, source: 'https://api.nan.builders/v1/usage' }
}

const nanSnapshot = async () => {
  const session = secret(process.env.NAN_SESSION_FILE || `${home}/.config/nan/session.json`)
  if (session) {
    try {
      const parsed = JSON.parse(session)
      if (parsed.apiKey) {
        const apiUsage = await nanApiUsage(parsed.apiKey)
        if (apiUsage) {
          return { provider: 'nan', status: 'verified', confidence: 'high', observedAt: iso, ...apiUsage, notes: 'consumo oficial de NaN; restante calculado contra cuotas publicadas por modelo' }
        }
      }
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
    const apiUsage = await nanApiUsage(key)
    if (apiUsage) return { provider: 'nan', status: 'verified', confidence: 'high', observedAt: iso, ...apiUsage, notes: 'consumo oficial de NaN; restante calculado contra cuotas publicadas por modelo' }
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
const claudeLocalSnapshot = () => {
  const usageFile = process.env.CLAUDE_USAGE_CACHE_FILE || '/tmp/claude-statusline/usage.json'
  const usageRaw = secret(usageFile)
  if (usageRaw) {
    try {
      const data = JSON.parse(usageRaw)
      const five = data.five_hour
      const seven = data.seven_day
      const usage = {}
      const remaining = {}
      const limits = {}
      if (typeof five?.utilization === 'number') {
        usage.fiveHourUsedPercent = five.utilization
        remaining.fiveHourRemainingPercent = Math.max(0, 100 - five.utilization)
      }
      if (typeof seven?.utilization === 'number') {
        usage.sevenDayUsedPercent = seven.utilization
        remaining.sevenDayRemainingPercent = Math.max(0, 100 - seven.utilization)
      }
      if (five?.resets_at) limits.fiveHourResetsAt = five.resets_at
      if (seven?.resets_at) limits.sevenDayResetsAt = seven.resets_at
      const observedAt = data.seven_day_breakdown?.as_of || iso
      const ageSeconds = (() => { try { return Math.max(0, Math.round((Date.now() - statSync(usageFile).mtimeMs) / 1000)) } catch { return null } })()
      if (Object.keys(usage).length) return {
        provider: 'claude', status: ageSeconds !== null && ageSeconds > 900 ? 'partial' : 'verified',
        confidence: ageSeconds !== null && ageSeconds > 900 ? 'medium' : 'high', observedAt,
        source: usageFile, usage, limits, remaining, renewalAt: five?.resets_at || seven?.resets_at || null,
        notes: `ventanas oficiales de Claude capturadas por statusline${ageSeconds === null ? '' : `; caché de ${ageSeconds}s`}`
      }
    } catch {}
  }
  const file = `${home}/.claude/stats-cache.json`
  const raw = secret(file)
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    const usage = {}
    for (const key of ['totalMessages', 'totalSessions', 'firstSessionDate', 'lastComputedDate']) {
      if (data[key] !== undefined && data[key] !== null) usage[key] = data[key]
    }
    return {
      provider: 'claude', status: 'partial', confidence: 'low', observedAt: iso,
      source: file, usage, limits: {}, remaining: {},
      notes: 'estadísticas locales de Claude Code; no representan la cuota restante de Claude.ai'
    }
  } catch { return null }
}
const openaiLocalSnapshot = () => {
  if (!commandAvailable('codex', ['login', 'status'])) return null
  return {
    provider: 'openai', status: 'partial', confidence: 'low', observedAt: iso,
    source: 'codex login status', usage: {}, limits: {}, remaining: {},
    notes: 'Codex está autenticado localmente; el CLI no expone una cuota restante persistida'
  }
}
const codexRateLimits = () => new Promise((resolveResult) => {
  const child = spawn('codex', ['app-server', '--listen', 'stdio://'], { stdio: ['pipe', 'pipe', 'ignore'] })
  let buffer = ''
  let settled = false
  const finish = (result) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    child.kill('SIGTERM')
    resolveResult(result)
  }
  const timer = setTimeout(() => finish(null), 12000)
  child.on('error', () => finish(null))
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString()
    while (buffer.includes('\n')) {
      const index = buffer.indexOf('\n')
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)
      if (!line) continue
      try {
        const message = JSON.parse(line)
        if (message.id !== 2 || !message.result?.rateLimits) continue
        const rate = message.result.rateLimits
        const usage = {}
        const limits = {}
        const remaining = {}
        for (const [name, window] of [['primary', rate.primary], ['secondary', rate.secondary]]) {
          if (!window) continue
          if (typeof window.usedPercent === 'number') usage[`${name}UsedPercent`] = window.usedPercent
          if (typeof window.windowDurationMins === 'number') limits[`${name}WindowMins`] = window.windowDurationMins
          if (typeof window.usedPercent === 'number') remaining[`${name}RemainingPercent`] = Math.max(0, 100 - window.usedPercent)
          if (typeof window.resetsAt === 'number' && name === 'primary') limits.primaryResetsAt = new Date(window.resetsAt * 1000).toISOString()
        }
        finish({ usage, limits, remaining, renewalAt: limits.primaryResetsAt || null, plan: rate.planType || null, source: 'codex app-server account/rateLimits/read', notes: 'ventanas oficiales de rate limit de Codex' })
      } catch {}
    }
  })
  child.stdin.write(`${JSON.stringify({ id: 1, method: 'initialize', params: { clientInfo: { name: 'qz-agent-kit', version: '0.1.0' }, capabilities: {} } })}\n`)
  setTimeout(() => child.stdin.write(`${JSON.stringify({ id: 2, method: 'account/rateLimits/read', params: {} })}\n`), 1000)
})
const openaiRateLimitSnapshot = async () => {
  const result = await codexRateLimits()
  if (!result) return null
  return { provider: 'openai', status: 'verified', confidence: 'high', observedAt: iso, ...result }
}
const openaiAdmin = await adminSnapshot('openai', envOrFile('OPENAI_ADMIN_API_KEY', `${home}/.config/qz/secrets/openai-admin.key`), 'https://api.openai.com/v1/organization/costs', 'https://api.openai.com/v1/organization/costs')
const claudeAdmin = await adminSnapshot('claude', envOrFile('ANTHROPIC_ADMIN_API_KEY', `${home}/.config/qz/secrets/anthropic-admin.key`), 'https://api.anthropic.com/v1/organizations/cost_report', 'https://api.anthropic.com/v1/organizations/cost_report')
const openaiRateLimit = openaiAdmin.status === 'unavailable' ? await openaiRateLimitSnapshot() : null
const snapshots = [
  await nanSnapshot(),
  openaiAdmin.status === 'unavailable' ? (openaiRateLimit || openaiLocalSnapshot() || openaiAdmin) : openaiAdmin,
  claudeAdmin.status === 'unavailable' ? (claudeLocalSnapshot() || claudeAdmin) : claudeAdmin
]
mkdirSync(dirname(store), { recursive: true })
const temporary = `${store}.tmp-${process.pid}`
writeFileSync(temporary, `${JSON.stringify({ schemaVersion: 1, snapshots }, null, 2)}\n`, { mode: 0o600 })
renameSync(temporary, store)
console.log(JSON.stringify({ schemaVersion: 1, store, snapshots: snapshots.map(({ provider, status, confidence, observedAt }) => ({ provider, status, confidence, observedAt })), mutations: [store], secretValues: 'not-read' }, null, 2))
