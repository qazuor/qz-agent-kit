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

La documentación oficial actual aclara que Gentle AI crea snapshots
comprimidos antes de `install`, `sync` y `upgrade`, conserva los cinco más
recientes y permite restaurar con `gentle-ai restore latest`. El alcance se
determina por los agentes registrados en `~/.gentle-ai/state.json`, no por
todas las carpetas que existan en el home. El adapter qz debe delegar ese
backup nativo y registrar su manifest/identificador; no debe duplicar la copia
ni asumir cobertura de agentes no registrados.

## Límites

El kit sólo registra la selección y detecta la versión. No pisa profiles,
personas, permisos, telemetry, auth, SDD/ODD, review/RDD ni archivos manejados
por Gentle AI. Un futuro adapter debe hacer primero `--dry-run`, comprobar el
scope de `state.json`, registrar la versión y snapshot nativos, y usar
`gentle-ai restore latest` como rollback documentado. El backup nativo cubre
configuración administrada, no paquetes instalados por el sistema ni la DB de
Engram.
