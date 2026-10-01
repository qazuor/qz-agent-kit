#!/usr/bin/env node
import { confirm, intro, isCancel, outro, select } from '@clack/prompts'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('qz-kit necesita una terminal interactiva cuando se ejecuta sin argumentos.')
  console.error('Usá un subcomando explícito, por ejemplo `qz-kit install --check`, en scripts o CI.')
  process.exit(2)
}

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const bin = join(root, 'bin', 'qz-kit')
const cleanScript = join(root, 'scripts', 'clean.mjs')
const stripAnsi = (value) => value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
const ansi = {
  reset: '\u001b[0m', bold: '\u001b[1m', dim: '\u001b[2m', cyan: '\u001b[36m', green: '\u001b[32m', yellow: '\u001b[33m', red: '\u001b[31m', blue: '\u001b[34m', magenta: '\u001b[35m'
}
const color = (name, value) => `${ansi[name] || ''}${value}${ansi.reset}`
const label = (key) => ({ mode: 'modo', kit: 'kit', kitVersion: 'versión', version: 'schema', projectRoot: 'proyecto', projectId: 'proyecto', generatedAt: 'generado', installedAt: 'instalado', clients: 'clientes', targets: 'destinos', missing: 'faltantes', drift: 'drift', contentDrift: 'drift de contenido', stale: 'obsoletos', counts: 'conteos', summary: 'resumen', mutations: 'mutaciones', secretValues: 'secretos', total: 'total', remove: 'recomendados para eliminar', keep: 'para conservar', review: 'para revisar', recommendation: 'recomendación', reason: 'motivo', replacement: 'reemplazo', category: 'categoría', path: 'ruta' }[key] || key)

const humanDate = (value) => {
  if (!value) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}

const statusValue = (value) => {
  if (value === 0 || value === '0' || value === 'none' || value === false) return color('green', 'OK')
  if (value === 'not-read') return color('dim', 'no leído')
  return value
}

function parseJsonOutput(raw) {
  const clean = stripAnsi(raw).trim()
  try { return JSON.parse(clean) } catch { return null }
}

function printList(title, values) {
  if (!Array.isArray(values)) return
  console.log(`  ${title}: ${values.length}`)
  for (const value of values.slice(0, 8)) {
    const item = typeof value === 'string' ? value : value?.target || value?.path || value?.id || JSON.stringify(value)
    console.log(`    · ${item}`)
  }
  if (values.length > 8) console.log(`    · … y ${values.length - 8} más`)
}

function printTable(headers, rows) {
  if (!rows.length) return
  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => String(row[index] ?? '').length)))
  const line = (row) => `  ${row.map((cell, index) => String(cell ?? '').padEnd(widths[index])).join('  ')}`
  console.log(color('dim', line(headers)))
  console.log(color('dim', `  ${widths.map((width) => '─'.repeat(width)).join('──')}`))
  for (const row of rows) console.log(line(row))
}

function printCleanPlan(value) {
  const summary = value.summary || {}
  console.log(color('bold', 'Resumen de limpieza'))
  printTable(['Métrica', 'Cantidad'], [
    ['Elementos detectados', summary.total ?? 0],
    [color('red', 'Recomendados para eliminar'), summary.remove ?? 0],
    [color('green', 'Para conservar'), summary.keep ?? 0],
    [color('yellow', 'Requieren revisión'), summary.review ?? 0]
  ])
  console.log(`\n${color('dim', 'La planificación es solo lectura: no borra, no mueve y no lee secretos.')}`)
  const items = Array.isArray(value.items) ? value.items : []
  if (!items.length) {
    console.log(`\n${color('green', '✓ No se encontraron archivos candidatos en los clientes seleccionados.')}`)
    return
  }
  console.log(`\n${color('bold', 'Detalle de candidatos')}`)
  const rows = items.slice(0, 40).map((item) => {
    const recommendation = item.recommendation === 'reemplazado-por-qz' ? 'reemplazado por qz' : item.recommendation
    const path = item.path?.replace(process.env.HOME || '', '~') || '(sin ruta)'
    return [item.client, item.category, recommendation, path]
  })
  printTable(['CLI', 'Tipo', 'Acción sugerida', 'Archivo'], rows)
  if (value.truncatedItems > 0) console.log(color('dim', `  … y ${value.truncatedItems} elementos más. Usá qz-kit clean --plan para obtener el JSON completo.`))
  console.log(`\n${color('yellow', 'Siguiente paso:')} qz-kit clean --apply inicia confirmación individual y crea un backup antes de borrar.`)
}

function printHuman(action, stdout, stderr) {
  const value = parseJsonOutput(stdout)
  console.log('')
  console.log(`── ${action} ──`)
  if (!value) {
    const text = stripAnsi(stdout || stderr).trim()
    console.log(text || '(sin salida)')
    return
  }
  if (value.mode === 'total-clean') {
    printCleanPlan(value)
    return
  }
  console.log(color('bold', `Resultado: ${value.mode || action}`))
  const scalarKeys = ['mode', 'kit', 'kitVersion', 'projectRoot', 'projectId', 'generatedAt', 'installedAt', 'targets', 'mutations', 'secretValues']
  const scalarRows = []
  for (const key of scalarKeys) if (value[key] !== undefined && typeof value[key] !== 'object') scalarRows.push([label(key), key.toLowerCase().includes('at') ? humanDate(value[key]) : statusValue(Array.isArray(value[key]) ? value[key].join(', ') : value[key])])
  printTable(['Dato', 'Valor'], scalarRows)
  if (value.clients && typeof value.clients === 'object' && !Array.isArray(value.clients)) {
    console.log(`\n${color('bold', 'Clientes')}`)
    printTable(['CLI', 'Estado'], Object.entries(value.clients).map(([name, info]) => [name, info?.detected ? color('green', 'detectado') : color('yellow', 'no detectado')]))
  } else if (Array.isArray(value.clients)) console.log(`clientes: ${value.clients.join(', ') || '(ninguno)'}`)
  for (const key of ['counts', 'summary']) if (value[key] && typeof value[key] === 'object') {
    console.log(`\n${color('bold', label(key))}`)
    printTable(['Indicador', 'Cantidad'], Object.entries(value[key]).map(([name, count]) => [label(name), count]))
  }
  for (const key of ['missing', 'drift', 'contentDrift', 'stale', 'errors', 'warnings']) printList(label(key), value[key])
  if (value.backup) console.log(`backup: ${value.backup}`)
  if (value.rollbackManifest) console.log(`rollback: ${value.rollbackManifest}`)
  if (value.receipt) console.log(`receipt: ${value.receipt}`)
}

const actions = [
  { value: 'install', label: 'Instalar o configurar', hint: 'wizard interactivo para los CLI detectados', args: ['install'] },
  { value: 'check', label: 'Comprobar instalación', hint: 'resumen legible, solo lectura', args: ['install', '--check'] },
  { value: 'update-plan', label: 'Planificar actualización', hint: 'resumen legible, no aplica cambios', args: ['update', '--plan'] },
  { value: 'doctor', label: 'Ejecutar doctor', hint: 'diagnóstico del ecosistema', args: ['doctor'] },
  { value: 'verify', label: 'Verificar seguridad y estado', hint: 'comprobaciones read-only', args: ['verify'] },
  { value: 'memory', label: 'Revisar memoria', hint: 'escaneo read-only de memorias Claude', args: ['memory', 'scan', '--json'] },
  { value: 'clean', label: 'Planificar limpieza total', hint: 'clasifica recursos legacy; no borra', args: ['clean', '--plan', '--client', 'all'] },
  { value: 'help', label: 'Ver ayuda', hint: 'comandos disponibles', args: ['--help'] },
  { value: 'exit', label: 'Salir' }
]

intro('qz-agent-kit · menú principal')
while (true) {
  const choice = await select({ message: '¿Qué querés hacer?', options: actions.map(({ value, label, hint }) => ({ value, label, hint })) })
  if (isCancel(choice) || choice === 'exit') {
    outro('Sin cambios.')
    process.exit(0)
  }
  const action = actions.find((item) => item.value === choice)
  const childScript = action.value === 'clean' ? cleanScript : bin
  const childArgs = action.value === 'clean' ? [...action.args.slice(1), '--menu'] : action.args
  const result = action.value === 'install'
    ? spawnSync(process.execPath, [childScript, ...childArgs], { stdio: 'inherit' })
    : spawnSync(process.execPath, [childScript, ...childArgs], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, stdio: ['inherit', 'pipe', 'pipe'] })
  if (action.value !== 'install') printHuman(action.label, result.stdout || '', result.stderr || '')
  if (result.status !== 0) console.log(`Resultado: terminó con código ${result.status ?? 1}`)
  const again = await confirm({ message: '¿Volver al menú principal?', initialValue: true })
  if (isCancel(again) || !again) {
    outro('Sesión finalizada.')
    process.exit(result.status ?? 0)
  }
}
