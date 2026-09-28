#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const component = value('--component') || 'gentle-ai'
const home = resolve(value('--home') || homedir())
if (component !== 'gentle-ai') throw new Error(`backup status no implementado para ${component}; Engram requiere procedimiento separado`)
const root = join(home, '.gentle-ai')
const statePath = join(root, 'state.json')
const backupRoot = join(root, 'backups')
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : null
const snapshots = []
if (existsSync(backupRoot)) {
  for (const id of readdirSync(backupRoot).sort()) {
    const dir = join(backupRoot, id)
    if (!statSync(dir).isDirectory()) continue
    const manifestPath = join(dir, 'manifest.json')
    if (!existsSync(manifestPath)) continue
    let manifest
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch { continue }
    const archive = join(dir, 'snapshot.tar.gz')
    snapshots.push({
      id: manifest.id || id,
      createdAt: manifest.created_at || null,
      createdByVersion: manifest.created_by_version || null,
      fileCount: manifest.file_count ?? (Array.isArray(manifest.entries) ? manifest.entries.length : null),
      compressed: manifest.compressed === true || existsSync(archive),
      snapshotBytes: existsSync(archive) ? statSync(archive).size : null,
      checksumPresent: typeof manifest.checksum === 'string' && manifest.checksum.length > 0
    })
  }
}
const latest = snapshots.at(-1) || null
console.log(JSON.stringify({
  schemaVersion: 1,
  component,
  home,
  state: { present: Boolean(state), installedAgents: Array.isArray(state?.installed_agents) ? state.installed_agents : [], installedBinaryVersion: state?.installed_binary_version || null, componentsCount: Array.isArray(state?.components) ? state.components.length : null },
  snapshots: { count: snapshots.length, latest, all: snapshots },
  restore: latest ? { command: 'gentle-ai restore latest', available: true } : { command: null, available: false },
  mutations: 'none',
  secretValues: 'not-read'
}, null, 2))
