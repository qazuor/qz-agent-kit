# Engram adapter

Este adapter define cómo relevar y conservar Engram sin asumir que la memoria
puede regenerarse.

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

## Futuro adapter

Debe separar tres operaciones: inventario read-only, backup explícito y
restauración verificada. Los wrappers `qz-engram` pueden exponer las interfaces
humanas, pero no deben convertir operaciones destructivas en defaults.
