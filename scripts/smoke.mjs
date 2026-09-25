#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
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
const invalidProject = mkdtempSync(join(tmpdir(), 'qz-invalid-project-'))
const registryHome = mkdtempSync(join(tmpdir(), 'qz-registry-'))
const fallbackRoot = mkdtempSync(join(tmpdir(), 'qz-fallback-'))
try {
  mkdirSync(join(configRoot, '.qz'), { recursive: true })
  const fixtureConfig = JSON.parse(readFileSync(join(fixture, '.qz/project.json'), 'utf8'))
  writeFileSync(join(configRoot, '.qz/project.json'), `${JSON.stringify(fixtureConfig)}\n`)
  const discovered = parse(execFileSync(node, [resolve(root, 'scripts/projects.mjs'), 'discover', configRoot], { cwd: root, encoding: 'utf8' }))
  if (discovered.mutations !== 'none' || discovered.projects.length !== 1 || discovered.projects[0].projectId !== fixtureConfig.projectId) {
    throw new Error('discover no encontró el adapter del proyecto')
  }
  fixtureConfig.privateAuth = { token: 'must-not-appear', nested: { password: 'must-not-appear' } }
  writeFileSync(join(configRoot, '.qz/project.json'), `${JSON.stringify(fixtureConfig)}\n`)
  const sanitized = execFileSync(qz, ['config', '--json'], { cwd: configRoot, encoding: 'utf8' })
  if (sanitized.includes('must-not-appear') || sanitized.includes('privateAuth')) throw new Error('qz config expuso un campo sensible')
  mkdirSync(join(invalidProject, '.qz'), { recursive: true })
  writeFileSync(join(invalidProject, '.qz/project.json'), JSON.stringify({ schemaVersion: 1, projectId: 'invalid' }))
  const invalidRegistration = spawnSync(node, [resolve(root, 'scripts/projects.mjs'), 'register', invalidProject], {
    cwd: root,
    env: { ...process.env, QZ_KIT_HOME: registryHome },
    encoding: 'utf8'
  })
  if (invalidRegistration.status === 0 || existsSync(join(registryHome, '.config/qz-agent-kit/projects.json'))) throw new Error('se registró un proyecto inválido')
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
  if (apply.missing.length || apply.contentDrift.length || !existsSync(join(installHome, '.local/bin/qz')) || !existsSync(join(installHome, '.local/bin/qz-start-issue'))) {
    throw new Error('instalación smoke incompleta')
  }
  const synchronized = parse(run('scripts/install.mjs', ['--plan', '--home', installHome]))
  if (synchronized.targetDetails.some((target) => target.state !== 'current')) {
    throw new Error('el plan no marcó como current una instalación recién aplicada')
  }
  const updateCheck = parse(execFileSync(resolve(root, 'bin/qz-kit'), ['update', '--check', '--home', installHome], { cwd: root, encoding: 'utf8' }))
  if (updateCheck.mode !== 'check' || updateCheck.mutations !== 'none') {
    throw new Error('qz-kit update --check no fue read-only')
  }
  const shimTarget = join(installHome, '.local/bin/qz-start-issue')
  writeFileSync(shimTarget, `${readFileSync(shimTarget, 'utf8')}\n`)
  const drifted = parse(run('scripts/install.mjs', ['--plan', '--home', installHome]))
  if (!drifted.targetDetails.some((target) => target.target === shimTarget && target.state === 'drift')) {
    throw new Error('el plan no detectó drift en un shim modificado')
  }
  const shimHelp = execFileSync(join(installHome, '.local/bin/qz-start-issue'), ['--help'], {
    cwd: fixture,
    env: { ...process.env, HOME: installHome },
    encoding: 'utf8'
  })
  if (!shimHelp.includes('qz start-issue')) throw new Error('shim qz-start-issue no delegó en qz')
  mkdirSync(join(fallbackRoot, '.qz'), { recursive: true })
  execFileSync('git', ['init', '-q', '-b', 'develop'], { cwd: fallbackRoot })
  execFileSync('git', ['config', 'user.email', 'qz-test@example.invalid'], { cwd: fallbackRoot })
  execFileSync('git', ['config', 'user.name', 'qz-test'], { cwd: fallbackRoot })
  writeFileSync(join(fallbackRoot, 'README.md'), 'fixture\n')
  writeFileSync(join(fallbackRoot, '.qz/project.json'), JSON.stringify({
    schemaVersion: 1,
    projectId: 'generic-smoke',
    adapter: 'qz',
    issues: { provider: 'none', teamKey: 'GEN' },
    branches: { base: 'develop', protected: ['main'], pattern: '{type}/{slug}' },
    worktree: { pathPattern: '../generic-smoke-{slug}', envSource: { kind: 'none' } },
    database: { strategy: 'none' },
    servers: [{ id: 'app', defaultPort: 3000 }],
    commands: { genericPrefix: 'qz-', projectPrefix: 'gen-' }
  }) + '\n')
  execFileSync('git', ['add', '.'], { cwd: fallbackRoot })
  execFileSync('git', ['commit', '-q', '-m', 'fixture'], { cwd: fallbackRoot })
  execFileSync(qz, ['start-issue', 'GEN-7', 'fix'], {
    cwd: fallbackRoot,
    env: { ...process.env, HOME: installHome },
    encoding: 'utf8'
  })
  const fallbackWorktree = resolve(fallbackRoot, '../generic-smoke-gen-7')
  if (!existsSync(join(fallbackWorktree, '.git'))) throw new Error('fallback no creó el worktree')
  const closeOutput = execFileSync(qz, ['close-issue', 'GEN-7'], {
    cwd: fallbackWorktree,
    env: { ...process.env, HOME: installHome },
    encoding: 'utf8'
  })
  if (!closeOutput.includes('\"linearClosed\": false')) throw new Error('fallback close-issue no declaró el límite de Linear')
  const rollbackManifest = apply.rollbackManifest
  parse(run('scripts/rollback.mjs', [rollbackManifest]))
  if (existsSync(join(installHome, '.local/bin/qz'))) throw new Error('rollback no eliminó qz creado por la prueba')
} finally {
  rmSync(renderRoot, { recursive: true, force: true })
  rmSync(installHome, { recursive: true, force: true })
  rmSync(configRoot, { recursive: true, force: true })
  rmSync(invalidProject, { recursive: true, force: true })
  rmSync(registryHome, { recursive: true, force: true })
  rmSync(fallbackRoot, { recursive: true, force: true })
  rmSync(resolve(fallbackRoot, '../generic-smoke-gen-7'), { recursive: true, force: true })
}
console.log(JSON.stringify({ smoke: 'ok', clients: 4, mutations: 'temporary-only', secretValues: 'not-read' }, null, 2))
