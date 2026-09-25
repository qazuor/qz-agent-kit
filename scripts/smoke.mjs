#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const node = process.execPath
const run = (script, args) => execFileSync(node, [resolve(root, script), ...args], { cwd: root, encoding: 'utf8' })
const parse = (value) => JSON.parse(value)

parse(run('scripts/validate-project.mjs', ['fixtures/generic-project']))
const fixture = resolve(root, 'fixtures/generic-project')
const qz = resolve(root, 'bin/qz')
parse(execFileSync(qz, ['doctor'], { cwd: fixture, encoding: 'utf8' }))
parse(execFileSync(qz, ['config', '--json'], { cwd: fixture, encoding: 'utf8' }))
parse(execFileSync(qz, ['context', 'smoke'], { cwd: fixture, encoding: 'utf8' }))

const renderRoot = mkdtempSync(join(tmpdir(), 'qz-render-'))
const installHome = mkdtempSync(join(tmpdir(), 'qz-install-'))
const configRoot = mkdtempSync(join(tmpdir(), 'qz-config-'))
try {
  mkdirSync(join(configRoot, '.qz'), { recursive: true })
  const fixtureConfig = JSON.parse(readFileSync(join(fixture, '.qz/project.json'), 'utf8'))
  fixtureConfig.privateAuth = { token: 'must-not-appear', nested: { password: 'must-not-appear' } }
  writeFileSync(join(configRoot, '.qz/project.json'), `${JSON.stringify(fixtureConfig)}\n`)
  const sanitized = execFileSync(qz, ['config', '--json'], { cwd: configRoot, encoding: 'utf8' })
  if (sanitized.includes('must-not-appear') || sanitized.includes('privateAuth')) throw new Error('qz config expuso un campo sensible')
  for (const client of ['opencode', 'claude', 'codex', 'gentle-shell']) {
    const output = join(renderRoot, client)
    parse(run('scripts/render.mjs', ['--client', client, '--output', output]))
    if (!existsSync(join(output, 'qz-agent-kit/instructions/AGENTS.md')) || !existsSync(join(output, 'qz-agent-kit/guards/staged-secrets.sh'))) {
      throw new Error(`recursos centrales incompletos para ${client}`)
    }
    if (!existsSync(join(output, 'skills/qz-commands/SKILL.md')) || !existsSync(join(output, 'skills/qz-agents/SKILL.md'))) {
      throw new Error(`render incompleto para ${client}`)
    }
  }
  const apply = parse(run('scripts/install.mjs', ['--apply', '--home', installHome]))
  if (apply.missing.length || apply.contentDrift.length || !existsSync(join(installHome, '.local/bin/qz'))) {
    throw new Error('instalación smoke incompleta')
  }
  const rollbackManifest = apply.rollbackManifest
  parse(run('scripts/rollback.mjs', [rollbackManifest]))
  if (existsSync(join(installHome, '.local/bin/qz'))) throw new Error('rollback no eliminó qz creado por la prueba')
} finally {
  rmSync(renderRoot, { recursive: true, force: true })
  rmSync(installHome, { recursive: true, force: true })
  rmSync(configRoot, { recursive: true, force: true })
}
console.log(JSON.stringify({ smoke: 'ok', clients: 4, mutations: 'temporary-only', secretValues: 'not-read' }, null, 2))
