#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const component = value('--component') || 'gentle-ai'
const home = resolve(value('--home') || homedir())
if (component === 'engram') {
  const root = join(home, '.engram')
  const totals = { files: 0, bytes: 0, databaseLike: 0, wal: 0, shm: 0 }
  const walk = (directory) => {
    if (!existsSync(directory)) return
    for (const name of readdirSync(directory)) {
      const path = join(directory, name)
      let stat
      try { stat = statSync(path) } catch { continue }
      if (stat.isDirectory()) walk(path)
      else {
        totals.files += 1
        totals.bytes += stat.size
        if (/\.(db|sqlite|sqlite3)$/i.test(name)) totals.databaseLike += 1
        if (/(?:\.|-)wal$/i.test(name)) totals.wal += 1
        if (/(?:\.|-)shm$/i.test(name)) totals.shm += 1
      }
    }
  }
  walk(root)
  const project = value('--project')
  let diagnostic = { requested: false, status: 'not-requested' }
  if (project) {
    const probe = spawnSync('engram', ['doctor', '--json', '--check', 'sqlite_lock_contention', '--project', project], { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'pipe'] })
    diagnostic = { requested: true, project, status: probe.error?.code === 'ETIMEDOUT' ? 'timeout' : probe.error ? 'unavailable' : probe.status === 0 ? 'ok-or-warning' : 'error', output: 'not-included' }
  }
  console.log(JSON.stringify({ schemaVersion: 1, component, home, dataDir: { present: existsSync(root), ...totals }, backup: { required: true, strategy: 'consistent-sqlite-triplet-local-filesystem', logicalSecondCopy: 'engram export (explicit only)', installerCopies: false }, diagnostic, mutations: 'none', secretValues: 'not-read' }, null, 2))
  process.exit(0)
}
if (component !== 'gentle-ai') throw new Error(`backup status no implementado para ${component}`)
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
