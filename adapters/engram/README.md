# Engram adapter

Este adapter define cómo relevar y conservar Engram sin asumir que la memoria
puede regenerarse.

El contrato declarativo está en `manifest.json`. Clasifica comandos read-only,
exportaciones y mutaciones para que una futura instalación pueda pedir una
aprobación concreta. No convierte `export` en una acción automática.

`engram setup` no ofrece un modo dry-run en la ayuda actual; sólo permite
seleccionar el agente y el protocolo. El adapter debe descubrir y respaldar sus
destinos por separado antes de ejecutar setup, o mantener esa operación fuera
del instalador qz.

La DB local es la fuente de verdad y usa el triplete SQLite `engram.db`,
`engram.db-wal` y `engram.db-shm`. Una copia binaria consistente debe tratar
los tres archivos juntos y sólo sobre filesystem local. `engram export` es una
segunda copia lógica versionada (observations, prompts, pins y relaciones),
pero sigue siendo una operación explícita y no se ejecuta desde el instalador.

## Contrato verificado

- versión relevada: `2.0.0`;
- ejecutable: detectado por `qz-kit ecosystem`;
- integración: `engram mcp --tools=agent` es la forma documentada para los CLI;
- interfaces disponibles: `doctor`, `stats`, `projects list`, `export`, `tui`,
  `test --quick --json`, `sync` y `cloud`;
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
humanas, pero no deben convertir operaciones destructivas en defaults. La ayuda
actual confirma que `engram setup <agent> --protocol=full|slim` instala la
integración del agente; el adapter conserva `full` como default porque `slim`
tiene restricciones de compatibilidad específicas de Claude Code.
