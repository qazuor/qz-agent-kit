#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const commands = [
  ['smoke', process.execPath, ['scripts/smoke.mjs']],
  ['project', process.execPath, ['scripts/validate-project.mjs', 'fixtures/generic-project']],
  ['adapters', process.execPath, ['scripts/validate-adapters.mjs']],
  ['manifests', process.execPath, ['scripts/check-manifests.mjs']],
  ['package', process.execPath, ['scripts/check-package.mjs']]
]
const checks = commands.map(([id, command, args]) => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' })
  return { id, status: result.status, ok: result.status === 0, output: result.status === 0 ? null : `${result.stdout || ''}${result.stderr || ''}`.trim().slice(0, 1200) }
})
const git = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
const clean = git.status === 0 && git.stdout.trim() === ''
const versionValid = typeof packageJson.version === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)
const result = { schemaVersion: 1, package: packageJson.name, version: packageJson.version, checks, git: { clean, status: clean ? null : (git.stdout || git.stderr || '').trim().slice(0, 1200) }, versionValid, valid: checks.every((check) => check.ok) && clean && versionValid, mutations: 'none', secretValues: 'not-read' }
console.log(JSON.stringify(result, null, 2))
process.exit(result.valid ? 0 : 1)
