# Revisión de memoria Claude: feedback y gotchas

Esta revisión usa sólo nombres, metadata y contenido no sensible de la memoria
de Hospeda. Las dos memorias relacionadas con
credenciales de MercadoPago quedan bloqueadas para revisión separada.

## Promoción completada

Las siguientes cinco memorias genéricas ya fueron incorporadas a la fuente de
verdad (`source/instructions/AGENTS.md`, `source/skills/qz-safety/SKILL.md` y
`source/guards/qz-workflow-policy.sh`), verificadas con el smoke del paquete y
eliminadas de la memoria local de Claude:

- `feedback_commit_workflow.md`
- `feedback-no-ai-attribution-in-prs.md`
- `feedback-no-concurrent-heavy-tasks.md`
- `feedback-background-agents-can-commit-after-completion.md`
- `gotcha-conflicting-pr-blocks-ci.md`

No se conservaron copias de sus cuerpos. Después de esa promoción también se
retiraron siete entradas históricas que ya tenían fuente de verdad en el repo o
que describían cambios cerrados: los dos registros de routing de Dependabot,
`nospec-already-host.md`, `safefetch-undici7-prod-bug.md`, `spec-222-smoke.md`,
`spec-237-staging-smoke.md`, `spec-250-async-reputation-refresh.md`,
`spec-258-import-followup.md` y `spec-security-vite-audit-gate.md`.
El escaneo posterior de esta revisión quedó en 11 archivos, sin duplicados exactos y con las dos
memorias sensibles todavía bloqueadas.

Las specs que siguen abiertas, en draft, ligadas a PRs pendientes o sin una
fuente normativa equivalente se conservan temporalmente. No se copian sus
relatos históricos a skills: su fuente debe seguir siendo Linear, `.specs` o el
PR correspondiente.

## Decisiones propuestas

| Memoria | Destino recomendado | Acción | Motivo |
|---|---|---|---|
| `feedback_commit_workflow.md` | `qz` guard + instrucción universal | Promover y luego eliminar origen | Regla universal: no crear commits antes de confirmación humana. Puede validarse con política y revisión de estado. |
| `feedback_git_workflow.md` | Skill/guard del adapter Hospeda | Adaptar antes de promover | La memoria describe `staging` como base, pero el flujo actual incorpora `develop`. No debe copiarse sin actualizar. |
| `feedback_hono_router_collision.md` | Skill Hospeda API/Hono | Promover y luego eliminar origen | Conocimiento técnico estable para pruebas de rutas; no es regla global ni guard suficiente por sí solo. |
| `feedback_hops_target_flag.md` | Guard y skill `hops` | Promover y luego eliminar origen | El uso posicional puede apuntar silenciosamente a producción. Debe quedar como validación determinista. |
| `feedback-admin-welcome-guide.md` | Skill de smoke/admin o documentación | Revisar vigencia y promover si sigue ocurriendo | Es una explicación operativa útil, pero puede volverse obsoleta si cambia el onboarding. |
| `feedback-background-agents-can-commit-after-completion.md` | Guard universal de agentes | Promover y luego eliminar origen | Requiere auditar `git status` y `git log` después de agentes en background. |
| `feedback-linear-label-kind-spec-vs-needs-spec.md` | Skill + guard Linear/Hospeda | Promover y luego eliminar origen | La relación entre label y existencia de `spec.md` es verificable. |
| `feedback-linear-ready-for-qa.md` | Guard del workflow Linear Hospeda | Promover y luego eliminar origen | El estado depende de si el agente implementó el cambio o sólo verificó uno existente. |
| `feedback-no-ai-attribution-in-prs.md` | Guard universal de commits/PRs | Promover y luego eliminar origen | Puede verificarse sobre mensajes y cuerpos antes de publicar. |
| `feedback-no-concurrent-heavy-tasks.md` | Guard universal de ejecución | Promover y luego eliminar origen | Protege la máquina y debe formar parte de la política de ejecución de todos los CLI. |
| `feedback-worktree-defer-to-impl.md` | Skill/guard de specs y worktrees Hospeda | Adaptar antes de promover | La regla sigue siendo válida, pero su branch base y comandos deben reflejar `develop`. |
| `gotcha_bun_pipe_stdout_cascade.md` | Skill de tooling Bun | Promover y luego eliminar origen | Es conocimiento técnico estable para wrappers Bun, aunque no requiere un guard global. |
| `gotcha_coolify_v4_ops.md` | Documentación privada/skill de infraestructura | Revisión manual obligatoria | Contiene detalles operativos de producción y referencias a autenticación. No se debe propagar automáticamente. |
| `gotcha-closeissue-missing-billing-smoke-gate.md` | Guard de `hops-close-issue` | Promover y luego eliminar origen | Es exactamente el tipo de fallo que debe impedir cerrar una issue sin smoke requerido. |
| `gotcha-conflicting-pr-blocks-ci.md` | Skill/guard GitHub CI | Promover y luego eliminar origen | El estado `CONFLICTING` debe diagnosticarse antes de reintentar CI. |
| `gotcha-wtup-mp-env-no-prefix.md` | Guard de env/worktree Hospeda | Promover y luego eliminar origen | El error de nombres puede detectarse comparando el env generado contra el registro. |
| `gotcha_mercadopago_credentials.md` | Ningún destino automático | Bloquear | El nombre y el tema son sensibles; requiere revisión manual y nunca debe entrar en skills o Engram sin sanitización. |
| `gotcha_mercadopago_test_credentials_architecture.md` | Ningún destino automático | Bloquear | Puede contener arquitectura de credenciales de prueba; sólo se evaluará después de una revisión específica. |

## Reglas de limpieza

Una memoria marcada como “promover y luego eliminar” no se borra ahora. La
secuencia será:

1. actualizar el destino normativo;
2. ejecutar sus validaciones;
3. verificar que el CLI puede leer el destino;
4. registrar fingerprint y destino;
5. eliminar el archivo de memoria y su entrada del índice de Claude;
6. volver a escanear para comprobar que no reapareció.

Las memorias bloqueadas no se copian ni se eliminan durante esta tanda.

## Observaciones de vigencia

- `feedback_git_workflow.md` y `feedback_worktree-defer-to-impl.md` no pueden
  promoverse literalmente porque el proyecto ahora usa `develop` como base
  predeterminada.
- Las reglas de Linear y `closeIssue` deben quedar en el adapter de Hospeda,
  no en `qz-agent-kit` genérico.
- Las reglas de commit, atribución de IA, concurrencia y auditoría de agentes
  sí son candidatas a la capa genérica.
- Los gotchas de Bun, Hono, Coolify y MercadoPago pertenecen a skills o
  guards específicos; no deben inflar `AGENTS.md` global.
