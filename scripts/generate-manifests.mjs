#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const directory = resolve(root, 'source/commands')
const contentDirectories = ['agents', 'commands', 'guards', 'instructions', 'policies', 'prompts', 'skills']
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

const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name)
  return entry.isDirectory() ? walk(path) : [path]
})
const content = contentDirectories.filter((name) => existsSync(resolve(root, 'source', name))).flatMap((name) => walk(resolve(root, 'source', name)))
  .map((path) => ({
    path: relative(root, path),
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex')
  }))
  .sort((a, b) => a.path.localeCompare(b.path))
const contentManifest = {
  schemaVersion: 1,
  manifestId: 'qz-content-pack',
  sourceOfTruth: 'source',
  generatedAt: new Date().toISOString(),
  content
}
writeFileSync(resolve(root, 'manifests/qz-content-manifest.json'), `${JSON.stringify(contentManifest, null, 2)}\n`)
console.log(JSON.stringify({ manifest: manifest.manifestId, commands: commands.length, content: content.length, mutations: ['manifests/qz-command-manifest.json', 'manifests/qz-content-manifest.json'] }, null, 2))
