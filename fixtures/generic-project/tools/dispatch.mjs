#!/usr/bin/env node

const [command, ...args] = process.argv.slice(2)

if (command === 'context') {
  console.log(JSON.stringify({
    fixture: true,
    command,
    args,
    mutations: 'none',
  }, null, 2))
  process.exit(0)
}

console.error(`fixture dispatch: unsupported ${command || '(missing command)'}`)
process.exit(2)
