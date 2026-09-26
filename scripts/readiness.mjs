#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const runJson = (script, scriptArgs) => {
  const result = spawnSync(process.execPath, [resolve(root, script), ...scriptArgs], { encoding: 'utf8' })
  let parsed = null
  try { parsed = JSON.parse(result.stdout) } catch {}
  return { status: result.status, result: parsed, output: parsed ? null : `${result.stdout || ''}${result.stderr || ''}`.trim().slice(0, 1000) }
}
const project = resolve(value('--project') || process.cwd())
const plan = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
const ecosystem = runJson('scripts/ecosystem.mjs', [])
const backup = runJson('scripts/backup-plan.mjs', ['--project', project])
const preflight = existsSync(plan) ? runJson('scripts/preflight.mjs', ['--from', plan]) : { status: null, result: null, skipped: 'plan-not-found' }
console.log(JSON.stringify({ schemaVersion: 1, project, plan, ecosystem, backup, preflight, mutations: 'none', secretValues: 'not-read' }, null, 2))
