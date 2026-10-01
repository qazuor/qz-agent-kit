# Revisión de memorias de trabajo y specs

Esta lista registra el criterio aplicado al segundo recorte de `MEMORY.md` de
Hospeda. No copia cuerpos de memorias: los detalles de trabajo deben vivir en
Linear, `.specs`, PRs o documentación del proyecto.

## Retiradas por estar cerradas o reemplazadas

- `dependabot-prod-group-shard4-mine.md`: incidente de Dependabot cerrado;
  queda cubierto por el flujo actual de revisión de Dependabot y CI.
- `dependabot-security-routing.md`: política ya documentada en
  `docs/guides/dependabot-policy.md`.
- `nospec-already-host.md`: cambio mergeado y cubierto por tests.
- `safefetch-undici7-prod-bug.md`: bug corregido; no queda una decisión activa.
- `spec-222-smoke.md`: smoke histórico y resuelto.
- `spec-237-staging-smoke.md`: resultados incorporados a la documentación y
  ADR de reputación externa.
- `spec-250-async-reputation-refresh.md`: completado y archivado.
- `spec-258-import-followup.md`: cerrado; el trabajo restante fue separado en
  SPEC-277.
- `spec-security-vite-audit-gate.md`: gate corregido; no queda una acción
  pendiente en esa memoria.
- `spec-allocation-atomic-lock.md` y `spec-279-cross-user-renumber.md`: el
  sistema de numeración local fue retirado; Linear es la fuente de IDs.

## Conservadas temporalmente

Se conservan las memorias de specs con PR abierto, draft, preguntas del dueño,
smoke pendiente, bloqueo de Dependabot o decisiones todavía no representadas
por una fuente normativa. No se promueven automáticamente a skills porque eso
crearía instrucciones obsoletas y duplicaría el sistema de specs.

También quedan para revisión específica:

- `tooling-codegraph.md`: promovida al skill `hops-codegraph` del adapter;
  la configuración MCP sigue siendo externa y opcional.
- `local-dev-setup.md`: promovida al skill `hops-local-dev`; se eliminaron los
  valores locales y credenciales del origen.
- `gotcha_coolify_v4_ops.md`: promovida de forma sanitizada al skill
  `hops-ci-operations`; los datos de infraestructura quedaron fuera.
- `project-panel-nuevas-secciones-design.md`: referencia de planificación ya
  formalizada en SPEC-239..243. La única línea aún visible como diseño activo
  es SPEC-243 en `.qtm/specs/SPEC-243-mobile-app`; SPEC-075 ya fue absorbida por
  `hospeda-web`.
- Las dos memorias de MercadoPago siguen bloqueadas por posible contenido
  sensible y no se leen ni se eliminan automáticamente.

En esta tanda se promovieron y retiraron las memorias de `SPEC-200`, `SPEC-247`,
`SPEC-264`, `SPEC-265`, `spec-refinement-batch`, `linear-backlog-command.md` y
`validate-bash-env-local.md`. El equivalente portable de backlog ahora vive en
`qz-linear-backlog` y el refinamiento en `qz-refine-spec`; el adapter de Hospeda
los conecta con su configuración declarativa. También se retiró
`project-panel-nuevas-secciones-design.md`: su contenido ya está formalizado en
`.qtm/specs` y el resto era contexto histórico de diseño.

El último escaneo registró 3 archivos, cero duplicados exactos y dos archivos
bloqueados por sensibilidad.
