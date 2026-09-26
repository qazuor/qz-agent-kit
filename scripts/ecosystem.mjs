#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const home = homedir()
const args = process.argv.slice(2)
const argValue = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
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
const authPaths = {
  opencode: join(home, '.local/share/opencode/auth.json'),
  'gentle-shell': join(home, '.gentle-shell/agent/auth.json'),
  claude: join(home, '.claude/.credentials.json'),
  codex: join(home, '.codex/auth.json')
}
const uiPaths = {
  opencode: [join(home, '.config/opencode/tui.json'), join(home, '.config/opencode/plugins')],
  'gentle-shell': [join(home, '.gentle-shell/agent/settings.json'), join(home, '.gentle-shell/agent/themes')],
  claude: [join(home, '.claude/settings.json'), join(home, '.claude/plugins')],
  codex: [join(home, '.codex/config.toml'), join(home, '.codex/skills')]
}
const engramCheck = argValue('--engram-check')
const engramProject = argValue('--project')
let engramDiagnostic = { requested: false, mutations: 'none', secretValues: 'not-read' }
if (engramCheck) {
  const command = commandPath('engram')
  if (!command) engramDiagnostic = { requested: true, status: 'unavailable', check: engramCheck, mutations: 'none', secretValues: 'not-read' }
  else {
    const commandArgs = ['doctor', '--json', '--check', engramCheck]
    if (engramProject) commandArgs.push('--project', engramProject)
    const probe = spawnSync(command, commandArgs, { encoding: 'utf8', timeout: 8000 })
    let parsed = null
    try { parsed = JSON.parse(probe.stdout) } catch {}
    engramDiagnostic = { requested: true, status: probe.error?.code === 'ETIMEDOUT' ? 'timeout' : probe.status === 0 ? 'ok-or-warning' : 'error', check: engramCheck, project: engramProject || null, result: parsed, output: parsed ? null : `${probe.stdout || ''}${probe.stderr || ''}`.trim().slice(0, 1000), mutations: 'none', secretValues: 'not-read' }
  }
}
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
  integrations: { context7: { status: 'not-probed', reason: 'no network or credential contents read' }, providers: { environmentVariableNames: existingEnvNames, values: 'not-read' }, auth: Object.fromEntries(Object.entries(authPaths).map(([id, path]) => [id, { path, present: existsSync(path), contents: 'not-read' }])), tuiAndPlugins: Object.fromEntries(Object.entries(uiPaths).map(([id, paths]) => [id, paths.map((path) => ({ path, present: existsSync(path), contents: 'not-read' }))])), engramDiagnostic },
  mutations: 'none',
  secretValues: 'not-read'
}, null, 2))
