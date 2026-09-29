#!/usr/bin/env node
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'

const target = resolve(process.env.QZ_CLAUDE_USAGE_FILE || `${process.env.HOME || homedir()}/.local/state/qz-agent-kit/subscriptions/claude-usage.json`)
const write = (value) => {
  mkdirSync(dirname(target), { recursive: true })
  const temporary = `${target}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  renameSync(temporary, target)
}

let raw = ''
try { raw = await new Promise((resolveResult, reject) => { let value = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', (chunk) => { value += chunk }); process.stdin.on('end', () => resolveResult(value)); process.stdin.on('error', reject) }) } catch { process.exit(0) }
let input
try { input = JSON.parse(raw) } catch { process.exit(0) }
const limits = input?.rate_limits || input?.rateLimits
if (!limits || typeof limits !== 'object') process.exit(0)
const pick = (value) => value && typeof value === 'object' ? { utilization: value.utilization, resets_at: value.resets_at } : undefined
const output = { observedAt: new Date().toISOString() }
for (const [key, value] of Object.entries(limits)) {
  const picked = pick(value)
  if (picked && (typeof picked.utilization === 'number' || picked.resets_at)) output[key] = picked
}
if (Object.keys(output).length === 1) process.exit(0)
try { write(output) } catch { /* statusline must never break Claude */ }
