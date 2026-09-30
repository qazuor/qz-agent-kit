#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const component = value('--component') || 'engram'
const approval = value('--approve')
const home = resolve(value('--home') || homedir())
const project = value('--project')
const output = resolve(value('--output') || join(home, '.local/state/qz-agent-kit/external-backups/engram', new Date().toISOString().replaceAll(':', '-')))
const fail = (message) => { console.error(`external-backup bloqueado: ${message}`); process.exit(2) }

if (component !== 'engram') fail('por ahora sólo se implementa el backup explícito de Engram')
if (approval !== 'ENGRAM_BACKUP') fail('falta --approve ENGRAM_BACKUP')
if (!project) fail('falta --project <nombre> para comprobar el lock de SQLite')
const sourceRoot = join(home, '.engram')
const sourceDb = join(sourceRoot, 'engram.db')
if (!existsSync(sourceDb)) fail(`no existe la DB de Engram: ${sourceDb}`)
if (!lstatSync(sourceDb).isFile()) fail('la DB de Engram no es un archivo regular')

const diagnostic = spawnSync('engram', ['doctor', '--json', '--check', 'sqlite_lock_contention', '--project', project], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] })
if (diagnostic.error?.code === 'ETIMEDOUT') fail('doctor de Engram excedió 30 segundos; no se creó el backup')
if (diagnostic.error) fail(`no se pudo ejecutar doctor: ${diagnostic.error.message}`)
if (diagnostic.status !== 0) fail(`doctor de Engram reportó estado ${diagnostic.status}; corregir el lock antes del backup`)

mkdirSync(output, { recursive: true, mode: 0o700 })
const backupDb = join(output, 'engram.db')
const sqlite = spawnSync('sqlite3', ['-cmd', '.timeout 10000', sourceDb, `.backup '${backupDb.replaceAll("'", "''")}'`], { encoding: 'utf8', timeout: 120000 })
if (sqlite.error || sqlite.status !== 0 || !existsSync(backupDb)) fail(`SQLite online backup falló: ${sqlite.stderr || sqlite.error?.message || sqlite.status}`)
const integrity = spawnSync('sqlite3', [backupDb, 'PRAGMA integrity_check;'], { encoding: 'utf8', timeout: 30000 })
if (integrity.error || integrity.status !== 0 || integrity.stdout.trim() !== 'ok') fail(`integrity_check del backup no fue ok: ${integrity.stdout || integrity.stderr || integrity.error?.message}`)

const copiedConfig = []
for (const name of ['protocol-mode.json']) {
  const source = join(sourceRoot, name)
  if (!existsSync(source) || !lstatSync(source).isFile()) continue
  const target = join(output, name)
  copyFileSync(source, target, 0o600)
  copiedConfig.push({ name, sha256: createHash('sha256').update(readFileSync(target)).digest('hex') })
}
const hash = createHash('sha256').update(readFileSync(backupDb)).digest('hex')
const manifest = {
  schemaVersion: 1,
  type: 'qz-engram-backup',
  createdAt: new Date().toISOString(),
  home,
  project,
  source: { database: sourceDb, dbMode: 'sqlite-online-backup', walNotCopied: true },
  backup: { database: 'engram.db', sha256: hash, integrity: 'ok', bytes: readFileSync(backupDb).byteLength, config: copiedConfig },
  diagnostic: { status: 'ok', check: 'sqlite_lock_contention', output: 'not-included' },
  mutations: [output, backupDb, join(output, 'manifest.json')],
  secretValues: 'not-read'
}
writeFileSync(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })
console.log(JSON.stringify(manifest, null, 2))
