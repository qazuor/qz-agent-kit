# Gentle AI adapter

Este adapter describe la integración externa de Gentle AI; no instala ni
actualiza Gentle AI por sí mismo.

## Contrato verificado

- versión relevada: `3.7.0`;
- diagnóstico: `gentle-ai doctor` saludable en la máquina relevada;
- comandos de ciclo de vida: `install`, `sync`, `upgrade`, `restore`, `doctor`;
- `install` acepta `--scope global|workspace`, `--component`, `--skill`,
  `--dry-run` y políticas separadas de background agents;
- integración detectada: Engram MCP por la configuración de OpenCode;
- estado administrado: el doctor informa dos agentes instalados, OpenCode y Pi;
- política del kit: no ejecutar `install`, `sync` o `upgrade` desde el wizard sin
  una aprobación y un adapter de versión explícito.

## Preview verificado

El preview oficial con `--dry-run` y los defaults acordados (`global`, preset
`full-gentleman`, persona `gentleman`, SDD `single`, background agents off)
respondió correctamente en Linux/Ubuntu. Para OpenCode declaró los componentes
`claude-theme`, `context7`, `persona`, `engram`, `gga`, `opencode-gentle-logo`,
`permissions`, `sdd` y `skills`, sin dependencias autoagregadas. El adapter puede
delegar la planificación al comando oficial, pero debe conservar el preview y
pedir aprobación antes de ejecutar sus 11 pasos de apply.

El preview observado informa componentes, dependencias y el launcher de
background agents, pero no expone una lista completa de archivos administrados.
Por eso el adapter no puede inferir destinos de backup a partir del texto del
preview.

## Límites

El kit sólo registra la selección y detecta la versión. No pisa profiles,
personas, permisos, telemetry, auth, SDD/ODD, review/RDD ni archivos manejados
por Gentle AI. Un futuro adapter debe hacer primero `--plan` o equivalente,
registrar versión exacta y ofrecer rollback.
