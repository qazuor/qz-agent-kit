# Plan de paridad entre harnesses

Estado: plan aprobado para iniciar el relevamiento. Este documento no autoriza migraciones ni eliminaciones automáticas.

Fecha: 2026-09-30

## Propósito

Convertir el entorno actual de Claude Code y Hospeda en un ecosistema administrado por `qz-agent-kit`, con adapters para Claude Code, OpenCode, Codex y Gentle Shell.

La fuente de verdad será versionada. Cada harness recibirá una adaptación compatible con sus capacidades reales. Copiar un archivo a otra carpeta no se considerará una migración hasta que la capacidad haya sido probada.

## Decisiones de diseño

1. `AGENTS.md` será la instrucción común. `CLAUDE.md` se eliminará después de consolidar y validar su contenido.
2. `qz-agent-kit` contendrá capacidades reutilizables entre proyectos.
3. El adapter de Hospeda contendrá sólo conocimiento y workflows propios de Hospeda.
4. Los comandos deterministas vivirán en `qz` o `hops`; el command del harness sólo los invocará e interpretará.
5. Los skills especializados se cargarán bajo demanda.
6. Todo contenido administrado por qz tendrá manifiesto, plan, backup, aplicación, comprobación de drift y rollback.
7. Secretos, tokens y credenciales nunca formarán parte de la fuente de verdad ni serán copiados por el instalador.
8. Cada elemento existente se decidirá individualmente: migrar a todos, migrar a algunos, dejar sólo en Claude, adaptar, reemplazar o eliminar.
9. No se forzará paridad ficticia: una función se marcará como portable, adaptada, parcial, Claude-only, no soportada o eliminada.
10. `agents-sdk` y `sandbox-sdk` se conservan únicamente en Claude Code; no se proyectan desde qz-kit.
11. `go-testing` se elimina de los cuatro clientes.
12. El estilo conversacional común vive en qz-agent-kit y se adapta a los cuatro CLI; `gentleman.md` no será una excepción exclusiva de Claude.
13. Las reglas semánticas de permisos viven en qz-agent-kit y cada harness recibe un adapter verificable.

## Harnesses soportados

- Claude Code.
- OpenCode.
- Codex.
- Gentle Shell.

La paridad se evaluará por capacidad, no por nombre de archivo. Un command nativo de OpenCode no equivale necesariamente a un skill de Codex ni a un prompt de Gentle Shell.

## Inventario inicial conocido

### Hospeda `.claude/`

- 18 agentes personalizados.
- 21 comandos Markdown y un script auxiliar de recap.
- Aproximadamente 52 skills, incluyendo 16 específicos de Hospeda.
- 10 documentos de estándares y arquitectura.
- Configuración, permisos, hooks y guardrails.
- `linear.json`, `project.config.json` y `settings.json`.
- Auditorías, planes, reportes, templates, tareas y estados históricos.
- `CLAUDE.md` en raíz, apps y paquetes.

Agentes actuales:

```
astro-engineer
code-reviewer
content-writer
db-drizzle-engineer
debugger
design-cloner
design-reviewer
devops-engineer
hono-engineer
node-typescript-engineer
product-functional
product-technical
qa-engineer
react-senior-dev
tanstack-start-engineer
tech-lead
ux-ui-designer
```

Comandos actuales:

```
accessibility-audit
add-new-entity
check-deps
code-check
code-review
commit
design-review
five-why
format-markdown
generate-changelog
hops-stats
init-project
performance-audit
quality-check
recap
run-tests
security-audit
security-review
update-docs
```

Skills específicos de Hospeda:

```
hospeda-admin
hospeda-ai
hospeda-api
hospeda-auth
hospeda-billing
hospeda-config
hospeda-db
hospeda-email
hospeda-i18n
hospeda-media
hospeda-observability
hospeda-schemas
hospeda-seeding
hospeda-services
hospeda-ui
hospeda-web
```

Skills genéricos o candidatos a genéricos que requieren revisión:

```
accessibility-audit, api-app-testing, astro-patterns, ci-cd-patterns,
design-to-components, docker-patterns, drizzle-patterns, env-validation,
error-handling-patterns, frontend-design, git-commit-helper,
github-actions-patterns, hono-patterns, i18n-patterns, json-data-auditor,
markdown-formatter, mermaid-diagram-specialist, monorepo-patterns,
performance-audit, performance-testing, qa-criteria-validator,
react-patterns, react-performance, security-audit, security-testing,
seo-patterns, shadcn-specialist, smoke-tanda, tanstack-patterns,
tanstack-query-patterns, tanstack-router-patterns, tanstack-table-patterns,
tdd-methodology, tech-writing, web-app-testing, zod-patterns
```

### Cobertura qz existente

Ya existe una base portable para:

- `qz-start-issue` y `qz-close-issue`;
- `qz-recap`, `qz-handoff` y `qz-verify`;
- `qz-artifact`;
- wrappers de Engram;
- instalación de comandos, agentes y skills qz;
- fallback genérico cuando no hay adapter;
- adapter de Hospeda para Linear, worktrees, envs, DB, puertos y servidores.

Esto no significa que todo `.claude` esté migrado.

## Ficha obligatoria de cada componente

```
elemento
ruta actual
tipo
propósito real
frecuencia
cliente actual
dependencias
usa Git / Linear / specs / MCP
toca filesystem o estado externo
requiere permisos especiales
solapamientos
opciones de destino
decisión humana
adaptación necesaria
prueba requerida
riesgo
estado
```

Decisiones posibles:

```
MIGRAR_TODOS
MIGRAR_ALGUNOS
CLAUDE_ONLY
CONVERTIR_EN_SKILL
CONVERTIR_EN_COMMAND
CONVERTIR_EN_SCRIPT
REEMPLAZAR
ELIMINAR
PENDIENTE
```

## Fases de trabajo

### Fase 0 — Congelamiento e inventario

Documentar el estado sin alterar comportamiento:

- inventariar archivos y configuraciones locales y globales;
- buscar referencias para descubrir dependencias ocultas;
- excluir `node_modules` y archivos de terceros;
- registrar lo instalado en cada harness;
- generar manifiesto;
- conservar rollback.

Salida: inventario revisable sin cambios funcionales.

### Fase 1 — Instrucciones y conocimiento

Revisar:

- `CLAUDE.md` raíz;
- `CLAUDE.md` de apps y paquetes;
- `AGENTS.md`;
- `.claude/docs`;
- `.claude/guardrails.md`;
- documentación de workflows.

Cada bloque se decidirá como:

```
AGENTS.md
AGENTS.md de app o paquete
skill genérico
skill de Hospeda
documentación normal
command
agent
eliminado
```

No se elimina ningún `CLAUDE.md` antes de terminar esta fase y validar los cuatro clientes.

### Fase 2 — Commands

Revisar individualmente los comandos Claude.

Candidatos genéricos iniciales:

- recap, handoff, verify;
- start-issue, close-issue;
- run-tests, code-review, security-review;
- quality-check, format-markdown, check-deps;
- update-docs, commit, generate-changelog.

Candidatos de Hospeda:

- workflows `hops-*`;
- Linear HOS;
- worktrees con PostgreSQL;
- envs y template de DB;
- ramas `develop`, `staging`, `main`;
- servidores y puertos.

Cada command se probará en los cuatro harnesses o se marcará como parcial.

### Fase 3 — Skills

Separar skills genéricos y de Hospeda. Revisar duplicados de performance, security, testing, React/TanStack, documentación y QA/smoke. No se instalarán todos sólo por existir.

### Fase 4 — Agentes

Para cada agente decidir si:

- continúa;
- se fusiona;
- se convierte en skill;
- se convierte en command;
- se migra a todos;
- queda sólo en Claude;
- se elimina.

La hipótesis inicial es reducir los 17 agentes a pocos roles portables, dejando especialidades técnicas en skills.

### Fase 5 — MCP y servicios externos

Separar:

- MCP globales: Engram, Context7 y otros reutilizables;
- MCP de Hospeda: Linear y herramientas propias;
- MCP dependientes de Claude;
- MCP sin uso o redundantes.

El instalador gestionará manifiestos, no secretos, y cada cliente tendrá adapter para su formato.

### Fase 6 — Permisos, hooks y seguridad

Clasificar cada regla como:

```
permitir automáticamente
pedir autorización
prohibir
```

Las políticas comunes vivirán en qz y su aplicación será específica de cada adapter.

### Fase 7 — TUI

Definir política común para tema, notificaciones, sonido, mouse, scroll, Home/End, copiar mensajes, diff, statusline, atención y compactación. Cada adapter implementará sólo lo soportado, preservando configuración no administrada.

### Fase 8 — Validación

Cada capacidad migrada tendrá pruebas de instalación limpia, actualización, drift, rollback, ejecución manual, invocación desde el harness, permisos, errores y ausencia de secretos en logs.

### Fase 9 — Retiro progresivo de Claude

Sólo después de las decisiones:

1. consolidar `AGENTS.md`;
2. migrar lo aprobado;
3. validar los cuatro clientes;
4. eliminar `CLAUDE.md`;
5. retirar comandos y skills reemplazados;
6. eliminar agentes descartados;
7. conservar sólo lo realmente Claude-only;
8. documentar lo que no tenga equivalente.

## Orden de revisión humana

1. Instrucciones.
2. Comandos operativos.
3. Skills genéricos.
4. Agentes.
5. Permisos y hooks.
6. MCPs.
7. TUI.
8. Planes, reportes y tareas históricas.
9. Eliminación de `CLAUDE.md`.

Para cada elemento se presentará una ficha corta con propuesta y opciones. No se migrará automáticamente ningún componente pendiente.

## Primer bloque a revisar

El primer bloque será el contenido de:

- `./CLAUDE.md`;
- `./AGENTS.md`;
- `apps/admin/CLAUDE.md`;
- `apps/api/CLAUDE.md`;
- `apps/web/CLAUDE.md`;
- `packages/*/CLAUDE.md`.

Se clasificará cada sección, no sólo cada archivo. Una misma sección puede terminar en `AGENTS.md`, skill, documentación o eliminación.

## Criterio de finalización

La migración estará completa cuando:

- exista una fuente de verdad versionada;
- todos los componentes tengan decisión explícita;
- el instalador pueda aplicar y actualizar;
- no haya divergencia no registrada;
- los comandos funcionen o estén documentados como parciales;
- Hospeda conserve sus workflows;
- los cuatro harnesses hayan sido probados;
- `CLAUDE.md` se haya eliminado sin perder instrucciones;
- exista rollback documentado.

## Estado

- Plan: documentado.
- Migraciones nuevas en esta fase: ninguna.
- Eliminaciones en esta fase: ninguna.
- Inventario inicial: comenzado.
- Próximo paso: clasificar instrucciones, sección por sección.



## Decisiones humanas registradas — primer bloque

Fecha: 2026-09-30

- Project Overview y Technology Stack: **A** — resumen en `AGENTS.md`.
- Architecture: **A** — resumen en `AGENTS.md` y detalle en skill.
- API Route Architecture: **C** — skill específico de Hospeda.
- Key Commands: **pendiente de desglose** entre qz genérico y hops de Hospeda.
- Comandos `hops`: **pendiente de desglose** entre qz genérico y hops de Hospeda.
- Coding Standards: **A** — resumen en `AGENTS.md` y skill genérico.
- Testing Standards: **A** — invariantes en `AGENTS.md` y skills/commands de testing.
- Billing: **C** — skill específico de Hospeda.
- Git, ramas y PRs: **B** — reglas universales en qz/AGENTS y workflow de Hospeda separado.
- API, DB, Web y Admin: **seguir la recomendación** — skills específicos de Hospeda.
- Environment y secretos: **B** — skills, guards y scripts de Hospeda.
- Specs, Linear, Task Master y worktrees: **B** — separación en skills y commands de Hospeda.
- Common Gotchas y Recent Activity: **pendiente de inventario individual**.
- Legacy `.qtm`: **A** — nota documental histórica breve.

Estas decisiones sólo fijan el destino conceptual. Todavía no se movió, generó ni eliminó ningún componente.



## Decisiones humanas registradas — comandos y gotchas

Fecha: 2026-09-30

- Punto 4: aprobada la separación recomendada entre `qz` genérico, `hops` específico y wrappers híbridos.
- Punto 5: aprobada la migración de comandos deterministas a `qz`, los específicos a `hops`, y el reemplazo de `init-project`, `quality-check`, `recap` y `run-tests` cuando ya exista una implementación superior.
- Punto 13: aprobada la clasificación recomendada:
  - invariantes con guard/test a skills y verificaciones;
  - conocimiento técnico vigente a skills de Hospeda;
  - incidentes operativos a comandos y workflows;
  - actividad reciente a historial o eliminación;
  - no cargar gotchas directamente en `AGENTS.md`.

Próximo bloque: clasificación de los `CLAUDE.md` de apps y paquetes, empezando por `apps/admin/CLAUDE.md`.



## Decisiones humanas registradas — apps/admin/CLAUDE.md

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- Overview y estructura: `hospeda-admin`.
- Key Commands: explicación breve en `hospeda-admin`, ejecución en `qz`/ `hops`.
- Routing, páginas de entidades y factories: `hospeda-admin`.
- Tables, formularios y Shadcn: `hospeda-admin` con skills UI genéricos cuando corresponda.
- Auth y protected routes: separación `hospeda-auth` + integración en `hospeda-admin`.
- API client y endpoint conventions: `hospeda-admin` + `hospeda-api`.
- Deployment, healthchecks y SSR: `hospeda-deploy`, `hospeda-admin` y guards.
- Environment Variables: `hospeda-admin` + `hops-env`.
- FAQ y POI: mantener inicialmente en `hospeda-admin`.
- Common Gotchas: conservar sólo los vigentes, respaldados por guard/test o necesarios para operar.
- Recent Activity: historial o ADR; no cargarlo como contexto operativo.

Próximo bloque: `apps/api/CLAUDE.md`.



## Decisiones humanas registradas — apps/api/CLAUDE.md

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- Overview, estructura y comandos: `hospeda-api`, con ejecución en `qz`/`hops`.
- Route factories, middleware y arquitectura: `hospeda-api`.
- Auth, actors y permisos: `hospeda-auth` + integración en `hospeda-api`.
- Responses y errores: `hospeda-api` con documentación y guards.
- Services: `hospeda-api` + `hospeda-services`.
- OpenAPI y endpoints: `hospeda-api`.
- Deploy, env y rate limiting: separación entre `hospeda-deploy`, `hops-env` y `hospeda-api`.
- Testing: `qz-testing` + `hospeda-api` + guards.
- Entitlements y billing: `hospeda-billing`.
- AI moderation, Social y model sync: `hospeda-ai`.
- Destination Hierarchy: skill específico de Hospeda.
- Recent Activity: historial o ADR; no contexto operativo.

Próximo bloque: `apps/web/CLAUDE.md`.



## Decisiones humanas registradas — apps/web/CLAUDE.md

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- Overview, estructura y comandos: `hospeda-web`, con ejecución en `qz`/`hops`.
- Astro, rendering, islands y middleware: `hospeda-astro`.
- API integration y response transforms: `hospeda-web` + `hospeda-api`.
- Styling, tokens, fonts, themes y dark mode: `hospeda-ui` + skills de diseño.
- i18n: `hospeda-i18n`.
- Auth y protected routes: `hospeda-auth` + `hospeda-web`.
- SEO y JSON-LD: `hospeda-seo` adaptado a Astro.
- Componentes React e islands: `hospeda-astro` + skills React.
- Animaciones y componentes visuales: `hospeda-ui` + diseño genérico.
- Testing: separación `qz-testing`, `qz-web-testing` y `hospeda-web`.
- Deployment y environment: `hospeda-deploy` + `hops-env`.
- Reusable Patterns: `hospeda-web` y skills funcionales cuando corresponda.
- Common Gotchas: conservar sólo vigentes y respaldados.
- File Origins, Key Improvements y Recent Activity: documentación histórica, ADR o eliminación.

Próximo bloque: paquetes centrales `packages/db`, `packages/schemas` y `packages/service-core`.



## Decisiones humanas registradas — paquetes centrales

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

### packages/db

- CRUD, modelos y relaciones: `hospeda-db`.
- Migraciones: `hospeda-db` + guards.
- Template, extras y worktrees: `hops-db` + `hops-worktrees`.
- Destination hierarchy: `hospeda-destination`.
- Gotchas SQL: skill + guard.
- Recent Activity: historial o eliminación.

### packages/schemas

- Zod general: skill genérico `qz-validation`.
- Convenciones de entidades: `hospeda-schemas`.
- API schemas: `hospeda-api` + `hospeda-schemas`.
- Enums y additive-only: skill + guards.
- Destination hierarchy: `hospeda-destination`.
- Testing: `qz-testing`.
- Recent Activity: historial o eliminación.

### packages/service-core

- BaseCrudService, Result, ServiceError: `hospeda-services`.
- Permisos: `hospeda-auth` + `hospeda-services`.
- Hooks y transacciones: `hospeda-services`.
- Testing: `qz-testing` + `hospeda-services`.
- Destination hierarchy: `hospeda-destination`.
- Promo codes y entitlements: `hospeda-billing`.
- Moderation: `hospeda-moderation`.
- Social automation: `hospeda-ai`.
- ImportContext: `hospeda-services`.
- Recent Activity: historial o eliminación.

Próximo bloque: billing, auth, seed e i18n.



## Decisiones humanas registradas — billing, auth, seed e i18n

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

### Billing

- Contenido vigente: `hospeda-billing`.
- Límites y entitlements: skill + guards.
- MercadoPago: `hospeda-billing`.
- Recent Activity: historial o eliminación.

### Auth UI

- Integración dentro de `hospeda-auth`.
- No crear un skill separado salvo que el paquete crezca.
- Testing: `qz-testing` + `hospeda-auth`.
- Recent Activity: historial o eliminación.

### Seed

- Infraestructura genérica: `qz-seeding`.
- Datos y reglas de Hospeda: `hospeda-seeding`.
- Cloudinary: `hospeda-media`.
- Dual-write: guard obligatorio + `hospeda-seeding`.
- Billing fixtures: `hospeda-billing`.
- Destination hierarchy: `hospeda-destination`.
- Permisos y usuarios: `hospeda-auth`.
- Históricos HOS/SPEC: documentación o eliminación.
- Template/reset: `hops-db`.

### i18n

- Conceptos generales: `qz-i18n`.
- Locales y convenciones: `hospeda-i18n`.
- React y Astro: `hospeda-i18n`.
- Generación de tipos: `hospeda-i18n` + guard.
- PT-BR: `hospeda-i18n`.
- Recent Activity: historial o eliminación.

Próximo bloque: paquetes de soporte.



## Decisiones humanas registradas — paquetes de soporte

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- Email: `hospeda-email`.
- Media y Cloudinary: `hospeda-media`.
- Notifications: `hospeda-notifications` si maneja más que email; si no, queda integrado en email.
- Config: separación `qz-config` + `hospeda-config`.
- Logger: separación `qz-logging` + `hospeda-observability`.
- Icons y Tailwind: `hospeda-ui`.
- Utils: no crear un skill grande; documentar sólo helpers no obvios.
- AI core: `hospeda-ai`, con posible núcleo `qz-ai-providers`.
- TypeScript config: separación `qz-typescript` + `hospeda-config`.

Con esto se completó la revisión de instrucciones de apps y paquetes.
Próximo bloque: agentes de `.claude/agents`.



## Decisiones humanas registradas — agentes

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- `astro-engineer`: convertir en skill `hospeda-astro`.
- `code-reviewer`: migrar como `qz-reviewer`.
- `content-writer`: skill `qz-content`, sin agente dedicado.
- `db-drizzle-engineer`: convertir en skill `hospeda-db`.
- `debugger`: migrar como `qz-debugger`.
- `design-cloner`: `qz-design-cloner` con capacidades opcionales.
- `design-reviewer`: `qz-design-reviewer` opcional.
- `devops-engineer`: `qz-devops` + skills de Hospeda.
- `hono-engineer`: conocimiento en `hospeda-api`, sin agente dedicado.
- `node-typescript-engineer`: integrar en un implementador general.
- `product-functional`: reemplazar por artifacts + Linear.
- `product-technical`: integrar en artifacts + Linear.
- `qa-engineer`: migrar como `qz-verifier`.
- `react-senior-dev`: skill `qz-react`, limpiado de referencias a Next.js.
- `tanstack-start-engineer`: integrar en `hospeda-admin`.
- `tech-lead`: reemplazar por `qz-reviewer` y skills; no conservar coordinador amplio.
- `ux-ui-designer`: integrar en `qz-frontend-design`.

Roles portables resultantes: revisión, debugging, verificación, devops, diseño visual y posiblemente implementación/arquitectura.
Próximo bloque: comandos de `.claude/commands`.



## Decisiones humanas registradas — comandos

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- Auditorías portables: `qz-accessibility`, `qz-performance`, `qz-security-audit`, `qz-security-review`.
- Checks y tooling: `qz-check`, `qz-deps`, `qz-format`, `qz-test`, `qz-verify`.
- Workflow: `qz-recap`, `qz-review`, `qz-commit`, `qz-docs`, `qz-changelog`.
- Root cause: skill/técnica `qz-root-cause`.
- `hops-add-entity`, `hops-stats` y wrappers de Hospeda: adapter.
- `init-project`: reemplazar por `qz-kit project init/install`.
- `quality-check`, `recap` y `run-tests`: reemplazar por las implementaciones qz existentes.
- `recap-scan.sh`: implementación interna, no command visible.

Próximo bloque: skills de `.claude/skills`.



## Decisiones humanas registradas — skills

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- Skills portables: migrar a `qz-agent-kit`.
- Skills duplicados: consolidar.
- Referencias a Next.js: corregir o eliminar cuando no apliquen.
- `smoke-tanda`: convertir en `hops-smoke`.
- `qa-criteria-validator`: absorber en `qz-qa`/`qz-verify`.
- Skills específicos de Hospeda: permanecer en el adapter.
- Instalación: condicional según stack, perfil y dependencias.
- Metadata: declarar compatibilidad, dependencias, herramientas y costo de contexto.

Próximo bloque: settings, permisos, hooks y guardrails de Claude.



## Decisiones humanas registradas — settings, hooks y guardrails

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- `settings.json`: política declarativa qz + adapter de Hospeda.
- Force push/amend: guardrails genéricos.
- main/staging/develop y promociones: `hops-git`/`hops-release`.
- GR-001: `qz-verify`.
- GR-002: eliminar y reemplazar por `qz-issue-preflight`.
- GR-003: `qz-handoff`/`qz-recap`.
- GR-004: `qz-git`, como recomendación configurable.
- Husky: propiedad del proyecto; qz sólo instala fragmentos administrados.
- post-checkout: reemplazar dependencia de `.claude/sessions` por `.qz/project.json`.
- Guards de código: permanecen en Hospeda o pasan a qz sólo si son verdaderamente genéricos.
- Workflows GitHub: no se instalan globalmente; se verifican o distribuyen como templates explícitos.

Próximo bloque: MCPs y configuración TUI.



## Decisiones humanas registradas — MCPs y TUI

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- Context7 y Engram: MCPs globales administrados por qz.
- Git: MCP global limitado al workspace.
- Filesystem: opcional y limitado al workspace.
- Playwright: opcional por proyecto.
- JSON: opcional, no base.
- Sequential Thinking: no instalar por defecto.
- Perplexity: opcional con secreto externo.
- 21st Magic: opcional, no base.
- Neon: fuera del stack de Hospeda.
- Linear: adapter de Hospeda, con CLI/API como fuente operativa.
- Credenciales literales: no reutilizar; requieren saneamiento y rotación.
- TUI: política común de intención y adapters independientes por harness.
- Aplicación: plan, backup, drift y rollback.

Próximo bloque: auditorías, planes, reportes, tareas, templates, gaps y archivos históricos de `.claude`.



## Decisiones humanas registradas — auditorías, planes, reportes, tareas y templates

Fecha: 2026-09-30

Se aprobaron todas las recomendaciones:

- `.claude/docs`: migrar conocimiento vigente a skills/docs qz y Hospeda.
- `development-workflow.md`: reescribir alrededor de ODD; SDD sólo por pedido explícito.
- Auditorías Admin: documentación/ADR/archive, no contexto automático.
- `gaps-descartados.md`: historial o eliminación.
- `gaps-postergados.md`: reconciliar con Linear; no fuente local.
- Plans y reports: archive si conservan valor; no skills.
- Tasks: reconciliar con Linear y `.specs/HOS-*`; no migrar estados históricos como contexto.
- Templates: reemplazar generación de `CLAUDE.md` por `AGENTS.md` y `.qz/project.json`.
- `test-categories.json`: manifest neutral si sigue siendo usado.
- Worktree env example: adapter de Hospeda.
- `linear.json`: consolidar en `.qz/project.json`.
- Referencias a `CLAUDE.md`: actualizar antes de eliminar los archivos.

Fase de decisiones conceptuales: completa.
Próximo bloque: matriz consolidada de migración.
