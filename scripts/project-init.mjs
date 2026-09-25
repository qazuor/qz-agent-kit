#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { basename, join, resolve } from 'node:path'

const args = process.argv.slice(2)
const root = resolve(args.find((arg) => !arg.startsWith('-')) || process.cwd())
const apply = args.includes('--apply')
const interactive = !args.includes('--non-interactive') && input.isTTY && output.isTTY
const manifestPath = join(root, '.qz/project.json')
if (existsSync(manifestPath) && !args.includes('--force')) throw new Error(`ya existe ${manifestPath}; usar --force sólo si se quiere reemplazar`)

const readJson = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null } }
const packageJson = readJson(join(root, 'package.json')) || {}
const packageManager = packageJson.packageManager?.split('@')[0] || (existsSync(join(root, 'pnpm-lock.yaml')) ? 'pnpm' : existsSync(join(root, 'bun.lock')) || existsSync(join(root, 'bun.lockb')) ? 'bun' : existsSync(join(root, 'yarn.lock')) ? 'yarn' : 'npm')
const run = (command, args) => { try { return execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }
const currentBranch = run('git', ['branch', '--show-current']) || 'main'
const projectId = String(packageJson.name || basename(root)).replace(/^@[^/]+\//, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'project'
const scripts = packageJson.scripts || {}
const detectedInstall = `${packageManager} ${packageManager === 'npm' ? 'install' : 'install'}`
const detectedBuild = scripts.build ? `${packageManager} run build` : 'true'
const detectedDev = scripts.dev ? `${packageManager} run dev -- --port {port}` : `${packageManager} run start -- --port {port}`
const defaults = {
  projectId,
  displayName: packageJson.name || basename(root),
  adapter: projectId,
  provider: 'none',
  teamKey: 'GEN',
  baseBranch: currentBranch,
  branchPattern: 'feat/{slug}',
  worktreePath: `../${projectId}-{slug}`,
  install: detectedInstall,
  build: detectedBuild,
  database: 'none',
  serverId: 'app',
  port: '3000',
  start: detectedDev,
  healthPath: '/'
}
const rl = interactive ? createInterface({ input, output }) : null
const ask = async (label, fallback) => rl ? ((await rl.question(`${label} [${fallback}]: `)).trim() || fallback) : fallback
try {
  const values = {}
  for (const [key, label] of [['projectId', 'Project id'], ['displayName', 'Display name'], ['adapter', 'Adapter name'], ['provider', 'Issue provider'], ['teamKey', 'Issue team key'], ['baseBranch', 'Base branch'], ['branchPattern', 'Branch pattern'], ['worktreePath', 'Worktree path pattern'], ['install', 'Install command'], ['build', 'Build command'], ['database', 'Database strategy'], ['serverId', 'Server id'], ['port', 'Default server port'], ['start', 'Server start command'], ['healthPath', 'Health path']]) values[key] = await ask(label, defaults[key])
  const config = {
    $schema: 'https://qz.dev/schemas/project.v1.json',
    schemaVersion: 1,
    projectId: values.projectId,
    adapter: values.adapter,
    displayName: values.displayName,
    issues: { provider: values.provider, teamKey: values.teamKey },
    branches: { base: values.baseBranch, protected: ['main'], pattern: values.branchPattern, promotion: [values.baseBranch, 'main'] },
    worktree: { pathPattern: values.worktreePath, envSource: { kind: 'none' }, install: values.install, build: values.build },
    database: { strategy: values.database },
    servers: [{ id: values.serverId, defaultPort: Number(values.port), start: values.start, healthPath: values.healthPath }],
    commands: { genericPrefix: 'qz-', projectPrefix: `${values.adapter}-`, source: '.qz' }
  }
  const result = { projectRoot: root, manifest: manifestPath, config, mode: apply ? 'apply' : 'plan', mutations: apply ? [manifestPath] : 'none', autodetected: { packageManager, currentBranch, packageName: packageJson.name || null, scripts: Object.keys(scripts) } }
  if (apply) {
    mkdirSync(join(root, '.qz'), { recursive: true })
    let backup = null
    if (existsSync(manifestPath)) {
      backup = `${manifestPath}.bak-${new Date().toISOString().replaceAll(':', '-')}`
      copyFileSync(manifestPath, backup)
    }
    writeFileSync(manifestPath, `${JSON.stringify(config, null, 2)}\n`)
    result.backup = backup
  }
  console.log(JSON.stringify(result, null, 2))
} finally {
  rl?.close()
}
