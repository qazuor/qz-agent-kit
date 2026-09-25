#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve, relative } from 'node:path'

const argument = process.argv[2]
if (!argument || argument === '--help') {
  console.error('Uso: node scripts/rollback.mjs <ruta-a-install-manifest.json>')
  process.exit(argument === '--help' ? 0 : 2)
}

const manifestPath = resolve(argument)
if (!existsSync(manifestPath)) throw new Error(`no existe el manifest: ${manifestPath}`)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
if (manifest.secrets !== 'values-not-read' || !Array.isArray(manifest.targets) || !Array.isArray(manifest.backups)) {
  throw new Error('manifest inválido o no generado por qz-agent-kit')
}
const backupRoot = resolve(manifest.rollback || dirname(manifestPath))
const backed = new Map(manifest.backups.map((entry) => [resolve(entry.target), resolve(entry.backup)]))
const restored = []
const removed = []
for (const entry of manifest.targets) {
  if (!entry || typeof entry.target !== 'string' || !isAbsolute(entry.target)) throw new Error('target inválido en manifest')
  const target = resolve(entry.target)
  const backup = backed.get(target)
  if (backup) {
    const outside = relative(backupRoot, backup).startsWith('..')
    if (outside || !existsSync(backup)) throw new Error(`backup fuera de alcance o inexistente: ${backup}`)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(backup, target)
    restored.push(target)
  } else if (existsSync(target)) {
    rmSync(target, { force: true })
    removed.push(target)
  }
}
console.log(JSON.stringify({ manifest: manifestPath, restored, removed, mutations: [...restored, ...removed], secretValues: 'not-read' }, null, 2))
