#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const home = resolve(value('--home') || homedir())
const port = Number(value('--port') || 4319)
const refreshInterval = Number(value('--refresh-interval') || 300)
const unitPath = resolve(value('--unit') || `${home}/.config/systemd/user/qz-subscriptions.service`)
const serverScript = resolve(new URL('./subscription-server.mjs', import.meta.url).pathname)
const nodePath = process.execPath
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('puerto inválido')
if (!Number.isInteger(refreshInterval) || refreshInterval < 30) throw new Error('refresh interval debe ser al menos 30 segundos')
const unit = `[Unit]\nDescription=qz subscription dashboard\nAfter=network-online.target\n\n[Service]\nType=simple\nExecStart=${nodePath} ${serverScript} --port ${port} --refresh-interval ${refreshInterval}\nRestart=on-failure\nRestartSec=5\nNoNewPrivileges=true\nPrivateTmp=true\n\n[Install]\nWantedBy=default.target\n`
const output = { unitPath, nodePath, serverScript, port, refreshInterval, mode: has('--apply') ? 'apply' : 'plan', mutations: has('--apply') ? [unitPath, 'systemd-user-unit'] : 'none', secretValues: 'not-read' }
if (!has('--apply')) { console.log(JSON.stringify({ ...output, unit }, null, 2)); process.exit(0) }
if (process.platform !== 'linux') throw new Error('el servicio systemd sólo está implementado para Linux')
const probe = spawnSync('systemctl', ['--user', 'show-environment'], { encoding: 'utf8', stdio: 'ignore', timeout: 10000 })
if (probe.error || probe.status !== 0) throw new Error('systemd --user no está disponible; ejecutar qz-kit subscriptions install --plan para revisar la unidad')
mkdirSync(dirname(unitPath), { recursive: true })
writeFileSync(unitPath, unit, { mode: 0o600 })
const reload = spawnSync('systemctl', ['--user', 'daemon-reload'], { encoding: 'utf8', stdio: 'ignore', timeout: 10000 })
if (reload.status !== 0) throw new Error('systemd no pudo recargar la unidad')
const enable = spawnSync('systemctl', ['--user', 'enable', '--now', 'qz-subscriptions.service'], { encoding: 'utf8', stdio: 'ignore', timeout: 20000 })
if (enable.status !== 0) throw new Error('systemd no pudo habilitar/iniciar qz-subscriptions.service')
console.log(JSON.stringify({ ...output, status: 'installed', url: `http://127.0.0.1:${port}`, unitPath, mutations: [unitPath, 'systemd-user-unit'], secretValues: 'not-read' }, null, 2))
