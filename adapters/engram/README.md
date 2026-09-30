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
`engram.db-wal` y `engram.db-shm`. El backup del kit usa SQLite online backup
para producir una DB independiente consistente mientras el servicio está vivo;
los archivos WAL/SHM activos no se copian como si fueran una DB restaurable.
`engram export` es una segunda copia lógica versionada (observations, prompts,
pins y relaciones), pero sigue siendo una operación explícita y no se ejecuta
desde el instalador.

## Contrato verificado

- versión relevada: `2.0.0`;
- ejecutable: detectado por `qz-kit ecosystem`;
- integración: `engram mcp --tools=agent` es la forma documentada para los CLI;
- interfaces disponibles: `doctor`, `stats`, `projects list`, `export`, `tui`,
  `test --quick --json`, `sync` y `cloud`;
- política del kit: nunca importar, exportar, limpiar, consolidar ni modificar
  la DB automáticamente. El único apply externo permitido requiere un backup
  explícito con checksum, preview, `--approve ENGRAM_APPLY` y doctor posterior.

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

## Flujo de apply explícito

El adapter separa inventario read-only, backup explícito y aplicación verificada.
Los wrappers `qz-engram` siguen bloqueando mutaciones. La aplicación controlada
usa el siguiente flujo:

```bash
qz-kit external-backup --component engram --project <project> --approve ENGRAM_BACKUP
qz-kit external-preview --component engram --project <project> \
  --receipt /tmp/engram-preview.json
qz-kit external-apply --component engram --project <project> \
  --backup ~/.local/state/qz-agent-kit/external-backups/engram/<timestamp>/manifest.json \
  --receipt /tmp/engram-preview.json --approve ENGRAM_APPLY
```

El apply sólo ejecuta `engram setup opencode --protocol=full` y valida luego
`sqlite_lock_contention`. No exporta, consolida, poda ni borra memorias. El
adapter conserva `full` como default porque `slim` tiene restricciones de
compatibilidad específicas de Claude Code.
