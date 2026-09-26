#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const home = homedir()
const commandPath = (name) => {
  const result = spawnSync('command', ['-v', name], { shell: true, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : null
}
const version = (path) => {
  if (!path) return null
  for (const args of [['--version'], ['version']]) {
    const result = spawnSync(path, args, { encoding: 'utf8', timeout: 5000 })
    const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim()
    if (result.status === 0 && output) return output.split('\n').slice(0, 3).join(' ').replace(/\s+/g, ' ')
  }
  return null
}
const method = (path) => {
  if (!path) return null
  if (path.includes('/.nvm/') || path.includes('/.local/share/nvm/')) return 'nvm'
  if (path.includes('/.local/bin/')) return 'local-bin'
  if (path.startsWith('/usr/bin/') || path.startsWith('/usr/local/bin/')) return 'system'
  return 'other'
}
const inspect = (name, candidates, paths) => {
  const path = commandPath(name)
  return { id: name, installed: Boolean(path), executable: path, method: method(path), version: version(path), candidatePaths: candidates, config: paths.map((candidate) => ({ path: candidate, exists: existsSync(candidate) })), mutations: 'none', secretValues: 'not-read' }
}
const existingEnvNames = Object.keys(process.env).filter((key) => /^(OPENAI|ANTHROPIC|LINEAR|CONTEXT7|ENGRAM|DEEPSEEK|GLM|ZAI)_/.test(key)).sort()
console.log(JSON.stringify({
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  components: [
    inspect('opencode', ['npm', 'standalone'], [join(home, '.config/opencode'), join(home, '.local/share/opencode'), join(home, '.local/state/opencode')]),
    inspect('gentle-ai', ['npm', 'brew', 'standalone'], [join(home, '.config/gentle-ai'), join(home, '.gentle-ai')]),
    inspect('gentle-shell', ['npm', 'standalone'], [join(home, '.gentle-shell')]),
    inspect('engram', ['go', 'standalone'], [join(home, '.config/engram'), join(home, '.local/share/engram'), join(home, '.engram')]),
    inspect('claude', ['npm', 'standalone'], [join(home, '.claude')]),
    inspect('codex', ['npm', 'standalone'], [join(home, '.codex')])
  ],
  integrations: { context7: { status: 'not-probed', reason: 'no network or credential contents read' }, providers: { environmentVariableNames: existingEnvNames, values: 'not-read' } },
  mutations: 'none',
  secretValues: 'not-read'
}, null, 2))
