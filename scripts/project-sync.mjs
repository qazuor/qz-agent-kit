#!/usr/bin/env node
/** Synchronize a project's declared knowledge layer into selected clients. */
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const projectRoot = resolve(args.find((arg, index) => !arg.startsWith('-') && args[index - 1] !== '--client' && args[index - 1] !== '--home') || process.cwd())
const requested = value('--client') || 'all'
const clients = requested === 'all' ? ['opencode', 'claude', 'codex', 'gentle-shell'] : [...new Set(requested.split(',').map((name) => name.trim()).filter(Boolean))]
const allowed = new Set(['opencode', 'claude', 'codex', 'gentle-shell'])
if (has('--help') || !['--plan', '--check', '--apply'].some(has)) {
  console.log('Usage: qz-kit project sync <project-root> --plan|--check|--apply [--client <name[,name]|all>] [--home <dir>] [--replace] [--replace-instructions]')
  process.exit(has('--help') ? 0 : 2)
}
if (!clients.length || clients.some((client) => !allowed.has(client))) throw new Error(`cliente inválido: ${clients.join(', ')}`)
const manifestPath = join(projectRoot, '.qz/project.json')
if (!existsSync(manifestPath)) throw new Error(`no existe ${manifestPath}`)
const config = JSON.parse(readFileSync(manifestPath, 'utf8'))
if (!config.knowledge) throw new Error('el proyecto no declara knowledge en .qz/project.json')

const mode = has('--apply') ? 'apply' : has('--check') ? 'check' : 'plan'
const home = resolve(value('--home') || homedir())
const destinationRoot = {
  opencode: join(projectRoot, '.opencode'),
  claude: join(projectRoot, '.claude'),
  codex: join(projectRoot, '.codex'),
  'gentle-shell': join(projectRoot, '.gentle-shell', 'agent')
}
const rendered = mkdtempSync(join('/tmp', 'qz-project-render-'))
const renderer = resolve(new URL('./project-render.mjs', import.meta.url).pathname)
const cleanup = () => rmSync(rendered, { recursive: true, force: true })
try {
  const files = []
  const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
  const copyList = (client) => {
    const output = join(rendered, client)
    const result = spawnSync(process.execPath, [renderer, projectRoot, '--client', client, '--output', output], { encoding: 'utf8' })
    if (result.status !== 0) throw new Error(result.stderr || `no se pudo renderizar ${client}`)
    const visit = (directory) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const source = join(directory, entry.name)
        if (entry.isDirectory()) visit(source)
        else if (entry.isFile()) files.push({ client, source, relative: relative(output, source) })
      }
    }
    visit(output)
  }
  for (const client of clients) copyList(client)

  const targetFor = (item) => {
    if (item.relative === join('instructions', 'AGENTS.md')) return join(projectRoot, 'AGENTS.md')
    const root = destinationRoot[item.client]
    return join(root, item.relative.replace(/^instructions[\\/]/, ''))
  }
  const details = files.map((item) => {
    const target = targetFor(item)
    const sourceHash = hash(item.source)
    const targetHash = existsSync(target) && statSync(target).isFile() ? hash(target) : null
    return { client: item.client, source: item.source, target, sourceHash, targetHash, state: targetHash === null ? 'missing' : targetHash === sourceHash ? 'current' : 'drift' }
  })
  const blocked = details.filter((item) => item.state === 'drift' && !has('--replace') && !(item.target === join(projectRoot, 'AGENTS.md') && has('--replace-instructions')))
  const result = {
    projectRoot,
    projectId: config.projectId || null,
    mode,
    clients,
    files: details.map(({ source, ...item }) => item),
    counts: {
      total: details.length,
      current: details.filter((item) => item.state === 'current').length,
      missing: details.filter((item) => item.state === 'missing').length,
      drift: details.filter((item) => item.state === 'drift').length,
      blocked: blocked.length
    },
    mutations: mode === 'apply' ? 'project knowledge targets only' : 'none',
    secretValues: 'not-read'
  }
  if (mode !== 'apply') {
    console.log(JSON.stringify(result, null, 2))
    const status = (result.counts.missing || result.counts.drift || blocked.length) ? 1 : 0
    cleanup()
    process.exit(status)
  }
  if (blocked.length) throw new Error(`hay ${blocked.length} archivo(s) con drift; usá --replace y, para AGENTS.md, --replace-instructions`)
  const backupRoot = join(home, '.local/state/qz-agent-kit/project-backups', new Date().toISOString().replaceAll(':', '-'))
  const backed = []
  for (const item of details) {
    if (existsSync(item.target)) {
      const backup = join(backupRoot, item.client, relative(projectRoot, item.target))
      mkdirSync(dirname(backup), { recursive: true })
      cpSync(item.target, backup)
      backed.push({ target: item.target, backup })
    }
    mkdirSync(dirname(item.target), { recursive: true })
    cpSync(item.source, item.target)
  }
  mkdirSync(backupRoot, { recursive: true })
  const manifest = { projectRoot, projectId: config.projectId || null, clients, appliedAt: new Date().toISOString(), files: details.map(({ source, ...item }) => item), backups: backed, secrets: 'values-not-read' }
  const manifestPath = join(backupRoot, 'project-sync-manifest.json')
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(JSON.stringify({ ...result, backup: backupRoot, rollbackManifest: manifestPath, applied: details.length }, null, 2))
} finally {
  cleanup()
}
