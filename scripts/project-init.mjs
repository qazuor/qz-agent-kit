#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { stdin as input, stdout as output } from 'node:process'
import { cancel, intro, isCancel, outro, select, text } from '@clack/prompts'

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
const detectedInstall = `${packageManager} install`
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
const databaseDefaults = {
  container: 'postgres',
  templateDatabase: `${projectId}_template`,
  databaseNamePattern: `${projectId}_{slug}`,
  connectionEnvVar: 'DATABASE_URL'
}
const askText = async (message, initialValue) => {
  const result = await text({ message, initialValue, placeholder: initialValue })
  if (isCancel(result)) { cancel('Inicialización cancelada.'); process.exit(0) }
  return result.trim() || initialValue
}
const askSelect = async (message, initialValue, options) => {
  const result = await select({ message, initialValue, options: options.map((value) => ({ value, label: value })) })
  if (isCancel(result)) { cancel('Inicialización cancelada.'); process.exit(0) }
  return result
}
try {
  if (interactive) intro(`qz project init · ${root}`)
  let values
  if (interactive) {
    values = {
      projectId: await askText('Project id', defaults.projectId),
      displayName: await askText('Display name', defaults.displayName),
      adapter: await askText('Adapter name', defaults.adapter),
      provider: await askSelect('Issue provider', defaults.provider, ['none', 'linear', 'github']),
      teamKey: await askText('Issue team key', defaults.teamKey),
      baseBranch: await askText('Base branch', defaults.baseBranch),
      branchPattern: await askText('Branch pattern', defaults.branchPattern),
      worktreePath: await askText('Worktree path pattern', defaults.worktreePath),
      install: await askText('Install command', defaults.install),
      build: await askText('Build command', defaults.build),
      database: await askSelect('Database strategy', defaults.database, ['none', 'postgres-template']),
      serverId: await askText('Server id', defaults.serverId),
      port: await askText('Default server port', defaults.port),
      start: await askText('Server start command', defaults.start),
      healthPath: await askText('Health path', defaults.healthPath)
    }
    if (values.database === 'postgres-template') {
      Object.assign(values, {
        databaseContainer: await askText('Database container', databaseDefaults.container),
        templateDatabase: await askText('Template database', databaseDefaults.templateDatabase),
        databaseNamePattern: await askText('Database name pattern', databaseDefaults.databaseNamePattern),
        connectionEnvVar: await askText('Connection env var', databaseDefaults.connectionEnvVar)
      })
    }
  } else {
    values = defaults
  }
  const config = {
    $schema: 'https://qz.dev/schemas/project.v1.json',
    schemaVersion: 1,
    projectId: values.projectId,
    adapter: values.adapter,
    displayName: values.displayName,
    issues: { provider: values.provider, teamKey: values.teamKey },
    branches: { base: values.baseBranch, protected: ['main'], pattern: values.branchPattern, promotion: [values.baseBranch, 'main'] },
    worktree: { pathPattern: values.worktreePath, envSource: { kind: 'none' }, install: values.install, build: values.build },
    database: values.database === 'postgres-template' ? {
      strategy: values.database,
      container: values.databaseContainer,
      templateDatabase: values.templateDatabase,
      databaseNamePattern: values.databaseNamePattern,
      connectionEnvVar: values.connectionEnvVar
    } : { strategy: values.database },
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
  if (interactive) outro(apply ? `Manifest escrito en ${manifestPath}` : 'Plan generado; no se modificó el proyecto.')
  console.log(JSON.stringify(result, null, 2))
} finally {
  // @clack/prompts owns the terminal state; no readline handle to close.
}
