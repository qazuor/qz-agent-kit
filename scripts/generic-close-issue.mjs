#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const argv = process.argv.slice(2)
const rootIndex = argv.indexOf('--root')
const root = resolve(rootIndex >= 0 ? argv[rootIndex + 1] || '.' : process.cwd())
const args = argv.filter((arg, index) => index !== rootIndex && index !== rootIndex + 1)
if (args.includes('--help') || !args.find((arg) => !arg.startsWith('-'))) {
  console.log(`qz close-issue (fallback genérico)\n\nUso:\n  qz close-issue [issue-o-slug] [--root <ruta>]\n\nVerifica el cierre local del worktree. No actualiza Linear, no elimina worktrees y no modifica Git.`)
  process.exit(args.includes('--help') ? 0 : 2)
}
const manifestPath = join(root, '.qz/project.json')
if (!existsSync(manifestPath)) {
  console.error(`qz close-issue: no encontré ${manifestPath}`)
  process.exit(1)
}
const issue = args.find((arg) => !arg.startsWith('-')) || null
const git = (gitArgs) => spawnSync('git', gitArgs, { cwd: root, encoding: 'utf8' })
const worktree = git(['rev-parse', '--show-toplevel']).stdout.trim() || root
const branch = git(['branch', '--show-current']).stdout.trim() || null
const dirty = (git(['status', '--porcelain']).stdout || '').trim().length > 0
const result = { mode: 'local-closeout', issue, worktree, branch, clean: !dirty, linearClosed: false, mutations: 'none', secretValues: 'not-read' }
console.log(JSON.stringify(result, null, 2))
if (dirty) {
  console.error('qz close-issue: el worktree tiene cambios; no se considera cerrado.')
  process.exit(1)
}
