#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
const invalidUpdateHome = mkdtempSync(join(tmpdir(), 'qz-invalid-update-home-'))
const invalidProject = mkdtempSync(join(tmpdir(), 'qz-invalid-project-'))
const registryHome = mkdtempSync(join(tmpdir(), 'qz-registry-'))
const fallbackRoot = mkdtempSync(join(tmpdir(), 'qz-fallback-'))
const externalPlan = join(configRoot, 'install-plan.json')
try {
  parse(run('scripts/validate-adapters.mjs', []))
  const readiness = parse(execFileSync(node, [resolve(root, 'scripts/readiness.mjs'), '--project', fixture, '--from', join(configRoot, 'missing-plan.json')], { cwd: root, encoding: 'utf8' }))
  if (readiness.mutations !== 'none' || readiness.summary.ready || !readiness.ecosystem.result?.components || !readiness.backup.result?.entries || readiness.preflight.skipped !== 'plan-not-found') throw new Error('readiness incompleto')
  const readinessStrict = spawnSync(node, [resolve(root, 'scripts/readiness.mjs'), '--strict', '--project', fixture, '--from', join(configRoot, 'missing-plan.json')], { cwd: root, encoding: 'utf8' })
  if (readinessStrict.status === 0 || !JSON.parse(readinessStrict.stdout).summary || !readinessStrict.stdout.includes('"ready": false')) throw new Error('readiness --strict no bloqueó un entorno incompleto')
  writeFileSync(externalPlan, `${JSON.stringify({ schemaVersion: 1, clients: ['opencode'], components: ['gentle-ai', 'engram'], providers: [] })}\n`)
  const readyWithPlan = parse(execFileSync(node, [resolve(root, 'scripts/readiness.mjs'), '--project', fixture, '--from', externalPlan], { cwd: root, encoding: 'utf8' }))
  if (!readyWithPlan.summary.ready || readyWithPlan.summary.preflight !== 'ok') throw new Error('readiness no confirmó un plan válido')
  const strictPlan = join(configRoot, 'strict-install-plan.json')
  writeFileSync(strictPlan, `${JSON.stringify({ schemaVersion: 1, clients: ['opencode'], components: [], providers: [] })}\n`)
  const readyStrict = parse(execFileSync(node, [resolve(root, 'scripts/readiness.mjs'), '--strict', '--project', fixture, '--from', strictPlan], { cwd: root, encoding: 'utf8' }))
  if (!readyStrict.summary.ready) throw new Error('readiness --strict rechazó un plan válido')
  const external = parse(execFileSync(node, [resolve(root, 'scripts/external-plan.mjs'), '--from', externalPlan], { cwd: root, encoding: 'utf8' }))
  if (external.mutations !== 'none' || external.actions.length !== 2 || external.actions.some((action) => action.requiresApproval !== true)) throw new Error('external-plan no aplicó contratos de aprobación')
  const optionalPlan = join(configRoot, 'optional-install-plan.json')
  writeFileSync(optionalPlan, `${JSON.stringify({ schemaVersion: 1, clients: ['opencode'], components: ['context7', 'rdd-review', 'background-agents'], providers: [] })}\n`)
  const optionalExternal = parse(execFileSync(node, [resolve(root, 'scripts/external-plan.mjs'), '--from', optionalPlan], { cwd: root, encoding: 'utf8' }))
  if (optionalExternal.actions.length !== 3 || optionalExternal.actions.some((action) => action.status !== 'pending-adapter')) throw new Error('adapters opcionales no quedaron declarados como pending-adapter')
  const externalStrict = spawnSync(node, [resolve(root, 'scripts/external-plan.mjs'), '--strict', '--from', externalPlan], { cwd: root, encoding: 'utf8' })
  if (externalStrict.status === 0 || JSON.parse(externalStrict.stdout).summary.ready || !externalStrict.stdout.includes('"strict": true')) throw new Error('external-plan --strict no bloqueó acciones pendientes')
  const invalidPlan = join(configRoot, 'invalid-install-plan.json')
  writeFileSync(invalidPlan, `${JSON.stringify({ schemaVersion: 99, clients: ['unknown-client'], components: 'not-a-list', providers: [] })}\n`)
  const incompletePlan = join(configRoot, 'incomplete-install-plan.json')
  writeFileSync(incompletePlan, `${JSON.stringify({ schemaVersion: 1 })}\n`)
  mkdirSync(join(invalidUpdateHome, '.config/qz-agent-kit'), { recursive: true })
  cpSync(invalidPlan, join(invalidUpdateHome, '.config/qz-agent-kit/install-plan.json'))
  const invalidPreflight = spawnSync(node, [resolve(root, 'scripts/preflight.mjs'), '--from', invalidPlan], { cwd: root, encoding: 'utf8' })
  const invalidExternal = spawnSync(node, [resolve(root, 'scripts/external-plan.mjs'), '--from', invalidPlan], { cwd: root, encoding: 'utf8' })
  const incompleteExternal = spawnSync(node, [resolve(root, 'scripts/external-plan.mjs'), '--from', incompletePlan], { cwd: root, encoding: 'utf8' })
  const invalidUpdate = spawnSync(node, [resolve(root, 'bin/qz-kit'), 'update', '--check', '--home', invalidUpdateHome], { cwd: root, encoding: 'utf8' })
  if (invalidPreflight.status === 0 || !`${invalidPreflight.stderr}${invalidPreflight.stdout}`.includes('install-plan inválido') || invalidExternal.status === 0 || !`${invalidExternal.stderr}${invalidExternal.stdout}`.includes('install-plan inválido') || incompleteExternal.status === 0 || !`${incompleteExternal.stderr}${incompleteExternal.stdout}`.includes('install-plan inválido') || invalidUpdate.status === 0 || !`${invalidUpdate.stderr}${invalidUpdate.stdout}`.includes('install-plan inválido')) {
    throw new Error('preflight/external-plan aceptaron un install-plan inválido')
  }
  const backupPlan = parse(execFileSync(node, [resolve(root, 'scripts/backup-plan.mjs'), '--project', fixture], { cwd: root, encoding: 'utf8' }))
  if (backupPlan.mutations !== 'none' || backupPlan.projectRoot !== fixture) throw new Error('backup-plan no respetó project root')
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
    const projectOutput = join(renderRoot, `project-${client}`)
    const projectRendered = parse(run('scripts/project-render.mjs', [fixture, '--client', client, '--output', projectOutput]))
    if (projectRendered.resources !== 4) throw new Error(`renderer de proyecto incompleto para ${client}`)
    if (!existsSync(join(projectOutput, 'instructions/AGENTS.md')) || !existsSync(join(projectOutput, 'skills/demo/SKILL.md')) || !existsSync(join(projectOutput, 'agents/demo.md'))) {
      throw new Error(`knowledge layer incompleta para ${client}`)
    }
    const output = join(renderRoot, client)
    parse(run('scripts/render.mjs', ['--client', client, '--output', output]))
    if (!existsSync(join(output, 'qz-agent-kit/instructions/AGENTS.md')) || !existsSync(join(output, 'qz-agent-kit/guards/staged-secrets.sh'))) {
      throw new Error(`recursos centrales incompletos para ${client}`)
    }
    if (!existsSync(join(output, 'skills/qz-commands/SKILL.md')) || !existsSync(join(output, 'skills/qz-agents/SKILL.md'))) {
      throw new Error(`render incompleto para ${client}`)
    }
  }
  const syncProject = mkdtempSync(join(tmpdir(), 'qz-sync-project-'))
  try {
    cpSync(fixture, syncProject, { recursive: true })
    const syncApply = parse(run('scripts/project-sync.mjs', [syncProject, '--apply', '--client', 'all', '--home', installHome]))
    if (syncApply.counts.total !== 16 || !existsSync(join(syncProject, 'AGENTS.md')) || !existsSync(join(syncProject, '.opencode/skills/demo/SKILL.md')) || !existsSync(join(syncProject, '.gentle-shell/agent/prompts/demo-command.md'))) {
      throw new Error('project sync incompleto')
    }
    const syncCheck = spawnSync(node, [resolve(root, 'scripts/project-sync.mjs'), syncProject, '--check', '--client', 'all', '--home', installHome], { cwd: root, encoding: 'utf8' })
    if (syncCheck.status !== 0) throw new Error('project sync check no detectó estado current')
  } finally {
    rmSync(syncProject, { recursive: true, force: true })
  }
  const apply = parse(run('scripts/install.mjs', ['--apply', '--home', installHome]))
  if (apply.missing.length || apply.contentDrift.length || !existsSync(join(installHome, '.local/bin/qz')) || !existsSync(join(installHome, '.local/bin/qz-start-issue'))) {
    throw new Error('instalación smoke incompleta')
  }
  const synchronized = parse(run('scripts/install.mjs', ['--plan', '--home', installHome]))
  if (synchronized.targetDetails.some((target) => target.state !== 'current')) {
    throw new Error('el plan no marcó como current una instalación recién aplicada')
  }
  mkdirSync(join(installHome, '.config/qz-agent-kit'), { recursive: true })
  writeFileSync(join(installHome, '.config/qz-agent-kit/install-plan.json'), `${JSON.stringify({ schemaVersion: 1, clients: ['opencode'], components: [], providers: [] })}\n`)
  const updateCheck = parse(execFileSync(resolve(root, 'bin/qz-kit'), ['update', '--check', '--home', installHome], { cwd: root, encoding: 'utf8' }))
  if (updateCheck.mode !== 'check' || updateCheck.mutations !== 'none' || updateCheck.selected.join(',') !== 'opencode' || updateCheck.selected.includes('gentle-shell')) {
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
  rmSync(invalidUpdateHome, { recursive: true, force: true })
  rmSync(invalidProject, { recursive: true, force: true })
  rmSync(registryHome, { recursive: true, force: true })
  rmSync(fallbackRoot, { recursive: true, force: true })
  rmSync(resolve(fallbackRoot, '../generic-smoke-gen-7'), { recursive: true, force: true })
}
console.log(JSON.stringify({ smoke: 'ok', clients: 4, mutations: 'temporary-only', secretValues: 'not-read' }, null, 2))
