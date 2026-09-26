# Engram adapter

Este adapter define cómo relevar y conservar Engram sin asumir que la memoria
puede regenerarse.

El contrato declarativo está en `manifest.json`. Clasifica comandos read-only,
exportaciones y mutaciones para que una futura instalación pueda pedir una
aprobación concreta. No convierte `export` en una acción automática.

## Contrato verificado

- versión relevada: `2.0.0`;
- ejecutable: detectado por `qz-kit ecosystem`;
- integración: `engram mcp --tools=agent` es la forma documentada para los CLI;
- interfaces disponibles: `doctor`, `stats`, `projects list`, `export`, `tui`,
  `sync` y `cloud`;
- política del kit: nunca copiar, importar, exportar, limpiar, consolidar ni
  modificar la DB automáticamente.

## Diagnóstico actual

`engram doctor --json` no terminó dentro de 15 segundos durante el relevamiento
y se detuvo con timeout. No se ejecutó ninguna mutación. Gentle AI sí reportó
que el handshake MCP de Engram responde desde OpenCode. Antes de automatizar el
adapter hay que reproducir el doctor en un proceso aislado y determinar si el
tiempo proviene de un lock/concurrencia de la DB.

Algunos subcomandos de Engram no implementan `--help`: por ejemplo, `engram
export --help` se interpreta como una exportación y puede escribir un archivo.
El adapter no debe descubrir interfaces ejecutando flags no documentados.

Los checks acotados sí responden: `sqlite_lock_contention` para `hospeda` dio
`ok` con WAL activo, `busy_timeout_ms=5000` y `checkpoint_busy=0`. Los checks de
integridad también revelaron warnings/errors históricos que no deben corregirse
automáticamente: sesiones activas ambiguas, observaciones huérfanas, metadatos
de ownership incompletos y targets cloud antiguos con mutaciones pendientes.

## Futuro adapter

Debe separar tres operaciones: inventario read-only, backup explícito y
restauración verificada. Los wrappers `qz-engram` pueden exponer las interfaces
humanas, pero no deben convertir operaciones destructivas en defaults.
