# Matriz consolidada de migración de harnesses

Estado: decisiones aprobadas; implementación pendiente.

Fecha: 2026-09-30

Esta matriz registra qué hacer con cada componente de Claude/Hospeda. No implica que el componente ya haya sido movido. El estado inicial de todas las filas es `DECIDED_NOT_MIGRATED`.

## Estados

| Estado | Significado |
|---|---|
| DECIDED_NOT_MIGRATED | decisión tomada, contenido aún en su ubicación original |
| INVENTORY | falta verificar dependencias o referencias |
| ADAPT | requiere reescritura o traducción |
| TEST | adaptado y pendiente de pruebas |
| MIGRATED | migrado y validado en los harnesses declarados |
| CLAUDE_ONLY | se conserva sólo para Claude |
| REPLACE | será reemplazado por otra capacidad |
| ARCHIVE | se conserva como documentación, fuera del contexto operativo |
| DELETE_AFTER_CHECK | se elimina después de verificar referencias |
| BLOCKED | depende de una decisión o capacidad externa |

## Harnesses

| Código | Cliente |
|---|---|
| CC | Claude Code |
| OC | OpenCode |
| CX | Codex |
| GS | Gentle Shell |

## Instrucciones

| Fuente actual | Destino | Alcance | Adaptación | Estado |
|---|---|---|---|---|
| `CLAUDE.md` raíz | `AGENTS.md` + skills/docs | Hospeda | separar reglas universales de conocimiento especializado | DECIDED_NOT_MIGRATED |
| `apps/admin/CLAUDE.md` | `hospeda-admin`, `hospeda-auth`, `hospeda-deploy` | Hospeda | dividir por dominio | DECIDED_NOT_MIGRATED |
| `apps/api/CLAUDE.md` | `hospeda-api`, `hospeda-auth`, `hospeda-services`, `hospeda-billing`, `hospeda-ai` | Hospeda | dividir por dominio | DECIDED_NOT_MIGRATED |
| `apps/web/CLAUDE.md` | `hospeda-web`, `hospeda-astro`, `hospeda-ui`, `hospeda-seo`, `hospeda-i18n` | Hospeda | adaptar Astro y eliminar referencias incompatibles | DECIDED_NOT_MIGRATED |
| `packages/*/CLAUDE.md` | skills qz/Hospeda y docs | mixto | separar paquete, dominio e invariantes | DECIDED_NOT_MIGRATED |
| todos los `CLAUDE.md` | eliminación posterior | todos | actualizar referencias y validar lectura de AGENTS | DELETE_AFTER_CHECK |

## Agentes

| Agente actual | Destino | Decisión |
|---|---|---|
| astro-engineer | `hospeda-astro` | convertir en skill |
| code-reviewer | `qz-reviewer` | agente portable |
| content-writer | `qz-content` | skill, sin agente dedicado |
| db-drizzle-engineer | `hospeda-db` | convertir en skill |
| debugger | `qz-debugger` | agente portable |
| design-cloner | `qz-design-cloner` | agente opcional |
| design-reviewer | `qz-design-reviewer` | agente opcional |
| devops-engineer | `qz-devops` + skills Hospeda | agente portable + adapter |
| hono-engineer | `hospeda-api` | convertir en skill |
| node-typescript-engineer | implementador general | fusionar |
| product-functional | artifacts + Linear | reemplazar |
| product-technical | artifacts + Linear | reemplazar |
| qa-engineer | `qz-verifier` | agente portable |
| react-senior-dev | `qz-react` | convertir en skill, limpiar Next.js |
| tanstack-start-engineer | `hospeda-admin` | convertir en skill |
| tech-lead | `qz-reviewer` + skills | reemplazar agente amplio |
| ux-ui-designer | `qz-frontend-design` | convertir en skill |

## Commands

| Command actual | Destino | Decisión |
|---|---|---|
| accessibility-audit | `qz-accessibility` | migrar, browser opcional |
| add-new-entity | `hops-add-entity` | Hospeda con fallback futuro |
| check-deps | `qz-deps` | migrar |
| code-check | `qz-check` | migrar |
| code-review | `qz-review` | reemplazar con wrapper portable |
| commit | `qz-commit` + `hops-git` | migrar/adaptar |
| design-review | `qz-design-review` | migrar, browser opcional |
| five-why | `qz-root-cause` | convertir en skill |
| format-markdown | `qz-format` | migrar |
| generate-changelog | `qz-changelog` | migrar |
| hops-stats | `hops-stats` | conservar como Hospeda |
| init-project | `qz-kit project init/install` | reemplazar |
| performance-audit | `qz-performance` | consolidar |
| quality-check | `qz-verify` | reemplazar |
| recap | `qz-recap` | reemplazar |
| run-tests | `qz-test` | reemplazar |
| security-audit | `qz-security-audit` | migrar |
| security-review | `qz-security-review` | migrar |
| update-docs | `qz-docs` | migrar |
| recap-scan.sh | implementación de `qz-recap` | dejar interno |

## Commands qz/hops del adapter

| Capacidad | Destino | Alcance |
|---|---|---|
| start issue genérico | `qz-start-issue` | qz |
| start issue Hospeda | `hops-start-issue` | Hospeda |
| close issue genérico | `qz-close-issue` | qz |
| close issue Hospeda | `hops-close-issue` | Hospeda |
| recap | `qz-recap` | qz |
| handoff | `qz-handoff` | qz |
| verify | `qz-verify` | qz |
| artifact | `qz-artifact` | qz |
| DB | `hops-db` | Hospeda |
| env | `hops-env` | Hospeda |
| servers | `hops-servers` | Hospeda |
| worktree cleanup | `hops-wt-clean` | Hospeda |
| smoke plan | `hops-smoke-plan` | Hospeda |
| Linear | `hops-linear` | Hospeda |
| stats | `hops-stats` | Hospeda |

## Skills genéricos

## Decisiones nuevas de portabilidad

| Recurso | Destino | Alcance | Estado |
|---|---|---|---|
| `agents-sdk` | conservar sin copiar | Claude Code | CLAUDE_ONLY |
| `sandbox-sdk` | conservar sin copiar | Claude Code | CLAUDE_ONLY |
| `go-testing` | retirar | todos los clientes | DELETE_AFTER_CHECK |
| `gentleman.md` | reemplazar por `qz-output-style` | todos los clientes | ADAPT |
| Output style común | `source/skills/qz-output-style/SKILL.md` + adapters | cuatro CLI | TEST |
| Rules y permisos | `source/skills/qz-permissions/SKILL.md` + guards/adapters | cuatro CLI | ADAPT |
| Claude `synced` | descomponer e inventariar | Claude Code | INVENTORY |
| Hooks/plugins no atribuidos | inventariar individualmente | cliente original | INVENTORY |
| Skills/agentes Hospeda no `hops-*` | clasificar por archivo | adapter Hospeda o qz | INVENTORY |
| Código externo del usuario | identificar procedencia y uso | cliente original | INVENTORY |

| Skill actual/grupo | Destino |
|---|---|
| astro-patterns | `qz-astro`, con adaptación para Hospeda |
| drizzle-patterns | `qz-drizzle` |
| hono-patterns | `qz-hono` |
| tanstack-* | `qz-tanstack` modular |
| react-patterns | `qz-react` |
| react-performance | `qz-react`, limpiar Next.js |
| zod-patterns | `qz-validation` |
| docker-patterns | `qz-docker` |
| api-app-testing | `qz-testing` |
| web-app-testing | `qz-web-testing` |
| tdd-methodology | `qz-testing` |
| qa-criteria-validator | absorber en `qz-qa`/`qz-verify` |
| accessibility-audit | `qz-accessibility` |
| security-audit | `qz-security` |
| security-testing | `qz-security` |
| performance-audit | `qz-performance` |
| performance-testing | `qz-performance` |
| frontend-design | `qz-frontend-design` |
| design-to-components | `qz-component-design` |
| shadcn-specialist | `qz-shadcn`, opcional |
| i18n-patterns | `qz-i18n`, limpiar Next.js |
| seo-patterns | `qz-seo-concepts`, limpiar Next.js |
| markdown-formatter | `qz-docs` |
| tech-writing | `qz-docs` |
| mermaid-diagram-specialist | `qz-docs` |
| json-data-auditor | `qz-docs` |
| monorepo-patterns | `qz-monorepo` |
| git-commit-helper | absorber en `qz-commit` |
| ci-cd-patterns | `qz-ci` |
| github-actions-patterns | `qz-ci` |
| smoke-tanda | `hops-smoke` |

## Skills de Hospeda

Se conservan en el adapter:

```
hospeda-admin
hospeda-ai
hospeda-api
hospeda-auth
hospeda-billing
hospeda-config
hospeda-db
hospeda-destination
hospeda-email
hospeda-i18n
hospeda-media
hospeda-moderation
hospeda-observability
hospeda-schemas
hospeda-seeding
hospeda-services
hospeda-ui
hospeda-web
hospeda-astro
hospeda-seo
hospeda-deploy
hops-env
hops-db
hops-worktrees
```

## Configuración y seguridad

| Elemento | Destino | Decisión |
|---|---|---|
| `.claude/settings.json` | política qz + adapter | traducir por harness |
| force push/amend | qz | guard genérico |
| main/staging/develop | hops-git/hops-release | Hospeda |
| GR-001 | qz-verify | migrar |
| GR-002 | qz-issue-preflight | reemplazar |
| GR-003 | qz-handoff/qz-recap | migrar |
| GR-004 | qz-git | migrar como recomendación configurable |
| Husky | repositorio | mantener como propiedad del proyecto |
| post-checkout | .qz/project.json | reemplazar dependencia de .claude |
| guards de código | Hospeda o qz si son genéricos | clasificar por alcance |
| workflows GitHub | repositorio/adapter | no instalar globalmente |

## MCP

| MCP | Alcance | Decisión |
|---|---|---|
| Context7 | global | qz-agent-kit |
| Engram | global | qz-agent-kit, backup estricto |
| Git | global limitado | qz-agent-kit |
| Filesystem | opcional limitado | qz-agent-kit |
| Playwright | opcional por proyecto | adapter |
| JSON | opcional | no base |
| Sequential Thinking | no instalar por defecto | excluir |
| Perplexity | opcional | secreto externo |
| 21st Magic | opcional | no base |
| Neon | proyecto externo | fuera de Hospeda |
| Linear | Hospeda | adapter, CLI/API principal |

Advertencia: `.vscode/mcp.json` contiene configuraciones con credenciales literales. Antes de reutilizarlo hay que sanearlo y rotar credenciales. No se copiarán esos valores.

## TUI

| Intención común | Implementación |
|---|---|
| tema oscuro | adapter por harness |
| selector de tema | sólo donde exista |
| notificaciones visuales | adapter |
| sonido apagado | adapter |
| Home/End | keybinds nativos por harness |
| Ctrl+Home/Ctrl+End | sólo donde esté soportado |
| mouse/scroll | validar interactivamente |
| statusline | adapter específico |
| diff | adapter específico |

No se copiará el `tui.json` de OpenCode a los otros clientes.

## Documentación e históricos

| Elemento | Destino |
|---|---|
| `.claude/docs` vigente | skills/docs qz y Hospeda |
| `development-workflow.md` | reescribir para ODD |
| auditoría Admin | docs/ADR/archive |
| propuestas superseded | archive |
| `gaps-descartados.md` | archive o eliminar |
| `gaps-postergados.md` | reconciliar con Linear |
| plans | archive si aún explican decisiones |
| reports | archive, no contexto automático |
| tasks antiguas | Linear + .specs/HOS; no migrar como contexto |
| project template | qz AGENTS + .qz/project.json |
| brand template | qz o Hospeda según alcance |
| test-categories | .qz manifest si sigue usado |
| worktree env example | adapter Hospeda |
| linear.json | consolidar en .qz/project.json |
| Recent Activity | historial/ADR/eliminación |

## Orden de implementación

1. crear manifests de fuente de verdad;
2. implementar metadata de skills, commands, agents y MCP;
3. adaptar instrucciones a `AGENTS.md`;
4. migrar commands qz;
5. migrar skills qz;
6. migrar skills Hospeda;
7. adaptar agentes reducidos;
8. implementar configuración TUI;
9. implementar MCP manifests;
10. actualizar referencias de `CLAUDE.md`;
11. validar los cuatro harnesses;
12. eliminar/reubicar contenido aprobado;
13. ejecutar instalación limpia de prueba;
14. probar update, drift y rollback.

## Regla de aprobación

Ninguna fila pasa de `DECIDED_NOT_MIGRATED` a `MIGRATED` sin:

- fuente versionada;
- adapter correspondiente;
- prueba en los clientes declarados;
- verificación de permisos;
- documentación;
- rollback;
- confirmación de que no se copiaron secretos.
