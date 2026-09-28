#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { confirm, intro, isCancel, multiselect, outro, cancel } from '@clack/prompts'
import { assertValidPlan } from './plan-schema.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const defaultHome = homedir()
const packageSourceHash = createHash('sha256').update(readFileSync(resolve(root, 'package.json'))).digest('hex')
const gitRevision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
const manifestPath = resolve(process.env.QZ_KIT_HOME || defaultHome, '.config/qz-agent-kit/install-plan.json')
const wizardArgs = process.argv.slice(2)
const hasArg = (flag) => wizardArgs.includes(flag)
const argValue = (flag) => { const i = wizardArgs.indexOf(flag); return i >= 0 ? wizardArgs[i + 1] : undefined }
const clients = [
  { value: 'opencode', label: 'OpenCode', hint: 'comandos, skills y agentes qz' },
  { value: 'gentle-shell', label: 'Gentle Shell', hint: 'prompts, skills y agentes qz' },
  { value: 'claude', label: 'Claude Code', hint: 'commands, skills y agents qz' },
  { value: 'codex', label: 'Codex', hint: 'skills, agentes e instrucciones qz' }
]
const components = [
  { value: 'gentle-ai', label: 'Gentle AI', hint: 'instalación/configuración externa; queda como pendiente hasta automatizarla' },
  { value: 'engram', label: 'Engram', hint: 'memoria; nunca copia ni modifica la base automáticamente' },
  { value: 'context7', label: 'Context7', hint: 'MCP/documentación; configuración separada' },
  { value: 'rdd-review', label: 'RDD / review', hint: 'opcional y actualmente desactivado por defecto' },
  { value: 'background-agents', label: 'Background agents', hint: 'opcional; no se activa por defecto' }
]
const providers = [
  { value: 'openai', label: 'OpenAI', hint: 'usar login/API existente, sin leer credenciales' },
  { value: 'nan', label: 'NaN Builders', hint: 'GLM, DeepSeek, Qwen y MiMo vía API compatible' },
  { value: 'opencode-free', label: 'OpenCode gratis', hint: 'catálogo gratuito nativo, sin credencial' },
  { value: 'openkilo', label: 'OpenKilo', hint: 'proveedor/app opcional' },
  { value: 'ollama', label: 'Ollama local', hint: 'requiere servicio local' }
]

const detect = (name) => {
  const result = spawnSync('command', ['-v', name], { shell: true, encoding: 'utf8' })
  return result.status === 0
}
const readPlan = (path = manifestPath) => {
  if (!existsSync(path)) return null
  try { return assertValidPlan(JSON.parse(readFileSync(path, 'utf8'))) } catch (error) { throw new Error(`no se pudo cargar el install-plan ${path}: ${error.message}`) }
}
const choose = async (question, options, initialValues) => {
  const result = await multiselect({ message: question, options, initialValues, required: false })
  if (isCancel(result)) { cancel('Instalación cancelada.'); process.exit(130) }
  return result
}
const savePlan = (plan) => {
  mkdirSync(dirname(manifestPath), { recursive: true })
  writeFileSync(manifestPath, `${JSON.stringify(plan, null, 2)}\n`)
}

const importedPlanPath = argValue('--from')
const previous = readPlan(importedPlanPath ? resolve(importedPlanPath) : manifestPath)
const nonInteractive = hasArg('--non-interactive') || Boolean(importedPlanPath)
if (nonInteractive && !previous) throw new Error(`no se encontró un plan válido: ${importedPlanPath || manifestPath}`)
const targetHome = resolve(argValue('--home') || (importedPlanPath ? defaultHome : previous?.home || defaultHome))
intro('qz-agent-kit · instalación guiada')
if (previous) console.log(`Plan cargado: ${importedPlanPath ? resolve(importedPlanPath) : manifestPath}`)
const detectedClients = clients.filter(({ value }) => detect(value)).map(({ value }) => value)
const selectedClients = nonInteractive ? (previous.clients || []) : await choose('¿Qué CLI/harness querés sincronizar?', clients, previous?.clients || detectedClients)
const selectedComponents = nonInteractive ? (previous.components || []) : await choose('¿Qué componentes del ecosistema querés dejar registrados?', components, previous?.components || ['gentle-ai', 'engram', 'context7'])
const selectedProviders = nonInteractive ? (previous.providers || []) : await choose('¿Qué proveedores querés preparar para una etapa posterior?', providers, previous?.providers || ['openai'])
const apply = nonInteractive ? hasArg('--apply') : await confirm({ message: '¿Aplicar ahora la capa qz administrada?', initialValue: true })
if (isCancel(apply)) { cancel('Instalación cancelada.'); process.exit(130) }

const plan = {
  schemaVersion: 1,
  kit: '@qz/agent-kit',
  createdAt: previous?.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sourcePackageHash,
  sourceCommit: gitRevision.status === 0 ? gitRevision.stdout.trim() : null,
  home: targetHome,
  clients: selectedClients,
  components: selectedComponents,
  providers: selectedProviders,
  automation: {
    qzLayer: 'implemented',
    externalComponents: 'recorded-only-until-explicit-adapters',
    credentials: 'never-read-or-copied',
    engramData: 'never-read-or-modified-by-installer'
  }
}
savePlan(plan)
console.log(`Plan guardado en ${manifestPath}`)
const externalPlan = spawnSync(process.execPath, [resolve(root, 'scripts/external-plan.mjs'), '--from', manifestPath], { encoding: 'utf8' })
if (externalPlan.status === 0) {
  try {
    const external = JSON.parse(externalPlan.stdout)
    if (external.actions.length) console.log(`Acciones externas pendientes: ${external.actions.map((action) => `${action.component}=${action.status}`).join(', ')}`)
  } catch { console.log('No se pudo resumir el plan externo; revisar qz-kit external-plan.') }
}
if (!apply) { outro('Plan guardado; no se aplicaron cambios.'); process.exit(0) }
const args = ['--apply', '--home', plan.home, '--client', selectedClients.length ? selectedClients.join(',') : 'none', '--skip-wizard']
const result = spawnSync(process.execPath, [resolve(root, 'scripts/install.mjs'), ...args], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status ?? 1)
console.log('Componentes externos registrados como selección pendiente; cada adapter se implementará de forma explícita y verificable.')
outro('Capa qz instalada.')
