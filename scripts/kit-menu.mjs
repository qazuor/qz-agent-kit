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
const stripAnsi = (value) => value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
const label = (key) => ({ mode: 'modo', kit: 'kit', kitVersion: 'versión', version: 'schema', projectRoot: 'proyecto', projectId: 'proyecto', generatedAt: 'generado', installedAt: 'instalado', clients: 'clientes', targets: 'destinos', missing: 'faltantes', drift: 'drift', contentDrift: 'drift de contenido', stale: 'obsoletos', counts: 'conteos', summary: 'resumen', mutations: 'mutaciones', secretValues: 'secretos' }[key] || key)

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

function printHuman(action, stdout, stderr) {
  const value = parseJsonOutput(stdout)
  console.log('')
  console.log(`── ${action} ──`)
  if (!value) {
    const text = stripAnsi(stdout || stderr).trim()
    console.log(text || '(sin salida)')
    return
  }
  const scalarKeys = ['mode', 'kit', 'kitVersion', 'projectRoot', 'projectId', 'generatedAt', 'installedAt', 'targets', 'mutations', 'secretValues']
  for (const key of scalarKeys) if (value[key] !== undefined && typeof value[key] !== 'object') console.log(`${label(key)}: ${Array.isArray(value[key]) ? value[key].join(', ') : value[key]}`)
  if (value.clients && typeof value.clients === 'object' && !Array.isArray(value.clients)) {
    const clients = Object.entries(value.clients).map(([name, info]) => `${name}: ${info?.detected ? 'detectado' : 'no detectado'}`).join(' · ')
    console.log(`clientes: ${clients}`)
  } else if (Array.isArray(value.clients)) console.log(`clientes: ${value.clients.join(', ') || '(ninguno)'}`)
  if (value.counts && typeof value.counts === 'object') console.log(`conteos: ${Object.entries(value.counts).map(([key, count]) => `${label(key)}=${count}`).join(' · ')}`)
  if (value.summary && typeof value.summary === 'object') console.log(`resumen: ${Object.entries(value.summary).map(([key, count]) => `${label(key)}=${count}`).join(' · ')}`)
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
  const result = action.value === 'install'
    ? spawnSync(process.execPath, [bin, ...action.args], { stdio: 'inherit' })
    : spawnSync(process.execPath, [bin, ...action.args], { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] })
  if (action.value !== 'install') printHuman(action.label, result.stdout || '', result.stderr || '')
  if (result.status !== 0) console.log(`Resultado: terminó con código ${result.status ?? 1}`)
  const again = await confirm({ message: '¿Volver al menú principal?', initialValue: true })
  if (isCancel(again) || !again) {
    outro('Sesión finalizada.')
    process.exit(result.status ?? 0)
  }
}
