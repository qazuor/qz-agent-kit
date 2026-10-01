# Revisión de limpieza de clientes CLI

Fecha del relevamiento: 2026-10-01  
Modo: solo lectura  
Clientes revisados: OpenCode, Claude Code, Codex y Gentle Shell

Este informe separa los recursos administrados por `qz-agent-kit` de los recursos externos. No se eliminó ningún archivo. La clasificación vigente es la de la sección **Política vigente y clasificación actualizada**; las listas históricas más abajo se conservan como evidencia del relevamiento original.

## Política vigente y clasificación actualizada

La limpieza futura tendrá este orden: backup y recibos, revisión de secretos protegidos, eliminación de los recursos listados como `ELIMINAR`, instalación limpia de qz-kit y de sus componentes externos seleccionados, y verificación de drift. Esta clasificación no autoriza por sí sola ninguna eliminación.

### Pasa directamente a `ELIMINAR`

Se elimina la configuración vieja cuando se haya verificado el backup y la reinstalación del reemplazo:

1. **qz-agent-kit**: todos los `qz-*` commands, prompts, skills, agents, wrappers, reglas y archivos generados por su instalación anterior en OpenCode, Claude Code, Codex y Gentle Shell. Se reinstalan desde la fuente de verdad versionada.
2. **Gentle AI**: todos los recursos con procedencia demostrada por snapshots/manifiestos de Gentle: comandos SDD, skills Gentle, plugins, temas, TUI, `AGENTS.md`, archivos `.gentle-ai-*`, agentes, chains, `APPEND_SYSTEM.md` y `mcp.json` de Gentle Shell. qz-kit ya ofrece el adapter oficial para reinstalarlos; no se conservan copias viejas para evitar duplicados.
3. **Engram**: el plugin `~/.config/opencode/plugins/engram.ts`, la entrada MCP de Engram en las configuraciones de los clientes y `~/.claude/mcp/engram.json`. La base de memoria (`~/.engram`) queda protegida y **no** entra en esta limpieza. El reemplazo es la instalación/`setup` oficial administrada por qz-kit.
4. **Context7**: configuraciones MCP antiguas (`~/.claude/mcp/context7.json`, entradas `context7` en `opencode.json` y equivalentes de otros clientes) y skills duplicadas como `context7-mcp`. No se borra ningún token ni archivo de autenticación. El adapter de Context7 queda como componente seleccionable de qz-kit y deberá verificarse durante la reinstalación.
5. **Workflows que sólo duplican qz-kit**: comandos legacy sin prefijo, skills de worktree/issue/handoff que únicamente envolvían el flujo qz y aliases duplicados. Se eliminan cuando el inventario confirme que son copias y no una personalización independiente.

### `A EVALUAR` (no tienen reemplazo confirmado)

Estos recursos no se eliminan ahora. La decisión se toma por grupo, verificando uso real y dependencia:

| Cliente / grupo | Qué hace | Reemplazo confirmado | Decisión pendiente |
|---|---|---|---|
| Claude `cloudflare`, `cloudflare-email-service`, `durable-objects`, `workers-best-practices`, `wrangler` | Documentación, recetas y revisión para Cloudflare/Workers | Ninguno en qz-kit, Gentle o Engram | Conservar sólo si se trabaja con Cloudflare |
| Claude `agents-sdk`, `sandbox-sdk` | Guías para construir agentes y sandboxes | Ninguno | Conservar si se usan esas plataformas; si no, retirar |
| Claude `web-perf` | Mediciones de rendimiento con navegador/DevTools | No hay reemplazo equivalente en qz-kit | Conservar si se hacen auditorías web |
| Claude `go-testing` | Patrones de pruebas Go y golden files | No hay reemplazo equivalente | Conservar sólo para repos Go |
| Claude `synced` | Bundle sincronizado de skills externas; su procedencia individual no está verificada | Ninguno confirmado | Auditar contenido y origen antes de decidir |
| Claude hooks CodeGraph | Indexación/relaciones del código para contexto | Ninguno confirmado | Decidir si el valor supera mantenimiento y consumo |
| Claude RTK | Compactación de salida de terminal para ahorrar contexto/tokens | qz-kit no lo reemplaza | Medir ahorro real antes de conservar |
| Claude validación Bash/env | Guardrails para comandos y variables locales | qz-kit cubre parte con `verify`/preflight, no todo | Comparar reglas y conservar lo que no esté duplicado |
| Claude output styles, rules, planes y permisos locales | Personalización de comportamiento y controles del cliente | No hay equivalencia 1:1 entre los cuatro CLI | Revisar uno por uno; no eliminar por nombre |
| Codex `.system` | Skills del sistema provistas por Codex | No corresponde reemplazarlas con qz-kit | Conservar; son parte del cliente |
| Codex `agents-sdk`, `cloudflare*`, `durable-objects`, `sandbox-sdk`, `web-perf`, `workers-*`, `wrangler` | Skills generales de plataforma | Ninguno confirmado | Conservar sólo cuando exista uso |
| Gentle Shell prompts `hops-*` | Workflows 100% Hospeda: DB, servidores, artifacts, Linear y worktrees | No son parte del paquete genérico qz-kit | Evaluar/migrar al adapter Hospeda; no borrar desde la limpieza global |
| Gentle Shell agentes de review `jd-*` y `review-*` | Exploración, revisión 4R y jueces | Gentle los administra, pero su utilidad frente a RDD/ODD aún debe validarse | Si se reinstala Gentle, limpiar copias viejas y decidir si se habilitan |

### Evidencia de procedencia

- OpenCode: snapshot Gentle AI del 2026-09-15 registra 74 recursos con `existed: false`; `qz-kit clean --plan --client opencode` detecta 81 elementos, 79 reemplazables y 2 pendientes.
- Gentle Shell: `managed-assets.json` y snapshots registran agentes, chain, `APPEND_SYSTEM.md` y `mcp.json` administrados por Gentle.
- Engram: se verificaron el plugin de OpenCode y el MCP de Claude; la DB no se considera configuración descartable.
- Context7: se verificaron MCPs de Claude y la entrada MCP de OpenCode; el adapter qz está declarado como pendiente de configuración automática.
- Claude y Codex no aparecen como destinos en los snapshots nativos de Gentle AI inspeccionados; sus recursos sólo pasan a eliminar por qz/reemplazo explícito, no por su simple nombre.

## Resumen histórico del inventario inicial

| Cliente | Recursos propuestos para eliminar | Recursos externos a revisar |
|---|---:|---:|
| OpenCode | 14 | 54 |
| Claude Code | 20 | 639 |
| Codex | 14 | 419 |
| Gentle Shell | 14 | 48 |
| **Total** | **62** | **1160** |

Estas cifras son el corte inicial y no representan el alcance actual: no incluían todos los recursos Gentle, Engram y Context7 detectados después. La clasificación vigente está en la sección anterior y tiene precedencia sobre esta tabla.

Credenciales, tokens, historiales, sesiones, bases de datos, caches y archivos sensibles quedaron fuera del inventario de eliminación.

> **Cómo leer las secciones históricas:** algunos encabezados `A definir por Qazuor` conservan la clasificación del relevamiento anterior. Si un recurso aparece allí pero también está cubierto por qz-kit, Gentle AI, Engram o Context7 en la clasificación vigente, prevalece `ELIMINAR` y no vuelve a considerarse una decisión abierta.

## OpenCode

### Recursos confirmados como instalados por Gentle AI

La procedencia se verificó contra el snapshot nativo de Gentle AI del 2026-09-15. Los siguientes 74 recursos aparecen registrados como creados por la instalación de Gentle (`existed: false`):

#### Commands Gentle

- `sdd-apply.md`
- `sdd-archive.md`
- `sdd-continue.md`
- `sdd-explore.md`
- `sdd-ff.md`
- `sdd-init.md`
- `sdd-new.md`
- `sdd-onboard.md`
- `sdd-research.md`
- `sdd-status.md`
- `sdd-verify.md`

#### Skills Gentle

- `_shared` (12 archivos)
- `branch-pr`
- `chained-pr`
- `cognitive-doc-design`
- `comment-writer`
- `gentle-ai-bench`
- `go-testing`
- `issue-creation`
- `judgment-day`
- `rdd-defect-workflow`
- `sdd-apply`
- `sdd-archive`
- `sdd-design`
- `sdd-explore`
- `sdd-init`
- `sdd-onboard`
- `sdd-propose`
- `sdd-research`
- `sdd-spec`
- `sdd-tasks`
- `sdd-verify`
- `skill-creator`
- `skill-improver`
- `skill-registry`
- `systemic-issue-triage`
- `work-unit-commits`

#### Plugins y configuración Gentle

- `plugins/background-agents.ts`
- `plugins/model-variants.ts`
- `plugins/opencode-review-transport.ts`
- `plugins/review-result-artifacts.ts`
- `plugins/sdd-task-result-artifacts.ts`
- `plugins/skill-registry.ts`
- `plugins/telemetry-runtime.ts`
- `themes/gentleman-cute.json`
- `themes/gentleman.json`
- `tui-plugins/gentle-logo.tsx`
- `tui.json`
- `.gentle-ai-default-agent.json`
- `.gentle-ai-telemetry-runtime.json`
- `AGENTS.md`
- `opencode.json`

Estos recursos quedan clasificados como **ELIMINAR** en la limpieza aprobada. La eliminación sólo se ejecuta después de backup y de verificar que qz-kit puede reinstalar Gentle AI mediante su adapter oficial.

### Eliminar

#### Commands

- `qz-artifact.md`
- `qz-close-issue.md`
- `qz-engram.md`
- `qz-handoff.md`
- `qz-linear-backlog.md`
- `qz-recap.md`
- `qz-refine-spec.md`
- `qz-start-issue.md`
- `qz-verify.md`

#### Skills

- `qz-agents`
- `qz-commands`

#### Agents

- `qz-implementation.md`
- `qz-review-readonly.md`
- `qz-verification.md`

### A definir por Qazuor

Commands SDD y de herramientas:

- `sdd-apply.md`
- `sdd-archive.md`
- `sdd-continue.md`
- `sdd-explore.md`
- `sdd-ff.md`
- `sdd-init.md`
- `sdd-new.md`
- `sdd-onboard.md`
- `sdd-research.md`
- `sdd-status.md`
- `sdd-verify.md`
- `skill-creator.md`
- `skill-registry.md`

Skills externos:

- `_shared`
- `chained-pr`
- `cognitive-doc-design`
- `go-testing`
- `issue-creation`
- `judgment-day`
- `sdd-*`
- `skill-creator`
- `skill-improver`
- `skill-registry`
- `work-unit-commits`

Clasificación vigente: **ELIMINAR**. Son recursos administrados por Gentle AI; se reinstalarán sólo si el componente Gentle/SDD se selecciona. SDD está deprecado en nuestro flujo y ODD es el camino por defecto.

## Claude Code

### Verificación de procedencia Gentle AI

No hay entradas de Claude Code en los snapshots nativos de Gentle AI. Por eso sólo se eliminan aquí los recursos qz, Engram, Context7 o duplicados con reemplazo confirmado; el resto queda en `A EVALUAR` según la clasificación vigente de arriba.

### Eliminar

#### Commands

- `closeIssue.md`
- `handoff.md`
- `linear-backlog.md`
- `qz-artifact.md`
- `qz-close-issue.md`
- `qz-engram.md`
- `qz-handoff.md`
- `qz-linear-backlog.md`
- `qz-recap.md`
- `qz-refine-spec.md`
- `qz-start-issue.md`
- `qz-verify.md`
- `recap.md`
- `startIssue.md`

Los comandos sin prefijo son equivalentes legacy y quedarían reemplazados por los comandos qz.

#### Skills

- `linear-backlog`
- `qz-agents`
- `qz-commands`

#### Agents

- `qz-implementation.md`
- `qz-review-readonly.md`
- `qz-verification.md`

### A definir por Qazuor

Commands específicos de Hospeda:

- `hops-stats.md`
- `smoke.md`
- `scripts/recap-scan.sh`

Agents externos:

- `jd-fix-agent.md`
- `jd-judge-a.md`
- `jd-judge-b.md`

Skills externos (633 archivos):

- `agents-sdk`
- `branch-pr`
- `chained-pr`
- `cloudflare`
- `cloudflare-email-service`
- `cognitive-doc-design`
- `comment-writer`
- `context7-mcp`
- `durable-objects`
- `go-testing`
- `issue-creation`
- `judgment-day`
- `sandbox-sdk`
- `skill-creator`
- `skill-improver`
- `synced`
- `web-perf`
- `work-unit-commits`
- `workers-best-practices`
- `worktree`
- `wrangler`

Los grupos más grandes son `cloudflare` (321 archivos), `synced` (226) y `worktree` (34). No se recomienda borrarlos automáticamente.

También quedan para una evaluación separada los hooks de CodeGraph, Engram, RTK y validación Bash; MCP de Context7 y Engram; plugins; output styles; reglas; planes y sincronización de permisos.

## Codex

### Verificación de procedencia Gentle AI

No hay entradas de Codex en los snapshots nativos de Gentle AI. Sus recursos propios quedan en `A EVALUAR`, salvo la capa qz que pasa directamente a `ELIMINAR` y reinstalar.

### Eliminar

Codex tiene la capa qz instalada como skills:

- `qz-agents`
  - `qz-implementation`
  - `qz-review-readonly`
  - `qz-verification`
- `qz-commands`
  - `qz-artifact`
  - `qz-close-issue`
  - `qz-engram`
  - `qz-handoff`
  - `qz-linear-backlog`
  - `qz-recap`
  - `qz-refine-spec`
  - `qz-start-issue`
  - `qz-verify`

### A definir por Qazuor

Skills externos (419 archivos):

- `.system`
- `agents-sdk`
- `cloudflare`
- `cloudflare-email-service`
- `durable-objects`
- `sandbox-sdk`
- `web-perf`
- `workers-best-practices`
- `wrangler`

Recomendación: conservarlos. No hay evidencia suficiente para eliminarlos.

No se tocarán `config.toml`, reglas sandbox, autenticación, bases SQLite internas, historial, snapshots ni estado de sesiones.

## Gentle Shell

### Recursos confirmados como administrados por Gentle

El manifiesto `~/.gentle-shell/agent/gentle-ai/managed-assets.json` confirma como administrados por Gentle los siguientes recursos. Pasan directamente a `ELIMINAR`, después de backup y antes de la reinstalación limpia:

#### Agents

- `gentle-ai-explore.md`
- `gentle-ai-verify.md`
- `gentle-ai-worker.md`
- `jd-fix-agent.md`
- `jd-judge-a.md`
- `jd-judge-b.md`
- `review-readability.md`
- `review-reliability.md`
- `review-resilience.md`
- `review-risk.md`

#### Chain

- `chains/4r-review.chain.md`

Además, los snapshots nativos de Gentle AI registran como creados por su instalación:

- `APPEND_SYSTEM.md`
- `mcp.json`

Estos dos archivos son configuración de Gentle Shell y no aparecen en el inventario estándar de commands/skills/agents/prompts; también pasan a `ELIMINAR` y luego se regeneran mediante Gentle.

### Eliminar

#### Skills

- `qz-agents`
- `qz-commands`

#### Agents

- `qz-implementation.md`
- `qz-review-readonly.md`
- `qz-verification.md`

#### Prompts

- `qz-artifact.md`
- `qz-close-issue.md`
- `qz-engram.md`
- `qz-handoff.md`
- `qz-linear-backlog.md`
- `qz-recap.md`
- `qz-refine-spec.md`
- `qz-start-issue.md`
- `qz-verify.md`

### A definir por Qazuor

Agents:

- `gentle-ai-explore.md`
- `gentle-ai-verify.md`
- `gentle-ai-worker.md`
- `jd-fix-agent.md`
- `jd-judge-a.md`
- `jd-judge-b.md`
- `review-readability.md`
- `review-reliability.md`
- `review-resilience.md`
- `review-risk.md`

Prompts específicos de Hospeda:

- `hops-artifact-create.md`
- `hops-artifact-list.md`
- `hops-artifact-publish.md`
- `hops-artifact-state.md`
- `hops-artifact.md`
- `hops-back-merge.md`
- `hops-ci.md`
- `hops-close-issue.md`
- `hops-context.md`
- `hops-db-fresh.md`
- `hops-db-migrate.md`
- `hops-db-seed.md`
- `hops-db-start.md`
- `hops-db-stop.md`
- `hops-db-studio.md`
- `hops-db-update-template.md`
- `hops-dependabot-review.md`
- `hops-engram.md`
- `hops-env.md`
- `hops-gentle-sdd-status.md`
- `hops-gentle-status.md`
- `hops-handoff.md`
- `hops-issue-preflight.md`
- `hops-merge.md`
- `hops-promote.md`
- `hops-recap.md`
- `hops-run.md`
- `hops-servers-down.md`
- `hops-servers-up.md`
- `hops-smoke-plan.md`
- `hops-start-issue.md`
- `hops-stats.md`
- `hops-test.md`
- `hops-update.md`
- `hops-verify.md`
- `hops-wt-clean.md`

Estos prompts no se eliminan mediante la limpieza global: son específicos de Hospeda. Se evaluarán en el adapter de Hospeda; sólo se eliminarán si se confirma un reemplazo funcional versionado.

## Confirmación pendiente

La eliminación propuesta ya no se limita a los 62 elementos históricos: incluye todos los recursos con procedencia qz-kit, Gentle, Engram y Context7 descritos arriba. No se tocarán los elementos de `A EVALUAR` ni la memoria de Engram.

La cifra 62 corresponde al inventario inicial de qz-agent-kit. El inventario dinámico de OpenCode y Gentle Shell puede ser mayor porque ahora incorpora los recursos confirmados por los snapshots de Gentle AI y `managed-assets.json`. Los archivos de configuración Gentle (`opencode.json`, `AGENTS.md`, `tui.json`, plugins y temas) quedan marcados para eliminar; la reinstalación verificable es un prerrequisito de seguridad, no una razón para conservar copias antiguas.

Después de la confirmación se hará una limpieza respaldada y luego una instalación limpia de qz-agent-kit.
