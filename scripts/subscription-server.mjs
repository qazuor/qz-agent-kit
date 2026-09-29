#!/usr/bin/env node
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const port = Number(value('--port') || 4319)
const refreshInterval = Number(value('--refresh-interval') || 0)
const host = value('--host') || '127.0.0.1'
const store = resolve(value('--store') || `${process.env.QZ_KIT_HOME || homedir()}/.local/state/qz-agent-kit/subscriptions/snapshots.json`)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('puerto inválido')
if (!Number.isInteger(refreshInterval) || refreshInterval < 0) throw new Error('refresh interval inválido')
if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') throw new Error('el servidor sólo admite loopback en el MVP')

const load = () => {
  if (!existsSync(store)) return { schemaVersion: 1, snapshots: [] }
  const document = JSON.parse(readFileSync(store, 'utf8'))
  if (document?.schemaVersion !== 1 || !Array.isArray(document.snapshots)) throw new Error('snapshot store inválido')
  return document
}
const send = (response, status, body, type = 'application/json; charset=utf-8') => {
  response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
  response.end(type.startsWith('application/json') ? JSON.stringify(body) : body)
}
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const html = (document) => {
  const cards = document.snapshots.map((snapshot) => `<article><h2>${escape(snapshot.provider)}</h2><p class="status">${escape(snapshot.status)}</p><dl><dt>Plan</dt><dd>${escape(snapshot.plan || 'no verificado')}</dd><dt>Observado</dt><dd>${escape(snapshot.observedAt || 'no verificado')}</dd><dt>Renovación</dt><dd>${escape(snapshot.renewalAt || 'no verificado')}</dd><dt>Confianza</dt><dd>${escape(snapshot.confidence)}</dd></dl></article>`).join('') || '<p class="empty">Todavía no hay snapshots.</p>'
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>qz subscriptions</title><style>:root{color-scheme:dark;--bg:#0f1318;--panel:#1a222c;--text:#e8edf2;--muted:#9eabb8;--accent:#73d1c8}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px system-ui,sans-serif}main{max-width:980px;margin:0 auto;padding:48px 24px}h1{font-size:clamp(2rem,5vw,4rem);margin:0 0 8px}header p{color:var(--muted);margin:0 0 32px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}article{background:var(--panel);border:1px solid #2c3947;border-radius:14px;padding:20px}h2{margin-top:0;text-transform:capitalize}.status{color:var(--accent);font-weight:700}dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;color:var(--muted)}dt{font-size:.8rem;text-transform:uppercase}dd{margin:0;color:var(--text);overflow-wrap:anywhere}.empty{color:var(--muted);padding:24px 0}</style></head><body><main><header><h1>Suscripciones</h1><p>Estado local de Claude, OpenAI y NaN Builders · datos observados, no inferidos.</p></header><section class="grid">${cards}</section></main></body></html>`
}
const server = createServer((request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${host}:${port}`)
    const document = load()
    if (request.method === 'GET' && url.pathname === '/api/health') return send(response, 200, { ok: true, store, snapshotCount: document.snapshots.length, mutations: 'none', secretValues: 'not-read' })
    if (request.method === 'GET' && url.pathname === '/api/snapshots') return send(response, 200, { ...document, mutations: 'none', secretValues: 'not-read' })
    if (request.method === 'GET' && url.pathname === '/') return send(response, 200, html(document), 'text/html; charset=utf-8')
    return send(response, 404, { error: 'not found' })
  } catch (error) { return send(response, 500, { error: error.message, mutations: 'none', secretValues: 'not-read' }) }
})
if (refreshInterval > 0) {
  const refreshScript = resolve(new URL('./subscription-refresh.mjs', import.meta.url).pathname)
  const refresh = () => { const child = spawn(process.execPath, [refreshScript, '--store', store], { stdio: 'ignore' }); child.on('error', () => {}) }
  refresh()
  setInterval(refresh, refreshInterval * 1000).unref()
}
server.listen(port, host, () => console.log(JSON.stringify({ url: `http://${host}:${port}`, store, snapshotCount: load().snapshots.length, refreshInterval, mutations: refreshInterval > 0 ? 'server-and-provider-refresh' : 'server-only', secretValues: 'not-read' }, null, 2)))
