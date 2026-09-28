import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const command = args.shift() || 'status'
const home = args.includes('--home') ? args[args.indexOf('--home') + 1] : homedir()
const opencodePath = join(home, '.config/opencode/opencode.json')
const gentlePath = join(home, '.gentle-shell/agent/settings.json')
const backupRoot = join(home, '.local/state/qz-agent-kit/model-switch-backups')

const load = (path) => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
const save = (path, value) => {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
}
const splitModel = (value) => {
  const slash = value.indexOf('/')
  if (slash < 1 || slash === value.length - 1) throw new Error('modelo inválido; usá provider/modelo')
  return { provider: value.slice(0, slash), model: value.slice(slash + 1), value }
}
const gentleProvider = (provider) => provider === 'openai' ? 'openai-codex' : provider
const stamp = new Date().toISOString().replace(/[:.]/g, '-')

if (command === 'status') {
  const op = load(opencodePath)
  const gs = load(gentlePath)
  console.log(`OpenCode: ${op.model || '(sin default)'}`)
  console.log(`Gentle Shell: ${gs.defaultProvider && gs.defaultModel ? `${gs.defaultProvider}/${gs.defaultModel}` : '(sin default)'}`)
  process.exit(0)
}

if (command === 'list') {
  console.log('NaN: nan/glm5.3-flash, nan/deepseek-v4-flash, nan/qwen3.8-flash, nan/mimo-v2.6-flash')
  console.log('OpenCode gratis: ejecutar `opencode models opencode`')
  console.log('OpenAI: ejecutar `opencode models openai` y `gentle-shell --list-models openai-codex`')
  process.exit(0)
}

if (command !== 'use') throw new Error('uso: qz-kit model status|list|use provider/model [--home DIR]')
const target = args.find((arg) => !arg.startsWith('--') && arg !== home)
if (!target) throw new Error('falta provider/model')
const selected = splitModel(target)
const op = load(opencodePath)
const gs = load(gentlePath)
mkdirSync(join(backupRoot, stamp), { recursive: true })
if (existsSync(opencodePath)) copyFileSync(opencodePath, join(backupRoot, stamp, 'opencode.json'))
if (existsSync(gentlePath)) copyFileSync(gentlePath, join(backupRoot, stamp, 'gentle-shell-settings.json'))
op.model = selected.value
gs.defaultProvider = gentleProvider(selected.provider)
gs.defaultModel = selected.model
save(opencodePath, op)
save(gentlePath, gs)
console.log(`Modelo seleccionado: ${selected.value}`)
console.log(`Backup: ${join(backupRoot, stamp)}`)
