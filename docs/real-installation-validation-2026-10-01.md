# Validación de instalación real — 2026-10-01

## Resultado

Se realizó una prueba real de backup, limpieza segura, instalación y verificación
de la capa qz-agent-kit sobre los cuatro harness soportados:

- OpenCode
- Claude Code
- Codex
- Gentle Shell

No se leyeron valores de secretos, tokens, claves ni archivos `.env`.

## Backup previo

- Ubicación: `~/.local/state/qz-agent-kit/pre-clean-backups/2026-10-01T10-05-53.227Z`
- Archivos respaldados: 3150
- Entradas omitidas por contener secretos, credenciales, sesiones o caches: 38
- Checksums: verificados
- Valores secretos: no leídos

El backup incluye las configuraciones y recursos de los cuatro clientes, Engram,
estado del kit y configuraciones relevantes de OpenCode. La DB de Engram se
conservó junto con sus archivos SQLite auxiliares.

## Limpieza

- Receipt: `~/.local/state/qz-agent-kit/clean-backups/2026-10-01T10-07-25.341Z/clean-receipt.json`
- Elementos eliminados por la política aprobada: 144
- Elementos conservados: 1098
- Elementos pendientes de revisión: 0
- Cada elemento eliminado quedó respaldado en el receipt de limpieza.

La limpieza eliminó sólo elementos clasificados como administrados por qz-kit,
Gentle AI o reemplazados por ellos. No eliminó recursos ajenos clasificados como
conservables.

## Instalación

El plan real instaló la capa portable en los cuatro clientes y registró Gentle AI,
Engram, Context7, RDD/review y background agents como componentes seleccionados.

La verificación de qz-kit terminó con:

- `missing: 0`
- `drift: 0`
- `stale: 0`
- `contentDrift: 0`

La paridad portable quedó completa para `qz-output-style` y `qz-permissions`.
Los comandos y agentes qz tienen el mismo hash en los cuatro clientes.

El preflight informa Context7, RDD/review y background agents como `pending`
porque todavía no tienen adapters de instalación multi-CLI. No se simularon como
instalados: Context7 y Engram sí aparecen conectados en OpenCode, mientras que la
instalación uniforme de esos tres componentes queda pendiente de sus adapters.

## Estado de las instrucciones

Se aplicó el merge acotado de instrucciones comunes:

- OpenCode: `AGENTS.md` con bloque qz administrado
- Codex: `AGENTS.md` creado con bloque qz administrado
- Claude Code: output style qz actual
- Gentle Shell: se conserva su prompt nativo; qz se entrega mediante skills,
  comandos y agentes sin reemplazar `APPEND_SYSTEM.md`

El plan de instrucciones informa los tres primeros como `current` y Gentle Shell
como `gentle-owned-missing`, que es intencional para no pisar el sistema propio de
Gentle.

## Pruebas de los harness

- OpenCode 1.18.32: smoke no mutante exitoso con modelo NAN Builder.
- Claude Code 2.1.286: smoke no mutante exitoso.
- Codex 0.155.0: smoke no mutante exitoso en sandbox read-only.
- Gentle Shell 3.7.0 / Pi 0.87.1: smoke no mutante exitoso con OpenAI Codex.
- Gentle Shell con NAN Builder quedó configurado con sus modelos visibles; el
  smoke del proveedor NAN no terminó dentro del timeout, mientras que el mismo
  harness con OpenAI Codex respondió correctamente.

## Engram

- Versión: 2.0.0
- `gentle-ai doctor`: saludable, 9 checks pasados.
- MCP de Engram: alcanzable desde OpenCode.
- Verificación SQLite read-only independiente: `PRAGMA integrity_check = ok`.
- `engram doctor --check sqlite_lock_contention` quedó esperando por un lock
  activo durante la instalación; por seguridad qz-kit no ejecutó `engram setup` y
  no modificó la DB.

## Adapter de Hospeda

El adapter `hops` quedó conectado en el worktree separado
`hospeda-opencode-gentle-ai` mediante:

```json
"dispatch": "bun run scripts/client-tools/src/index.ts"
```

Pruebas realizadas:

- `qz doctor`: contrato válido.
- `qz context`: exitoso.
- `qz recap --json`: exitoso.
- `qz verify --list`: leyó el workflow real de CI.
- `qz start-issue HOS-635 --dry-run`: consultó Linear y calculó branch desde
  `develop` sin crear worktree ni tocar estado.
- `qz close-issue --plan`: ejecutó el preflight read-only y bloqueó correctamente
  por worktree sucio.

El adapter todavía debe ser revisado y mergeado al branch correspondiente de
Hospeda antes de que otros clones reciban esta conexión.
