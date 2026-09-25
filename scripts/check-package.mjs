#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const cache = mkdtempSync(join(tmpdir(), 'qz-npm-cache-'))
try {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NPM_CONFIG_CACHE: cache },
    encoding: 'utf8'
  })
  const files = JSON.parse(output)[0]?.files?.map((entry) => entry.path) || []
  const forbidden = files.filter((path) => /(^|\/)(\.env($|\.)|\.git($|\/)|backups?($|\/)|auth\.json$|credentials?($|\/)|secret)/i.test(path))
  if (forbidden.length) throw new Error(`archivos sensibles en package: ${forbidden.join(', ')}`)
  console.log(JSON.stringify({ package: 'safe', files: files.length, forbidden: [], secretValues: 'not-read' }, null, 2))
} finally {
  rmSync(cache, { recursive: true, force: true })
}
