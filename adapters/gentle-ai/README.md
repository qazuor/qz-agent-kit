# Gentle AI adapter

Este adapter describe la integración externa de Gentle AI; no instala ni
actualiza Gentle AI por sí mismo.

## Contrato verificado

- versión relevada: `3.7.0`;
- diagnóstico: `gentle-ai doctor` saludable en la máquina relevada;
- comandos de ciclo de vida: `install`, `sync`, `upgrade`, `restore`, `doctor`;
- integración detectada: Engram MCP por la configuración de OpenCode;
- estado administrado: el doctor informa dos agentes instalados, OpenCode y Pi;
- política del kit: no ejecutar `install`, `sync` o `upgrade` desde el wizard sin
  una aprobación y un adapter de versión explícito.

## Límites

El kit sólo registra la selección y detecta la versión. No pisa profiles,
personas, permisos, telemetry, auth, SDD/ODD, review/RDD ni archivos manejados
por Gentle AI. Un futuro adapter debe hacer primero `--plan` o equivalente,
registrar versión exacta y ofrecer rollback.
