# Revisión de limpieza de clientes CLI

Fecha del relevamiento: 2026-10-01  
Modo: solo lectura  
Clientes revisados: OpenCode, Claude Code, Codex y Gentle Shell

Este informe separa los recursos administrados por `qz-agent-kit` de los recursos externos. No se eliminó ningún archivo.

## Resumen

| Cliente | Recursos propuestos para eliminar | Recursos externos a revisar |
|---|---:|---:|
| OpenCode | 14 | 54 |
| Claude Code | 20 | 639 |
| Codex | 14 | 419 |
| Gentle Shell | 14 | 48 |
| **Total** | **62** | **1160** |

Los 62 recursos de la primera columna son archivos administrados por qz-agent-kit o equivalentes legacy que serán reemplazados por la instalación limpia. Los 1160 restantes requieren evaluación humana y no forman parte de la eliminación automática.

Credenciales, tokens, historiales, sesiones, bases de datos, caches y archivos sensibles quedaron fuera del inventario de eliminación.

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

Estos recursos deben pasar a la lista de eliminación **condicionada a una reinstalación exitosa de Gentle AI**. No deben borrarse mediante una instalación de qz-agent-kit solamente, porque qz-agent-kit actualmente no los genera.

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

Recomendación: conservarlos inicialmente y revisar luego los SDD, porque ODD es el flujo principal definido para el entorno.

## Claude Code

### Verificación de procedencia Gentle AI

No hay entradas de Claude Code en ninguno de los snapshots nativos de Gentle AI inspeccionados. Por lo tanto, los recursos externos de Claude no se pasan a eliminación por este motivo; siguen requiriendo una decisión independiente.

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

No hay entradas de Codex en ninguno de los snapshots nativos de Gentle AI inspeccionados. Sus skills externos no se pasan a eliminación por este motivo; siguen requiriendo una decisión independiente.

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

El manifiesto `~/.gentle-shell/agent/gentle-ai/managed-assets.json` confirma como administrados por Gentle los siguientes recursos. Deben pasar a la eliminación condicionada a una reinstalación correcta de Gentle Shell:

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

Estos dos archivos son configuración de Gentle Shell y no aparecen en el inventario estándar de commands/skills/agents/prompts; también deben limpiarse únicamente después de comprobar que la reinstalación de Gentle los regenera correctamente.

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

Estos prompts no se eliminan ahora: son específicos de Hospeda y no todos tienen equivalente genérico en qz-agent-kit.

## Confirmación pendiente

La eliminación propuesta se limita a los 62 elementos de las secciones `Eliminar`. No se tocarán los elementos de `A definir por Qazuor`.

Después de la confirmación se hará una limpieza respaldada y luego una instalación limpia de qz-agent-kit.
