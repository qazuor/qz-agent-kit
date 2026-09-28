# Dashboard de suscripciones y consumo

## Objetivo

Una mini app local, extensible a remoto más adelante, que consolide el estado de las suscripciones de Claude, OpenAI y NaN Builders sin copiar credenciales ni depender de una única API.

## Principio de datos

Cada integración devuelve un snapshot normalizado con `provider`, `plan`, `periodStart`, `periodEnd`, `renewalAt`, `limits`, `usage`, `remaining`, `observedAt`, `source` y `confidence`. Los valores no disponibles se muestran como `no verificado`; nunca se infieren como cero.

## Fuentes

- **NaN Builders**: su CLI oficial ya expone Profile, Usage, Models y Costs; además documenta el endpoint de uso. Es el primer adapter automatizable.
- **OpenAI API**: Usage Dashboard y Cost API requieren permisos de organización; el dashboard debe aceptar una exportación o credencial de sólo lectura. No debe confundir consumo API con la suscripción ChatGPT/Codex.
- **Claude**: la Usage and Cost API requiere Admin API key u OAuth con `org:admin`; Claude.ai/Claude Code puede exponer límites de producto distintos. Sin esos permisos, el dashboard enlaza a la consola y permite registrar una captura manual.

## Seguridad

Las credenciales viven fuera del repositorio, con referencias indirectas y permisos restrictivos. El backend local no imprime tokens, no los envía al navegador y no almacena respuestas completas de APIs. Cada adapter tiene timeout, rate limit y caché corta.

## MVP

1. servidor local persistente;
2. página de providers;
3. tarjetas de plan, consumo, límite, restante y renovación;
4. estado `verificado`, `parcial` o `manual`;
5. refresco bajo demanda y timestamp de última consulta;
6. enlaces directos a las consolas oficiales;
7. NaN automatizado; OpenAI y Claude inicialmente con integración disponible sólo cuando existan permisos adecuados.

## Fuera del MVP

Autenticación remota, multiusuario, notificaciones, histórico analítico largo y scraping de interfaces privadas.
