#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const errors = []
const manifests = []
for (const adapter of readdirSync(join(root, 'adapters'))) {
  const path = join(root, 'adapters', adapter, 'manifest.json')
  if (!existsSync(path)) continue
  let manifest
  try { manifest = JSON.parse(readFileSync(path, 'utf8')) } catch (error) { errors.push(`${path}: invalid JSON (${error.message})`); continue }
  manifests.push(manifest.id)
  for (const field of ['schemaVersion', 'id', 'displayName', 'detection', 'lifecycle', 'secrets']) if (manifest[field] === undefined) errors.push(`${path}: missing ${field}`)
  const lifecycle = manifest.lifecycle || {}
  if (lifecycle.requiresHumanApproval !== true) errors.push(`${path}: lifecycle.requiresHumanApproval must be true`)
  const readOnly = new Set([...(lifecycle.readOnly || []), ...(lifecycle.preview || [])])
  for (const command of lifecycle.mutating || []) if (readOnly.has(command)) errors.push(`${path}: command classified as both read-only/preview and mutating: ${command}`)
}
if (errors.length) throw new Error(errors.join('\n'))
console.log(JSON.stringify({ adapters: manifests.sort(), valid: true, mutations: 'none', secretValues: 'not-read' }, null, 2))
