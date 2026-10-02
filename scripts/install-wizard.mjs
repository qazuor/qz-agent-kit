#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { confirm, intro, isCancel, multiselect, outro, cancel, text } from '@clack/prompts'
import { assertValidPlan } from './plan-schema.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const defaultHome = homedir()
const packageSourceHash = createHash('sha256').update(readFileSync(resolve(root, 'package.json'))).digest('hex')
const gitRevision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
const wizardArgs = process.argv.slice(2)
const hasArg = (flag) => wizardArgs.includes(flag)
const argValue = (flag) => { const i = wizardArgs.indexOf(flag); return i >= 0 ? wizardArgs[i + 1] : undefined }
const importedPlanPath = argValue('--from')
const requestedHome = argValue('--home')
const initialManifestPath = resolve(process.env.QZ_KIT_HOME || requestedHome || defaultHome, '.config/qz-agent-kit/install-plan.json')
const clients = [
  { value: 'opencode', label: 'OpenCode', hint: 'comandos, skills y agentes qz' },
  { value: 'gentle-shell', label: 'Gentle Shell', hint: 'prompts, skills y agentes qz' },
  { value: 'claude', label: 'Claude Code', hint: 'commands, skills y agents qz' },
  { value: 'codex', label: 'Codex', hint: 'skills, agentes e instrucciones qz' }
]
const components = [
  { value: 'gentle-ai', label: 'Gentle AI', hint: 'preview, backup nativo, instalación oficial y doctor' },
  { value: 'engram', label: 'Engram', hint: 'backup SQLite, integridad y setup MCP; nunca migra memoria implícitamente' },
  { value: 'context7', label: 'Context7', hint: 'MCP/documentación; lo provisiona Gentle AI para OpenCode' },
  { value: 'rdd-review', label: 'RDD / review', hint: 'activa el modo global de revisión de Gentle AI' },
  { value: 'background-agents', label: 'Background agents', hint: 'activa background sólo en OpenCode; Pi queda en foreground' }
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

const runJson = (script, args, home = null) => {
  const env = home ? { ...process.env, HOME: home } : process.env
  const result = spawnSync(process.execPath, [resolve(root, 'scripts', script), ...args], { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'], maxBuffer: 2 * 1024 * 1024, env })
  let parsed = null
  try { parsed = JSON.parse(result.stdout || '') } catch {}
  return { result, parsed }
}

const runExternalComponents = async (plan) => {
  const selected = new Set(plan.components || [])
  const supported = [...selected].filter((component) => ['gentle-ai', 'engram'].includes(component))
  const delegated = [...selected].filter((component) => ['context7', 'rdd-review', 'background-agents'].includes(component))
  if (delegated.length) console.log(`Componentes delegados a Gentle AI/OpenCode: ${delegated.join(', ')}.`)
  if (delegated.length && !selected.has('gentle-ai')) console.log('Estos componentes requieren seleccionar Gentle AI para poder provisionarse; quedan registrados sin mutación.')
  if (!supported.length) return
  if (nonInteractive && !hasArg('--external-apply')) {
    console.log('Componentes externos seleccionados pero no aplicados: el modo no interactivo requiere --external-apply explícito.')
    return
  }
  const proceed = nonInteractive || await confirm({ message: `¿Ejecutar ahora los adapters oficiales (${supported.join(', ')})?`, initialValue: false })
  if (isCancel(proceed) || !proceed) {
    console.log('Componentes externos registrados como pendientes; no se ejecutaron mutaciones externas.')
    return
  }
  const receiptRoot = resolve(plan.home, '.local/state/qz-agent-kit/external-receipts')
  mkdirSync(receiptRoot, { recursive: true, mode: 0o700 })
  for (const component of supported) {
    if (component === 'gentle-ai' && !plan.clients.includes('opencode')) {
      console.log('Gentle AI: pendiente; el adapter verificado actualmente requiere OpenCode.')
      continue
    }
    let project = argValue('--engram-project')
    if (component === 'engram' && !project && !nonInteractive) {
      const answer = await text({ message: 'Proyecto de Engram para configurar (vacío para dejarlo pendiente):', placeholder: 'hospeda', defaultValue: '' })
      if (isCancel(answer)) { console.log('Engram: cancelado; no se tocó la memoria.'); continue }
      project = answer.trim() || null
    }
    if (component === 'engram' && !project) {
      console.log('Engram: pendiente; hace falta --engram-project <nombre> y un backup verificable.')
      continue
    }
    const receipt = resolve(receiptRoot, `${component}-preview.json`)
    const previewArgs = ['--component', component, '--from', manifestPath, '--receipt', receipt, '--force-receipt']
    if (project) previewArgs.push('--project', project)
    let preview = runJson('external-preview.mjs', previewArgs, plan.home)
    const previewStatus = preview.parsed?.results?.find((item) => item.component === component)?.status
    if (previewStatus === 'unavailable') {
      const bootstrap = nonInteractive
        ? hasArg('--external-bootstrap')
        : await confirm({ message: `${component} no está instalado. ¿Instalar el binario oficial estable ahora?`, initialValue: false })
      if (isCancel(bootstrap) || !bootstrap) {
        console.log(`${component}: binario ausente; queda pendiente.`)
        continue
      }
      const bootstrapReceipt = resolve(receiptRoot, `${component}-bootstrap.json`)
      const bootstrapResult = runJson('external-bootstrap.mjs', ['--component', component, '--from', manifestPath, '--approve', 'QZ_EXTERNAL_BOOTSTRAP', '--receipt', bootstrapReceipt], plan.home)
      if (bootstrapResult.result.status !== 0) {
        console.log(`${component}: bootstrap falló; no se ejecuta configuración.`)
        continue
      }
      preview = runJson('external-preview.mjs', previewArgs, plan.home)
    }
    const previewOk = preview.result.status === 0 && preview.parsed?.results?.find((item) => item.component === component)?.status === 'ok'
    if (!previewOk) {
      console.log(`${component}: preview no aprobado; queda pendiente y no se ejecuta.`)
      continue
    }
    if (component === 'engram') {
      const backup = resolve(receiptRoot, 'engram-backup')
      const backupResult = runJson('external-backup.mjs', ['--component', 'engram', '--project', project, '--approve', 'ENGRAM_BACKUP', '--output', backup], plan.home)
      if (backupResult.result.status !== 0 || backupResult.parsed?.backup?.integrity !== 'ok') {
        console.log('Engram: backup o integrity_check falló; no se ejecuta setup.')
        continue
      }
      const apply = runJson('external-apply.mjs', ['--component', 'engram', '--project', project, '--backup', resolve(backup, 'manifest.json'), '--receipt', receipt, '--from', manifestPath, '--approve', 'ENGRAM_APPLY'], plan.home)
      console.log(`Engram: ${apply.result.status === 0 ? 'configurado y verificado' : 'falló; revisar receipt'}.`)
      continue
    }
    const apply = runJson('external-apply.mjs', ['--component', component, '--receipt', receipt, '--from', manifestPath, '--approve', 'GENTLE_AI_APPLY', '--home', plan.home], plan.home)
    const gentleOk = apply.result.status === 0
    console.log(`Gentle AI: ${gentleOk ? 'instalado/configurado y verificado' : 'falló; revisar receipt'}.`)
    if (gentleOk && selected.has('rdd-review')) {
      const review = spawnSync('gentle-ai', ['review', 'mode', 'enable', '--scope', 'global', '--json'], { encoding: 'utf8', stdio: 'inherit', timeout: 30000, env: { ...process.env, HOME: plan.home } })
      console.log(`RDD/review: ${review.status === 0 ? 'habilitado globalmente' : 'no se pudo habilitar; revisar Gentle AI'}.`)
    }
  }
}

const previous = readPlan(importedPlanPath ? resolve(importedPlanPath) : initialManifestPath)
const nonInteractive = hasArg('--non-interactive') || Boolean(importedPlanPath)
if (nonInteractive && !previous) throw new Error(`no se encontró un plan válido: ${importedPlanPath || initialManifestPath}`)
const targetHome = resolve(argValue('--home') || (importedPlanPath ? defaultHome : previous?.home || defaultHome))
const manifestPath = resolve(process.env.QZ_KIT_HOME || targetHome, '.config/qz-agent-kit/install-plan.json')
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
  sourcePackageHash: packageSourceHash,
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
await runExternalComponents(plan)
outro('Capa qz instalada.')
