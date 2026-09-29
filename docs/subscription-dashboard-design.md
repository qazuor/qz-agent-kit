# Dashboard de suscripciones y consumo

## Objetivo

Una mini app local, extensible a remoto más adelante, que consolide el estado de las suscripciones de Claude, OpenAI y NaN Builders sin copiar credenciales ni depender de una única API.

## Principio de datos

Cada integración devuelve un snapshot normalizado con `provider`, `plan`, `periodStart`, `periodEnd`, `renewalAt`, `limits`, `usage`, `remaining`, `observedAt`, `source` y `confidence`. Los valores no disponibles se muestran como `no verificado`; nunca se infieren como cero.

## Fuentes

- **NaN Builders**: su CLI oficial ya expone Profile, Usage, Models y Costs; además documenta el endpoint de uso. Con una sesión de `nan` se obtiene consumo real; con sólo API key se valida disponibilidad de modelos, pero no saldo.
- **OpenAI API**: Usage Dashboard y Cost API requieren permisos de organización; el dashboard debe aceptar una exportación o credencial de sólo lectura. No debe confundir consumo API con la suscripción ChatGPT/Codex.
- **Claude**: la Usage and Cost API requiere Admin API key u OAuth con `org:admin`; Claude.ai/Claude Code puede exponer límites de producto distintos. Sin esos permisos, el dashboard enlaza a la consola y permite registrar una captura manual.

## Cuotas de suscripciones personales

La investigación confirmó que el saldo de las suscripciones personales puede
obtenerse, pero no desde los archivos de estadísticas que veníamos leyendo:

- **Codex**: OpenAI documenta `/status` dentro de una sesión activa. El
  app-server local expone `account/rateLimits/read`, que es la fuente que usan
  herramientas de monitoreo locales. Debemos invocarlo mediante `codex
  app-server`, sin leer `~/.codex/auth.json` ni copiar tokens.
- **Claude Code**: Claude muestra el estado en `/status`. Después de cada
  respuesta, el statusline recibe ventanas `rate_limits` con porcentaje y
  `resets_at`; esa es la fuente preferible. `stats-cache.json` sólo sirve para
  actividad local y no para saldo.
- **NaN**: la sesión autenticada entrega uso oficial por ventana y modelo. La
  cuota total debe combinarse con los límites publicados para el plan o con un
  endpoint de cuenta que los exponga; no se debe derivar un saldo sin esa base.

La implementación sigue esta prioridad: fuente oficial del CLI o app-server,
luego caché local de rate limits, luego API administrativa y por último
estimación local. Cada número conserva `source`, `observedAt` y `confidence`.

Los tres adapters principales ya están operativos: NaN consulta `/v1/usage` y
calcula restantes contra las cuotas publicadas; Codex consulta
`account/rateLimits/read` mediante su app-server; Claude consume el caché de
`rate_limits` generado por el statusline existente. Un caché vencido queda
marcado como `partial`.

## Seguridad

Las credenciales viven fuera del repositorio, con referencias indirectas y permisos restrictivos. El backend local no imprime tokens, no los envía al navegador y no almacena respuestas completas de APIs. Cada adapter tiene timeout, rate limit y caché corta.

## MVP

1. servidor local persistente;
2. página de providers;
3. tarjetas de plan, consumo, límite, restante y renovación;
4. estado `verificado`, `parcial` o `manual`;
5. refresco bajo demanda y timestamp de última consulta;
6. enlaces directos a las consolas oficiales;
7. NaN automatizado; OpenAI y Claude combinan fuentes administrativas cuando existen y fuentes locales de baja confianza cuando sólo hay login/estadísticas del CLI.

### Interfaz actual

La vista local usa un dashboard oscuro por defecto, con selector claro/oscuro persistido en el navegador y una jerarquía común para los tres providers. Cada provider ocupa una tarjeta del mismo peso visual; dentro se muestran su estado, ventana de uso, porcentaje restante, fecha de reinicio, fuente y antigüedad de los datos. NaN muestra además una barra independiente por modelo, calculada contra la cuota publicada de ese modelo; no se agrega en una única barra engañosa. El encabezado resume cantidad de fuentes verificadas, consumo mensual observado de NaN, próximo reinicio y última lectura. La página se actualiza sola cada 15 segundos y permite una actualización manual, sin buscador ni filtros que oculten providers críticos.

La primera pieza ejecutable del MVP ya está disponible con `qz-kit subscriptions
serve`: sirve el store local en loopback, expone `/api/health` y
`/api/snapshots`, muestra una vista oscura básica por proveedor y puede ejecutar
`--refresh-interval <segundos>`. La página consulta `/api/snapshots` cada 15
segundos y actualiza las tarjetas sin recargar el navegador; el servidor
refresca providers cada 300 segundos por defecto. `qz-kit subscriptions refresh` consulta NaN
cuando hay sesión/API key; detecta `codex login status` y las estadísticas
locales de Claude Code (`~/.claude/stats-cache.json`) como fuentes `partial`,
sin confundirlas con cuotas oficiales. Deja un provider como `unavailable`
cuando tampoco existe una fuente local. Nunca convierte una falta de permisos
en cero. El servidor es read-only respecto del store salvo el refresh explícito
y la carga de snapshots queda separada para que los adapters puedan validarlos.

En Linux, `qz-kit subscriptions install --plan` genera una unidad systemd de
usuario; `--apply` la instala, la habilita y la inicia. El MVP sólo admite
loopback y usa `Restart=on-failure`.

Referencias oficiales verificadas: NaN expone su uso mediante el CLI y la API
de sesión (`cloud-api.nan.builders/api/metrics/usage`); OpenAI requiere acceso
al Usage Dashboard/API de organización; Claude Usage and Cost API requiere una
credencial administrativa. Estas fuentes sirven para distinguir “sin permiso”
de “consumo cero”.

## Fuera del MVP

Autenticación remota, multiusuario, notificaciones, histórico analítico largo y scraping de interfaces privadas.
