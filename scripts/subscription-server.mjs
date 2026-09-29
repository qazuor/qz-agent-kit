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
const number = (value) => typeof value === 'number' ? new Intl.NumberFormat('es-AR').format(value) : escape(value)
const label = (key) => ({ last24h: 'Tokens · últimas 24 h', last30d: 'Tokens · últimos 30 días', allTime: 'Tokens · acumulado', monthToDate: 'Tokens · mes actual', apiRequests: 'Peticiones API', totalMessages: 'Mensajes locales', totalSessions: 'Sesiones locales', primaryUsedPercent: 'Uso · ventana Codex', primaryRemainingPercent: 'Restante · ventana Codex', sevenDayUsedPercent: 'Uso · semana Claude', sevenDayRemainingPercent: 'Restante · semana Claude', primaryWindowMins: 'Ventana Codex · minutos', fiveHourResetsAt: 'Reinicio · 5 horas', sevenDayResetsAt: 'Reinicio · 7 días', primaryResetsAt: 'Reinicio · Codex' }[key] || key)
const date = (value) => {
  if (!value) return 'no verificado'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return escape(value)
  return escape(new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed))
}
const metrics = (snapshot) => {
  const usage = Object.entries(snapshot.usage || {})
  const remaining = Object.entries(snapshot.remaining || {})
  const limits = Object.entries(snapshot.limits || {})
  const format = (key, value) => /(?:Reset|resetsAt)/.test(key) ? date(value) : number(value)
  const rows = [...usage.map(([key, value]) => `<div><dt>${escape(label(key))}</dt><dd>${format(key, value)}</dd></div>`), ...limits.map(([key, value]) => `<div><dt>Límite · ${escape(label(key))}</dt><dd>${format(key, value)}</dd></div>`), ...remaining.map(([key, value]) => `<div><dt>Restante · ${escape(label(key))}</dt><dd>${format(key, value)}</dd></div>`)]
  return rows.length ? `<dl class="metrics">${rows.join('')}</dl>` : '<p class="muted">Sin métricas oficiales o locales disponibles.</p>'
}
const html = (document) => {
  const cards = document.snapshots.map((snapshot) => `<article><div class="heading"><h2>${escape(snapshot.provider)}</h2><span class="status">${escape(snapshot.status)}</span></div><dl class="meta"><div><dt>Plan</dt><dd>${escape(snapshot.plan || 'no verificado')}</dd></div><div><dt>Confianza</dt><dd>${escape(snapshot.confidence)}</dd></div><div><dt>Observado</dt><dd>${date(snapshot.observedAt)}</dd></div><div><dt>Renovación</dt><dd>${date(snapshot.renewalAt)}</dd></div></dl>${metrics(snapshot)}${snapshot.notes ? `<p class="notes">${escape(snapshot.notes)}</p>` : ''}<p class="source">Fuente: ${escape(snapshot.source || 'no verificada')}</p></article>`).join('') || '<p class="empty">Todavía no hay snapshots.</p>'
  const serialized = JSON.stringify(document).replace(/</g, '\\u003c')
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>qz subscriptions</title><style>:root{color-scheme:dark;--bg:#0f1318;--panel:#1a222c;--text:#e8edf2;--muted:#9eabb8;--accent:#73d1c8;--border:#2c3947}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px system-ui,sans-serif}main{max-width:1080px;margin:0 auto;padding:48px 24px}h1{font-size:clamp(2rem,5vw,4rem);margin:0 0 8px}header p{color:var(--muted);margin:0 0 10px}.updated{color:var(--muted);font-size:.85rem;margin:0 0 32px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px}article{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px}.heading{display:flex;align-items:center;justify-content:space-between;gap:12px}h2{margin:0;text-transform:capitalize}.status{color:var(--accent);font-weight:700}.meta,.metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}.metrics{border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:16px 0}.meta dt,.metrics dt{font-size:.72rem;text-transform:uppercase;color:var(--muted)}dd{margin:3px 0 0;color:var(--text);overflow-wrap:anywhere}.notes,.source,.muted{color:var(--muted);font-size:.9rem;line-height:1.45}.source{font-size:.75rem;overflow-wrap:anywhere}.empty{color:var(--muted);padding:24px 0}</style></head><body><main><header><h1>Suscripciones</h1><p>Estado local de Claude, OpenAI y NaN Builders · datos observados, no inferidos.</p><p class="updated" id="updated">Actualizado: ${date(new Date().toISOString())}</p></header><section class="grid" id="cards">${cards}</section></main><script>const initial=${serialized};const escapeHtml=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const fmtDate=(v)=>{if(!v)return'no verificado';const d=new Date(v);return Number.isNaN(d.getTime())?escapeHtml(v):new Intl.DateTimeFormat('es-AR',{dateStyle:'medium',timeStyle:'short'}).format(d)};const fmtNum=(v)=>typeof v==='number'?new Intl.NumberFormat('es-AR').format(v):escapeHtml(v);const fmtValue=(k,v)=>/(Reset|resetsAt)/.test(k)?fmtDate(v):fmtNum(v);const labels={last24h:'Tokens · últimas 24 h',last30d:'Tokens · últimos 30 días',allTime:'Tokens · acumulado',monthToDate:'Tokens · mes actual',apiRequests:'Peticiones API',totalMessages:'Mensajes locales',totalSessions:'Sesiones locales',primaryUsedPercent:'Uso · ventana Codex',primaryRemainingPercent:'Restante · ventana Codex',sevenDayUsedPercent:'Uso · semana Claude',sevenDayRemainingPercent:'Restante · semana Claude',primaryWindowMins:'Ventana Codex · minutos',fiveHourResetsAt:'Reinicio · 5 horas',sevenDayResetsAt:'Reinicio · 7 días',primaryResetsAt:'Reinicio · Codex'};const render=(doc)=>{const cards=(doc.snapshots||[]).map(s=>{const entries=[...Object.entries(s.usage||{}).map(([k,v])=>'<div><dt>'+escapeHtml(labels[k]||k)+'</dt><dd>'+fmtValue(k,v)+'</dd></div>'),...Object.entries(s.limits||{}).map(([k,v])=>'<div><dt>Límite · '+escapeHtml(labels[k]||k)+'</dt><dd>'+fmtValue(k,v)+'</dd></div>'),...Object.entries(s.remaining||{}).map(([k,v])=>'<div><dt>Restante · '+escapeHtml(labels[k]||k)+'</dt><dd>'+fmtValue(k,v)+'</dd></div>')];return '<article><div class="heading"><h2>'+escapeHtml(s.provider)+'</h2><span class="status">'+escapeHtml(s.status)+'</span></div><dl class="meta"><div><dt>Plan</dt><dd>'+escapeHtml(s.plan||'no verificado')+'</dd></div><div><dt>Confianza</dt><dd>'+escapeHtml(s.confidence)+'</dd></div><div><dt>Observado</dt><dd>'+fmtDate(s.observedAt)+'</dd></div><div><dt>Renovación</dt><dd>'+fmtDate(s.renewalAt)+'</dd></div></dl>'+(entries.length?'<dl class="metrics">'+entries.join('')+'</dl>':'<p class="muted">Sin métricas oficiales o locales disponibles.</p>')+(s.notes?'<p class="notes">'+escapeHtml(s.notes)+'</p>':'')+'<p class="source">Fuente: '+escapeHtml(s.source||'no verificada')+'</p></article>'}).join('');document.querySelector('#cards').innerHTML=cards||'<p class="empty">Todavía no hay snapshots.</p>';document.querySelector('#updated').textContent='Actualizado: '+fmtDate(new Date().toISOString())};render(initial);setInterval(async()=>{try{const res=await fetch('/api/snapshots',{cache:'no-store'});if(res.ok)render(await res.json())}catch{}},15000);</script></body></html>`
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
