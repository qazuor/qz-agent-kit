# Inventario de limpieza de los cuatro CLI

Fecha: 2026-10-01
Alcance: OpenCode, Claude Code, Codex y Gentle Shell
Modo: relevamiento y decisión; no se eliminaron archivos ni se modificaron instalaciones.

Este documento reemplaza las listas anteriores. Su propósito es dejar claro qué se elimina, qué se conserva y qué todavía necesita una decisión. Las rutas y los nombres de recursos sensibles se registran sólo como ubicación o categoría; no se muestran valores de tokens, claves, passwords, cookies ni contenido de `.env`.

## Regla de lectura

| Estado | Significado |
|---|---|
| **ELIMINAR** | Decisión tomada. Se ejecutará después de backup, receipt y validación del reemplazo. |
| **CONSERVAR** | Se mantiene como parte del diseño objetivo. |
| **CONSERVAR SOLO CLAUDE** | Se mantiene únicamente en Claude Code. |
| **REEMPLAZAR** | Se retira la copia actual cuando la nueva fuente esté instalada y verificada. |
| **A EVALUAR** | Todavía requiere revisar procedencia, uso o valor. |
| **PROTEGER** | No se toca durante la limpieza. |

La fuente de verdad de la nueva capa portable es `qz-agent-kit`. La limpieza no debe borrar proyectos, Git, worktrees útiles, specs, Linear, Engram, bases de datos ni credenciales.

## Decisiones ya tomadas

### Eliminar o reemplazar en los cuatro CLI

- copias antiguas administradas por qz-kit;
- Gentle AI, Engram y Context7 instalados por duplicado o por versiones viejas;
- RTK, sus hooks, reglas y configuración;
- `go-testing`;
- skills externas de Cloudflare reemplazadas por `qz-cloudflare`;
- `web-perf` reemplazada por `qz-web-perf`;
- validación Bash/env reemplazada por `qz-env-safety` y guards;
- `jd-*`, `review-*` y `4r-review` sueltos cuando exista la capacidad equivalente dentro del ecosistema Gentle;
- comandos `hops-*` antiguos cuando el adapter de Hospeda correspondiente esté publicado y probado;
- CodeGraph instalado fuera del componente administrado por qz-kit, una vez que el adapter nuevo tenga backup, doctor, indexado y rollback;
- copias duplicadas de output styles y reglas que compitan con la fuente qz.

### Conservar

- `qz-output-style` como fuente común de estilo para los cuatro CLI;
- `qz-permissions` como política semántica común, traducida por adapters;
- `qz-*` del paquete actual, después de verificar manifest, drift y rollback;
- `qz-start-issue`, `qz-close-issue`, `qz-recap`, `qz-handoff`, `qz-verify` y los demás comandos qz versionados;
- Engram y su base de datos existente, sin limpiar ni reescribir durante esta etapa;
- los archivos nativos de Gentle que Gentle Shell declare como propios;
- `agents-sdk` y `sandbox-sdk` únicamente en Claude Code.

### A evaluar

- Claude `synced`;
- hooks y plugins sin procedencia atribuida;
- skills y agentes de Hospeda que no sean `hops-*`;
- código externo del usuario;
- MCPs de proyecto no cubiertos por qz-kit, Gentle AI, Engram o Context7;
- configuración TUI específica de cada CLI;
- CodeGraph hasta que el adapter administrado esté publicado;
- cualquier archivo que el inventario encuentre fuera de estas categorías.

## OpenCode

### Eliminar o reemplazar

| Recurso | Decisión | Reemplazo o condición |
|---|---|---|
| qz-kit viejo: skills, commands, agents, plugins, hooks y manifests | ELIMINAR | Reinstalar desde el manifest actual de qz-agent-kit |
| Gentle/Engram/Context7 duplicados | ELIMINAR | Una única integración verificada por qz-kit/Gentle |
| RTK y sus hooks | ELIMINAR | No forma parte del stack objetivo |
| skills Cloudflare antiguas | ELIMINAR | `qz-cloudflare` |
| `web-perf` antigua | ELIMINAR | `qz-web-perf` |
| validadores Bash/env antiguos | ELIMINAR | `qz-env-safety` + guards |
| `jd-*`, `review-*`, `4r-review` sueltos | ELIMINAR | Capacidades internas de Gentle o qz-review |
| plugins CodeGraph viejos | REEMPLAZAR | Sólo después de publicar y verificar el adapter qz |
| `AGENTS.md` global existente | NO BORRAR | Merge delimitado; preservar bloques Gentle/Engram |

### Conservar

- la instalación nativa de OpenCode que no pertenezca a los recursos anteriores;
- el `AGENTS.md` global existente, conservando sus bloques externos;
- credenciales y providers, que no se leen ni se modifican en la limpieza;
- snapshots propios de OpenCode, salvo que el usuario apruebe retirarlos por separado;
- qz skills, commands y agents después de una instalación limpia.

### A evaluar

- plugins sin procedencia atribuida;
- MCPs no administrados por qz/Gentle/Engram/Context7;
- configuración TUI propia de OpenCode;
- temas, statusline, browser, worktree y background-agent plugins;
- contenido de `AGENTS.md` que no sea Gentle/Engram ni qz;
- CodeGraph hasta que el adapter tenga prueba de indexado y rollback.

`qz-kit instructions-merge --plan` calcula un merge de instrucciones qz sin sobrescribir este archivo. La aplicación será explícita y con backup:

```bash
qz-kit instructions-merge --apply --approve QZ_INSTRUCTIONS_MERGE
```

No se ejecutó sobre el OpenCode real.

## Claude Code

### Eliminar o reemplazar

| Recurso | Decisión | Reemplazo o condición |
|---|---|---|
| qz-kit viejo | ELIMINAR | Reinstalar desde qz-agent-kit |
| Gentle/Engram/Context7 duplicados | ELIMINAR | Reinstalar una sola integración |
| RTK | ELIMINAR | No forma parte del stack |
| `go-testing` | ELIMINAR | No aplica al monorepo TypeScript |
| Cloudflare/web-perf/env legacy | REEMPLAZAR | Skills qz portables |
| `jd-*`, `review-*`, `4r-review` sueltos | ELIMINAR | Gentle/RDD o qz-review |
| `CLAUDE.md` | REEMPLAZAR | `AGENTS.md`, skills y documentación normal, después de validar lectura |
| output styles duplicados | REEMPLAZAR | `qz-output-style` común |

### Conservar sólo en Claude Code

- `agents-sdk`;
- `sandbox-sdk`;
- cualquier documentación específica de Anthropic que no sea necesaria en los demás CLI.

### Conservar en los cuatro mediante qz-kit

- qz commands, skills, agents e instrucciones comunes;
- qz permissions y guards;
- qz output style, proyectado además a `~/.claude/output-styles`.

### A evaluar

- bundle `synced`, archivo por archivo;
- hooks no atribuidos;
- plugins externos sin owner o versión conocida;
- skills/agentes Hospeda que no sean `hops-*`;
- código externo del usuario;
- settings de Claude que seleccionen output style, permisos o hooks;
- contenido actual de `Memory.md` después de la promoción a skills/guards.

Nada de esto se elimina por inferencia. Primero se genera una ficha por recurso.

## Codex

### Eliminar o reemplazar

| Recurso | Decisión | Reemplazo o condición |
|---|---|---|
| qz-kit viejo | ELIMINAR | Reinstalar desde qz-agent-kit |
| Gentle/Engram/Context7 duplicados | ELIMINAR | Integración única verificada |
| RTK, Cloudflare/web-perf/env legacy | REEMPLAZAR | Skills qz portables |
| `go-testing` | ELIMINAR | No aplica al proyecto |
| `jd-*`, `review-*` sueltos | ELIMINAR | Gentle/RDD o qz-review |
| configuraciones qz obsoletas | ELIMINAR | Reconciliar desde manifest y receipt |

### Conservar

- autenticación existente, sin leer valores;
- configuración nativa no administrada por qz;
- historial y sesiones de Codex;
- skills y agentes qz después de instalación limpia.

### A evaluar

- `~/.codex/AGENTS.md` si apareciera antes de la instalación;
- MCPs no administrados;
- plugins o wrappers externos;
- settings de sandbox y permisos;
- configuración TUI y statusline;
- cualquier skill que no tenga procedencia verificable.

El `AGENTS.md` global de Codex se creará o fusionará sólo mediante el plan explícito de instrucciones. Actualmente no existe en el HOME relevado.

## Gentle Shell

### Eliminar o reemplazar

| Recurso | Decisión | Reemplazo o condición |
|---|---|---|
| qz-kit viejo | ELIMINAR | Reinstalar prompts, skills y agents desde qz-agent-kit |
| copias antiguas de Gentle AI | ELIMINAR | Reinstalar versión seleccionada y verificada |
| Engram/Context7 duplicados | ELIMINAR | Integración única |
| RTK, Cloudflare/web-perf/env legacy | REEMPLAZAR | Skills qz portables |
| `go-testing` | ELIMINAR | No aplica al proyecto |
| `jd-*`, `review-*`, `4r-review` sueltos | ELIMINAR | Gentle interno/RDD o qz-review |
| prompts `hops-*` antiguos | REEMPLAZAR | Adapter Hospeda publicado y probado |

### Proteger

- `APPEND_SYSTEM.md` y persona administrados por Gentle Shell;
- runtime Pi, temas y archivos internos de Gentle;
- auth y modelos, sin leer ni copiar credenciales;
- sesiones y estado de Gentle Shell;
- snapshots nativos necesarios para rollback.

qz-kit no sobrescribe `APPEND_SYSTEM.md`, persona ni assets propietarios. El output style común se instala como skill/prompt portable, no como una segunda persona que compita con Gentle.

### A evaluar

- prompts adicionales sin procedencia;
- plugins Pi no atribuidos;
- MCPs externos;
- configuración de TUI y notificaciones;
- background agents;
- integraciones de voz/browser/PTY;
- cualquier skill que no sea administrada por Gentle o qz-kit.

## Elementos comunes que no se deben borrar

- `~/.engram` y todas sus bases de datos hasta completar una etapa específica de memoria;
- `~/.config/qz-agent-kit` mientras exista un receipt o rollback activo;
- proyectos Hospeda, `hospeda-staging`, worktrees útiles y ramas de trabajo;
- `.specs`, artifacts, Linear y scripts del proyecto;
- Git, hooks del repositorio y bases PostgreSQL;
- `.env`, `.env.local`, auth, tokens, cookies y claves privadas;
- snapshots de cualquier CLI hasta confirmar que ya existe un backup externo.

## Orden seguro de ejecución futura

1. Ejecutar el inventario read-only por cliente.
2. Generar backup y manifest de limpieza.
3. Instalar qz-kit en un HOME temporal y ejecutar `parity`.
4. Revisar manualmente los elementos **A EVALUAR**.
5. Ejecutar limpieza segura sólo de recursos administrados por qz-kit.
6. Reinstalar la capa qz.
7. Aplicar el merge de instrucciones OpenCode/Codex.
8. Activar el output style de Claude si no hay conflicto.
9. Configurar Gentle AI, Engram y Context7 con sus adapters aprobados.
10. Ejecutar `qz-kit parity`, doctor y pruebas read-only de cada CLI.
11. Recién después evaluar la eliminación de `CLAUDE.md`, `hops-*` antiguos y CodeGraph.

## Estado actual

El paquete contiene la fuente común, manifests, adapters declarativos, skills, commands, guards, output style, política de permisos, parity y plan de merge. Las pruebas en homes temporales pasan. La aplicación sobre las instalaciones reales queda pendiente de aprobación y no forma parte de este documento de limpieza.
