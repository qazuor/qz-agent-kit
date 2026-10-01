#!/usr/bin/env node
/** Read-only comparison of the common instruction layer with native CLI paths. */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const args = process.argv.slice(2)
const json = args.includes('--json')
const homeFlag = args.indexOf('--home')
const home = resolve(homeFlag >= 0 ? args[homeFlag + 1] : homedir())
const source = join(root, 'source/instructions/AGENTS.md')
const sourceText = readFileSync(source, 'utf8').trim()
const sourceHash = createHash('sha256').update(sourceText).digest('hex')
const outputStyleSource = join(root, 'source/skills/qz-output-style/SKILL.md')
const outputStyleHash = createHash('sha256').update(readFileSync(outputStyleSource)).digest('hex')
const start = '<!-- qz-agent-kit:instructions:start -->'
const end = '<!-- qz-agent-kit:instructions:end -->'
const expectedBlock = `${start}\n\n## QZ portable instructions\n\n${sourceText}\n\n${end}`
const files = [
  { client: 'opencode', kind: 'global instructions', path: join(home, '.config/opencode/AGENTS.md'), action: 'merge-required' },
  { client: 'codex', kind: 'global instructions', path: join(home, '.codex/AGENTS.md'), action: 'create-or-merge' },
  { client: 'claude', kind: 'native output style', path: join(home, '.claude/output-styles/qz-output-style.md'), action: 'managed-by-kit' },
  { client: 'gentle-shell', kind: 'owned system prompt', path: join(home, '.gentle-shell/agent/APPEND_SYSTEM.md'), action: 'do-not-touch' }
]
const result = files.map((item) => {
  if (!existsSync(item.path)) return { ...item, state: item.action === 'do-not-touch' ? 'gentle-owned-missing' : 'missing', bytes: 0 }
  const bytes = statSync(item.path).size
  const contents = readFileSync(item.path, 'utf8')
  const hash = createHash('sha256').update(contents).digest('hex')
  const expectedHash = item.client === 'claude' ? outputStyleHash : sourceHash
  const managedMarkers = [...contents.matchAll(/<!--\s*([^>]+?)\s*-->/g)].map((match) => match[1].trim()).filter((marker) => /gentle-ai|engram|qz-agent-kit/i.test(marker))
  const hasExactQzBlock = contents.includes(expectedBlock)
  const hasQzBlock = contents.includes(start) || contents.includes(end)
  const state = hash === expectedHash || hasExactQzBlock ? 'current' : item.action === 'do-not-touch' ? 'gentle-owned' : hasQzBlock || managedMarkers.length ? 'managed-blocks-needs-review' : 'existing-needs-merge'
  return { ...item, state, bytes, managedMarkers }
})
const output = { sources: { instructions: 'source/instructions/AGENTS.md', instructionsHash: sourceHash, outputStyle: 'source/skills/qz-output-style/SKILL.md', outputStyleHash }, targets: result, mutations: 'none', secretValues: 'not-read' }
if (json) console.log(JSON.stringify(output, null, 2))
else {
  console.log('qz-kit · plan de instrucciones nativas')
  for (const item of result) console.log(`  ${item.state === 'current' ? '✓' : '·'} ${item.client.padEnd(13)} ${item.state.padEnd(27)} ${item.path}`)
  console.log('  mutaciones: ninguna · contenido: no mostrado · secretos: no leídos')
}
process.exit(result.some((item) => item.state === 'existing-needs-merge') ? 1 : 0)
