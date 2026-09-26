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
  if (manifest.schemaVersion !== 1) errors.push(`${path}: schemaVersion must be 1`)
  if (typeof manifest.id !== 'string' || !manifest.id) errors.push(`${path}: id must be a non-empty string`)
  if (typeof manifest.displayName !== 'string' || !manifest.displayName) errors.push(`${path}: displayName must be a non-empty string`)
  if (typeof manifest.detection?.command !== 'string' || !manifest.detection.command) errors.push(`${path}: detection.command must be a non-empty string`)
  if (!Array.isArray(manifest.detection?.versionArgs) || manifest.detection.versionArgs.some((arg) => typeof arg !== 'string' || !arg)) errors.push(`${path}: detection.versionArgs must be a string list`)
  const lifecycle = manifest.lifecycle || {}
  if (lifecycle.requiresHumanApproval !== true) errors.push(`${path}: lifecycle.requiresHumanApproval must be true`)
  for (const field of ['preview', 'readOnly', 'dataExport', 'mutating']) {
    if (lifecycle[field] !== undefined && (!Array.isArray(lifecycle[field]) || lifecycle[field].some((command) => typeof command !== 'string' || !command))) errors.push(`${path}: lifecycle.${field} must be a string list`)
  }
  const readOnly = new Set([...(lifecycle.readOnly || []), ...(lifecycle.preview || [])])
  for (const command of lifecycle.mutating || []) if (readOnly.has(command)) errors.push(`${path}: command classified as both read-only/preview and mutating: ${command}`)
  if (!manifest.installPlan || typeof manifest.installPlan.command !== 'string' || !manifest.installPlan.command) errors.push(`${path}: installPlan.command must be declared`)
  if (manifest.installPlan && typeof manifest.installPlan.preview !== 'string') errors.push(`${path}: installPlan.preview must be declared`)
}
if (errors.length) throw new Error(errors.join('\n'))
console.log(JSON.stringify({ adapters: manifests.sort(), valid: true, mutations: 'none', secretValues: 'not-read' }, null, 2))
