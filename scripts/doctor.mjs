#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const run = (script, args = []) => spawnSync(process.execPath, [resolve(root, script), ...args], { cwd: root, encoding: 'utf8' })
const parse = (result) => {
  try { return JSON.parse(result.stdout) } catch { return { valid: false, output: result.stdout?.trim() || result.stderr?.trim() || null } }
}
const install = run('scripts/install.mjs', ['--check', ...process.argv.slice(2)])
const projects = run('scripts/projects.mjs', ['inspect'])
const packageGuard = run('scripts/check-package.mjs')
const result = {
  kitVersion: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version,
  install: { status: install.status, result: parse(install) },
  projects: { status: projects.status, result: parse(projects) },
  package: { status: packageGuard.status, result: parse(packageGuard) },
  valid: install.status === 0 && projects.status === 0 && packageGuard.status === 0,
  mutations: 'none',
  secretValues: 'not-read'
}
console.log(JSON.stringify(result, null, 2))
process.exit(result.valid ? 0 : 1)
