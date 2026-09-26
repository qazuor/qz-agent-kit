#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const errors = []
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const read = (relative) => {
  const path = resolve(root, relative)
  if (!existsSync(path)) { errors.push(`missing:${relative}`); return null }
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch (error) { errors.push(`invalid:${relative}:${error.message}`); return null }
}
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name)
  return entry.isDirectory() ? walk(path) : [path]
})
const commandManifest = read('manifests/qz-command-manifest.json')
if (commandManifest) {
  const expected = readdirSync(resolve(root, 'source/commands')).filter((name) => name.startsWith('qz-') && name.endsWith('.md')).map((name) => `source/commands/${name}`)
  const listed = new Set((commandManifest.commands || []).map((entry) => entry.source))
  for (const path of expected) if (!listed.has(path)) errors.push(`command-unlisted:${path}`)
  for (const entry of commandManifest.commands || []) {
    const path = resolve(root, entry.source)
    if (!existsSync(path)) errors.push(`command-missing:${entry.source}`)
    else if (hash(path) !== entry.sha256) errors.push(`command-drift:${entry.source}`)
  }
}
const contentManifest = read('manifests/qz-content-manifest.json')
if (contentManifest) {
  const listed = new Set()
  for (const entry of contentManifest.content || []) {
    listed.add(entry.path)
    const path = resolve(root, entry.path)
    if (!existsSync(path)) errors.push(`content-missing:${entry.path}`)
    else if (hash(path) !== entry.sha256) errors.push(`content-drift:${entry.path}`)
  }
  for (const directory of ['agents', 'commands', 'guards', 'instructions', 'policies', 'prompts', 'skills']) {
    const source = resolve(root, 'source', directory)
    if (!existsSync(source)) continue
    for (const path of walk(source).map((file) => relative(root, file))) if (!listed.has(path)) errors.push(`content-unlisted:${path}`)
  }
}
console.log(JSON.stringify({ valid: errors.length === 0, errors, mutations: 'none', secretValues: 'not-read' }, null, 2))
process.exit(errors.length ? 1 : 0)
