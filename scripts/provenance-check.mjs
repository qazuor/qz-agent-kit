#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const index = args.indexOf('--manifest')
const manifestPath = index >= 0 ? resolve(args[index + 1]) : null
if (!manifestPath || !existsSync(manifestPath)) throw new Error('uso: qz-kit provenance --manifest <install-manifest.json>')
const installed = JSON.parse(readFileSync(manifestPath, 'utf8'))
const currentHash = createHash('sha256').update(readFileSync(resolve(root, 'package.json'))).digest('hex')
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
const currentCommit = revision.status === 0 ? revision.stdout.trim() : null
const checks = [
  { id: 'package-hash', expected: installed.sourcePackageHash || null, actual: currentHash, status: installed.sourcePackageHash === currentHash ? 'same' : 'different' },
  { id: 'source-commit', expected: installed.sourceCommit || null, actual: currentCommit, status: installed.sourceCommit && currentCommit && installed.sourceCommit === currentCommit ? 'same' : 'different-or-unavailable' }
]
console.log(JSON.stringify({ schemaVersion: 1, manifest: manifestPath, installed: { kitVersion: installed.kitVersion, installedAt: installed.installedAt }, checks, updateReview: checks.some((check) => check.status !== 'same') ? 'required' : 'not-required', mutations: 'none', secretValues: 'not-read' }, null, 2))
