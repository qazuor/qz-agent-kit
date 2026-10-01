#!/usr/bin/env node
/** Create a verified backup of CLI-managed files without copying secret material. */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined }
if (!flag('--apply')) throw new Error('backup-clients requiere --apply para crear la copia')
const home = resolve(value('--home') || homedir())
const output = resolve(value('--output') || join(home, '.local/state/qz-agent-kit/pre-clean-backups', new Date().toISOString().replaceAll(':', '-')))
const sources = [
  ['opencode', join(home, '.config/opencode')],
  ['claude', join(home, '.claude')],
  ['codex', join(home, '.codex')],
  ['gentle-shell', join(home, '.gentle-shell')],
  ['engram', join(home, '.engram')],
  ['qz-kit-config', join(home, '.config/qz-agent-kit')],
  ['qz-kit-state', join(home, '.local/state/qz-agent-kit')]
]
const secretLike = /(^|[/._-])(\.env(?:\.|$)|auth(?:\.json)?$|credential|token|secret|password|cookie|private[-_]?key)([/._-]|$)/i
const excludedNonConfig = /[/](?:backups|clean-backups|pre-clean-backups|instruction-backups|external-receipts|projects|file-history|debug|telemetry|cache|paste-cache|session-env|security|sessions|packages|\.tmp|node_modules|npm)(?:[/]|$)/
const isSafeFile = (path) => !secretLike.test(path)
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const files = []
const skipped = []
const walk = (source, destination) => {
  if (!existsSync(source)) return
  if (source === output || source.startsWith(output + '/')) { skipped.push({ path: source, reason: 'backup-output' }); return }
  if (excludedNonConfig.test(source)) { skipped.push({ path: source, reason: 'non-config-history-or-cache' }); return }
  const stat = lstatSync(source)
  if (stat.isSymbolicLink()) { skipped.push({ path: source, reason: 'symlink' }); return }
  if (stat.isDirectory()) {
    for (const entry of readdirSync(source)) walk(join(source, entry), join(destination, entry))
    return
  }
  if (!stat.isFile()) { skipped.push({ path: source, reason: 'non-regular-file' }); return }
  if (!isSafeFile(source)) { skipped.push({ path: source, reason: 'secret-like-path' }); return }
  mkdirSync(resolve(destination, '..'), { recursive: true, mode: 0o700 })
  copyFileSync(source, destination)
  const verified = existsSync(destination) && sha256(source) === sha256(destination)
  if (!verified) throw new Error(`checksum de backup no coincide: ${source}`)
  files.push({ source, backup: destination, bytes: stat.size, sha256: sha256(destination) })
}
mkdirSync(output, { recursive: true, mode: 0o700 })
for (const [label, source] of sources) walk(source, join(output, label))
const manifest = {
  schemaVersion: 1,
  type: 'qz-cli-clean-backup',
  createdAt: new Date().toISOString(),
  home,
  output,
  sources: sources.map(([label, path]) => ({ label, path, exists: existsSync(path) })),
  files,
  skipped,
  verification: { files: files.length, checksums: 'verified', secretLikePaths: 'not-copied' },
  mutations: [output],
  secretValues: 'not-read'
}
const manifestPath = join(output, 'backup-manifest.json')
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })
console.log(JSON.stringify({ type: manifest.type, output, manifest: manifestPath, files: files.length, skipped: skipped.length, checksums: 'verified', secretValues: 'not-read' }, null, 2))
