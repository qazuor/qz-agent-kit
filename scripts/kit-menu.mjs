#!/usr/bin/env node
import { intro, isCancel, outro, select } from '@clack/prompts'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('qz-kit necesita una terminal interactiva cuando se ejecuta sin argumentos.')
  console.error('Usá `qz-kit install`, `qz-kit doctor` o `qz-kit --help` en scripts no interactivos.')
  process.exit(2)
}

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const bin = join(root, 'bin', 'qz-kit')
intro('qz-agent-kit · menú principal')
const choice = await select({
  message: '¿Qué querés hacer?',
  options: [
    { value: 'install', label: 'Instalar o configurar', hint: 'wizard interactivo para los CLI detectados' },
    { value: 'check', label: 'Comprobar instalación', hint: 'solo lectura, muestra drift y clientes detectados' },
    { value: 'update-plan', label: 'Planificar actualización', hint: 'solo lectura, no aplica cambios' },
    { value: 'doctor', label: 'Ejecutar doctor', hint: 'diagnóstico del ecosistema' },
    { value: 'verify', label: 'Verificar seguridad y estado', hint: 'comprobaciones read-only' },
    { value: 'memory', label: 'Revisar memoria', hint: 'escaneo read-only de memorias Claude' },
    { value: 'help', label: 'Ver ayuda', hint: 'comandos disponibles' },
    { value: 'exit', label: 'Salir' }
  ]
})
if (isCancel(choice) || choice === 'exit') {
  outro('Sin cambios.')
  process.exit(0)
}

const args = choice === 'install'
  ? ['install']
  : choice === 'check'
    ? ['install', '--check']
    : choice === 'update-plan'
      ? ['update', '--plan']
      : choice === 'doctor'
        ? ['doctor']
        : choice === 'verify'
          ? ['verify']
          : choice === 'memory'
            ? ['memory', 'scan', '--json']
            : ['--help']
const result = spawnSync(process.execPath, [bin, ...args], { stdio: 'inherit' })
process.exit(result.status ?? 1)
