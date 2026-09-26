#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { assertValidPlan } from './plan-schema.mjs'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const strict = args.includes('--strict')
const path = resolve(value('--from') || `${process.env.QZ_KIT_HOME || homedir()}/.config/qz-agent-kit/install-plan.json`)
if (!existsSync(path)) {
  const result = { schemaVersion: 1, exists: false, plan: path, summary: { ready: false, reason: 'plan-not-found' }, mutations: 'none', secretValues: 'not-read' }
  console.log(JSON.stringify(result, null, 2))
  if (strict) process.exit(1)
  process.exit(0)
}
const plan = assertValidPlan(JSON.parse(readFileSync(path, 'utf8')))
console.log(JSON.stringify({
  schemaVersion: 1,
  exists: true,
  plan: path,
  kit: plan.kit || null,
  createdAt: plan.createdAt || null,
  updatedAt: plan.updatedAt || null,
  sourceCommit: plan.sourceCommit || null,
  sourcePackageHash: plan.sourcePackageHash || null,
  home: plan.home || null,
  clients: plan.clients,
  components: plan.components,
  providers: plan.providers,
  summary: { ready: true },
  mutations: 'none',
  secretValues: 'not-read'
}, null, 2))
