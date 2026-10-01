#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'

// Read-only inventory of Claude project memory. This command deliberately does
// not promote, edit, delete, or print memory bodies.

const args = process.argv.slice(2)
const help = () => console.log(`qz memory — inventario seguro de memoria Claude

Uso:
  qz-kit memory scan [--root <dir>] [--json]
  qz-kit memory plan [--root <dir>] [--json]

El escaneo sólo lee archivos Markdown, calcula fingerprints y clasifica
candidatos. No modifica ni elimina memorias, no muestra cuerpos ni valores de
secretos y no ejecuta comandos externos.`)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  help()
  process.exit(0)
}

const mode = args[0]
if (!['scan', 'plan'].includes(mode)) {
  console.error('qz memory: sólo están disponibles los comandos read-only `scan` y `plan`')
  process.exit(2)
}

const valueAfter = (flag) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}
const root = resolve(valueAfter('--root') || join(homedir(), '.claude/projects/-home-qazuor-projects-WEBS-hospeda/memory'))
const json = args.includes('--json')

const classify = (file, content) => {
  const name = basename(file).toLowerCase()
  const sample = content.slice(0, 12000)
  const sensitiveName = /(?:credential|password|private[-_]?key|cookie|token)/i.test(name)
  // References to a secret variable are safe; concrete secret-shaped values
  // are blocked. The scanner never prints matching text.
  const secretValue = /-----BEGIN [^-]{2,40}PRIVATE KEY-----|\b(?:sk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{16,}|\bAKIA[0-9A-Z]{16}\b|\bBearer\s+[A-Za-z0-9._~-]{20,}|\b(?:api[_-]?key|access[_-]?token|password|passwd|secret|authorization)\s*[:=]\s*["']?[A-Za-z0-9_./+=~-]{16,}/i.test(sample)
  const sensitive = sensitiveName || secretValue
  if (sensitive) return { classification: 'sensitive-review', destination: 'manual-review', confidence: 0.99, sensitive: true }
  if (/^feedback[_-]/.test(name)) return { classification: 'feedback', destination: 'guard|skill|agents|discard', confidence: 0.86, sensitive: false }
  if (/^gotcha[_-]/.test(name) || name.includes('gotcha')) return { classification: 'gotcha', destination: 'guard|skill|command|discard', confidence: 0.9, sensitive: false }
  if (/^(spec|hos)[-_]/.test(name) || name.includes('spec')) return { classification: 'work-item', destination: 'linear|specs|adr|discard', confidence: 0.9, sensitive: false }
  if (/dependabot|linear|backlog|closeissue|close-issue/.test(name)) return { classification: 'workflow-state', destination: 'command|linear|skill|discard', confidence: 0.84, sensitive: false }
  if (/local-dev|env-|worktree|wt-|setup|bootstrap/.test(name)) return { classification: 'procedure', destination: 'command|skill|guard|docs', confidence: 0.88, sensitive: false }
  if (/project|tooling|architecture|design|parity/.test(name)) return { classification: 'architecture', destination: 'adr|skill|docs|engram', confidence: 0.8, sensitive: false }
  return { classification: 'context', destination: 'engram|skill|manual-review', confidence: 0.55, sensitive: false }
}

const sanitizeHeading = (line) => line.replace(/^\s*#+\s*/, '').replace(/[`*_]/g, '').trim().slice(0, 160)
const files = existsSync(root)
  ? readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => join(root, entry.name)).sort()
  : []
const seenHashes = new Map()
const candidates = files.map((file) => {
  const content = readFileSync(file, 'utf8')
  const fingerprint = createHash('sha256').update(content).digest('hex')
  const duplicateOf = seenHashes.get(fingerprint) || null
  if (!duplicateOf) seenHashes.set(fingerprint, basename(file))
  const stat = statSync(file)
  const headings = content.split(/\r?\n/).filter((line) => /^\s*#{1,3}\s+/.test(line)).slice(0, 8).map(sanitizeHeading)
  const decision = classify(file, content)
  return {
    id: `claude-memory:${fingerprint.slice(0, 12)}`,
    file: basename(file),
    bytes: stat.size,
    lines: content.split(/\r?\n/).length,
    modifiedAt: stat.mtime.toISOString(),
    fingerprint,
    duplicateOf,
    headings,
    ...decision,
    source: 'claude-memory',
    status: decision.sensitive ? 'blocked' : duplicateOf ? 'duplicate-review' : 'pending-review'
  }
})

const counts = candidates.reduce((acc, candidate) => {
  acc.total += 1
  acc[candidate.classification] = (acc[candidate.classification] || 0) + 1
  if (candidate.duplicateOf) acc.duplicates += 1
  if (candidate.sensitive) acc.sensitive += 1
  return acc
}, { total: 0, duplicates: 0, sensitive: 0 })

const result = {
  schemaVersion: 1,
  command: 'qz memory scan',
  root,
  exists: existsSync(root),
  readOnly: true,
  mutations: 'none',
  secretValues: 'not-read-or-printed',
  counts,
  candidates
}

if (mode === 'plan') {
  result.command = 'qz memory plan'
  result.actions = candidates.map((candidate) => ({
    id: candidate.id,
    file: candidate.file,
    classification: candidate.classification,
    status: candidate.status,
    destination: candidate.destination,
    action: candidate.sensitive
      ? 'manual-review-required'
      : candidate.duplicateOf
        ? 'review-duplicate-before-removal'
        : candidate.classification === 'feedback'
          ? 'review-and-promote-to-guard-skill-agent-or-discard'
          : candidate.classification === 'gotcha'
            ? 'review-and-promote-to-guard-command-skill-or-discard'
            : candidate.classification === 'procedure'
              ? 'review-and-promote-to-command-skill-guard-or-docs'
              : candidate.classification === 'work-item' || candidate.classification === 'workflow-state'
                ? 'move-to-linear-specs-or-command'
                : candidate.classification === 'architecture'
                  ? 'review-and-promote-to-adr-skill-docs-or-engram'
                  : 'review-for-engram-skill-or-discard',
    removeSource: candidate.sensitive || candidate.duplicateOf ? false : 'after-promotion-validation',
    mutations: 'none'
  }))
}

if (json) {
  console.log(JSON.stringify(result, null, 2))
} else {
  console.log(`qz memory scan · read-only\n  raíz: ${root}\n  archivos: ${counts.total}\n  duplicados: ${counts.duplicates}\n  sensibles bloqueados: ${counts.sensitive}`)
  for (const candidate of candidates) {
    const marker = candidate.sensitive ? 'BLOQUEADO' : candidate.duplicateOf ? 'DUPLICADO' : 'PENDIENTE'
    console.log(`  ${marker.padEnd(10)} ${candidate.file} · ${candidate.classification} · destino sugerido: ${candidate.destination}`)
  }
  console.log('\nNo se promovió, editó ni eliminó ninguna memoria.')
}
