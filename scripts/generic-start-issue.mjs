#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'

const argv = process.argv.slice(2)
const rootIndex = argv.indexOf('--root')
const root = rootIndex >= 0 ? resolve(argv[rootIndex + 1] || '.') : process.cwd()
const args = argv.filter((arg, index) => index !== rootIndex && index !== rootIndex + 1)
const help = args.includes('--help') || args.includes('-h')
if (help || !args.find((arg) => !arg.startsWith('-'))) {
  console.log(`qz start-issue (fallback genérico)\n\nUso:\n  qz start-issue <issue-o-slug> [tipo] [--base <branch>] [--agent <cli>] [--dry-run]\n\nCrea un worktree Git básico desde .qz/project.json. No consulta Linear, no copia envs, no crea bases y no levanta servidores.`)
  process.exit(help ? 0 : 2)
}
const positional = args.filter((arg) => !arg.startsWith('-'))
const issue = positional[0]
const type = positional[1] || 'feat'
const baseFlag = args.indexOf('--base')
const base = baseFlag >= 0 ? args[baseFlag + 1] : null
const agentFlag = args.indexOf('--agent')
const agent = agentFlag >= 0 ? args[agentFlag + 1] : null
const dryRun = args.includes('--dry-run')

const manifestPath = join(root, '.qz/project.json')
if (!existsSync(manifestPath)) {
  console.error(`qz start-issue: no encontré ${manifestPath}`)
  process.exit(1)
}
const config = JSON.parse(readFileSync(manifestPath, 'utf8'))
const slug = issue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
const branchPattern = config.branches?.pattern || '{type}/{slug}'
const branch = branchPattern.replaceAll('{type}', type).replaceAll('{slug}', slug)
const pathPattern = config.worktree?.pathPattern || `../${config.projectId || 'project'}-{slug}`
const relativePath = pathPattern.replaceAll('{slug}', slug)
const worktree = resolve(root, relativePath)
const configuredBase = base || config.branches?.base
const current = spawnSync('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout?.trim()
const startCandidates = [configuredBase, current, configuredBase ? `origin/${configuredBase}` : null].filter(Boolean)
const hasRef = (ref) => spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${ref}`], { cwd: root }).status === 0 || spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/remotes/${ref}`], { cwd: root }).status === 0
const start = startCandidates.find(hasRef) || configuredBase || current || 'HEAD'
const existing = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout || ''
if (existing.split('\n').some((line) => line === `branch refs/heads/${branch}`)) {
  console.log(`EXISTS ${branch}`)
  process.exit(0)
}
console.log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'create', project: config.projectId || null, issue, branch, base: start, worktree, capabilities: { linear: false, env: false, database: false, servers: false } }, null, 2))
if (dryRun) process.exit(0)
const created = spawnSync('git', ['worktree', 'add', worktree, '-b', branch, start], { cwd: root, stdio: 'inherit' })
if (created.status !== 0) process.exit(created.status || 1)
for (const command of [config.worktree?.install, config.worktree?.build].filter(Boolean)) {
  const result = spawnSync(command, { cwd: worktree, shell: true, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}
if (agent && ['claude', 'opencode', 'codex', 'gentle-shell'].includes(agent)) {
  const result = spawnSync(agent, [], { cwd: worktree, stdio: 'inherit' })
  process.exit(result.status || 0)
}
