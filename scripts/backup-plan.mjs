#!/usr/bin/env node
/** Read-only inventory of paths that a future installer must back up. */
import { existsSync, statSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'

const root = resolve(dirname(new URL(import.meta.url).pathname), '..')
const home = process.env.HOME || '~'
const args = process.argv.slice(2)
const projectArg = args.includes('--project') ? args[args.indexOf('--project') + 1] : args.find((arg) => !arg.startsWith('-'))
const projectRoot = resolve(projectArg || process.cwd())
const paths = [
  `${home}/.config/opencode`,
  `${home}/.claude`,
  `${home}/.codex`,
  `${home}/.engram`,
  `${home}/.local/share/opencode`,
  `${home}/.local/state/hospeda-opencode-migration`,
  join(projectRoot, '.opencode'),
  join(projectRoot, '.qz'),
  join(projectRoot, 'AGENTS.md'),
  join(projectRoot, '.specs'),
  join(projectRoot, '.qtm'),
  join(projectRoot, 'scripts/client-tools')
]
const entries = paths.map((path) => {
  if (!existsSync(path)) return { path, exists: false }
  const stat = statSync(path)
  return { path, exists: true, type: stat.isDirectory() ? 'directory' : 'file', bytes: stat.size }
})
console.log(JSON.stringify({
  mode: 'read-only',
  projectRoot,
  entries,
  secretValues: 'not-read',
  mutations: 'none',
  requiredBeforeApply: ['filesystem-space', 'checksums', 'backup-copy', 'backup-verification', 'rollback-manifest']
}, null, 2))
