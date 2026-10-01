---
name: qz-cloudflare
description: Trabajo portable con Cloudflare Workers, Pages, D1, KV, R2, Durable Objects, Queues, Workflows, Workers AI y Wrangler. Cargar sólo cuando la tarea use Cloudflare.
---

# Cloudflare portable

Esta skill concentra las reglas comunes que antes estaban distribuidas en varias
skills de Claude. Antes de afirmar una API, límite, precio o flag, consultar la
documentación oficial actual de Cloudflare y el schema de Wrangler instalado.

## Selección rápida

- HTTP stateless o edge function: Workers.
- Sitio estático/full-stack con deploy: Pages.
- Estado fuerte por entidad, coordinación, alarmas o WebSockets: Durable Objects.
- SQL SQLite administrado: D1.
- KV, cache o configuración: KV.
- Objetos y archivos: R2.
- Trabajo asíncrono: Queues o Workflows.
- Inferencia/embeddings: Workers AI o Vectorize.

## Reglas de implementación

- Preferir `wrangler.jsonc` y una `compatibility_date` explícita.
- Generar tipos con `wrangler types`; no escribir interfaces de bindings a mano.
- Usar bindings internos antes que REST público para KV, R2, D1, Queues y servicios.
- No guardar secretos en código ni en configuración versionada; usar `wrangler secret`.
- No guardar estado de una request en variables globales.
- Toda promesa debe ser `await`, `return`, `void` o `ctx.waitUntil(...)`.
- Validar migraciones de Durable Objects antes del deploy y probarlas localmente.
- Separar ambientes y revisar los cambios con `wrangler deploy --dry-run` cuando aplique.

## Verificación

1. Leer la documentación oficial del producto usado.
2. Revisar el schema de Wrangler y las versiones reales del proyecto.
3. Ejecutar los checks declarados por el proyecto.
4. Informar qué se verificó y qué depende de documentación externa.

Fuentes principales: `https://developers.cloudflare.com/workers/`,
`https://developers.cloudflare.com/durable-objects/` y la documentación de
Wrangler. Esta skill no reemplaza esas fuentes ni contiene valores sensibles.
