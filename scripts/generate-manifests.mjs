#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const directory = resolve(root, 'source/commands')
const commands = readdirSync(directory)
  .filter((name) => name.startsWith('qz-') && name.endsWith('.md'))
  .sort()
  .map((name) => ({
    id: name.slice(0, -3),
    source: `source/commands/${name}`,
    sha256: createHash('sha256').update(readFileSync(resolve(directory, name))).digest('hex')
  }))

const manifest = {
  schemaVersion: 1,
  manifestId: 'qz-command-pack',
  sourceOfTruth: 'source/commands',
  generatedAt: new Date().toISOString(),
  clients: ['opencode', 'claude', 'codex', 'gentle-shell'],
  commands
}
writeFileSync(resolve(root, 'manifests/qz-command-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ manifest: manifest.manifestId, commands: commands.length, mutations: ['manifests/qz-command-manifest.json'] }, null, 2))
