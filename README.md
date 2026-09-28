# qz-agent-kit

`qz-agent-kit` es la capa común de herramientas, instrucciones y workflows que
mantiene sincronizados nuestros clientes de desarrollo asistido por agentes.
Contiene una única fuente de verdad y adapters para instalar esa misma capa en
OpenCode, Claude Code, Codex CLI y Gentle Shell. El proyecto mantiene el
workflow portable; cada CLI conserva su propia interfaz, permisos y formato de
configuración.

## Qué resuelve

El kit evita que una actualización de un skill, agent o command tenga que
editarse cuatro veces. Los archivos fuente viven en este repositorio, cada
adapter los transforma al formato del cliente correspondiente y un manifest
registra la versión, el commit de origen y el hash de cada archivo instalado.

Los comandos del kit usan el prefijo `qz-`. Los comandos `hops-*` pertenecen
exclusivamente a Hospeda y no forman parte de este repositorio. Un proyecto
puede agregar comandos propios por encima de los comandos `qz-*` cuando
necesita comportamiento específico.

## Componentes

| Componente | Contenido |
|---|---|
| Fuente de verdad | Agents, skills, commands, prompts, policies, guards e instrucciones comunes. |
| Adapters | Generadores para OpenCode, Claude Code, Codex CLI y Gentle Shell. |
| Instalador | Bootstrap global, instalación por cliente y registro de proyectos. |
| Manifest | Versiones, hashes, destinos, drift y procedencia de cada instalación. |
| Update | Plan, diff, backup, aplicación idempotente, validación y rollback. |
| Guards | Validaciones de seguridad, permisos, secretos, Git y configuración. |
| Wrappers `qz-*` | Operaciones portables que delegan el estado del proyecto a su adapter. |

## Arquitectura

```text
qz-agent-kit
├── source/                 # única fuente de verdad
│   ├── agents/
│   ├── skills/
│   ├── commands/
│   ├── prompts/
│   ├── policies/
│   └── guards/
├── adapters/               # traducción por CLI
│   ├── opencode/
│   ├── claude/
│   ├── codex/
│   └── gentle-shell/
├── installers/             # bootstrap y distribución
├── manifests/              # schemas y estado instalado
└── scripts/                # render, validate, update y rollback
```

El kit no contiene reglas de negocio ni secretos de un proyecto. Linear,
worktrees, branches, bases de datos, variables de entorno, puertos y closeout
se resuelven mediante el adapter del proyecto. El cliente sólo invoca el
workflow común y consume su resultado.

## Knowledge layer por proyecto

Las reglas específicas de un repositorio no se mezclan con la fuente global. El
adapter puede declarar un bloque opcional `knowledge` en `.qz/project.json`:

```json
{
  "knowledge": {
    "root": ".qz/knowledge",
    "instructions": "AGENTS.md",
    "skillsDir": "skills",
    "agentsDir": "agents",
    "commandsDir": "commands"
  }
}
```

`qz-kit project render` transforma esa capa al layout de cada CLI sin instalarla
ni modificar el proyecto. El renderer es read-only respecto del proyecto; sólo
escribe el directorio de salida indicado:

```bash
qz-kit project render /ruta/al/proyecto --client opencode --output /tmp/project-opencode
qz-kit project render /ruta/al/proyecto --client claude --output /tmp/project-claude
qz-kit project render /ruta/al/proyecto --client codex --output /tmp/project-codex
qz-kit project render /ruta/al/proyecto --client gentle-shell --output /tmp/project-gentle
```

El proyecto conserva la fuente (`.qz/knowledge`); el adapter de cada CLI decide
dónde instalar posteriormente los artefactos generados. Las rutas se validan como
relativas y no pueden escapar del proyecto.

## Clientes soportados

| Cliente | Destino generado | Forma de integración |
|---|---|---|
| OpenCode | `~/.config/opencode/` | Commands y agents compatibles; plugins/configuración quedan fuera del alcance genérico. |
| Claude Code | `~/.claude/` | Commands, skills y agents compatibles. Las instrucciones universales quedan en el store del kit. |
| Codex CLI | `~/.codex/` | Skills, instrucciones y policies compatibles con Codex. |
| Gentle Shell | `~/.gentle-shell/agent/` | Prompt templates, skills y agents compatibles. |

Los destinos son artefactos generados. No se editan como fuente de verdad. El
manifest detecta modificaciones locales y permite conservarlas, reemplazarlas
o revisarlas antes de actualizar.

## Comandos `qz-*`

Los workflows genéricos se descubren mediante nombres con prefijo `qz-`, por
ejemplo:

```text
qz-start-issue
qz-close-issue
qz-recap
qz-handoff
qz-verify
qz-update
qz-engram
qz-artifact
```

Cada command se limita a describir la interacción con el agente. La operación
determinista vive en un script versionado y configurable; el agente no
reimplementa Linear, Git, worktrees, bases, puertos ni closeout a mano.

Un proyecto puede añadir un wrapper específico sin alterar el command genérico:

```text
qz-start-issue       # workflow portable
hops-start-issue     # adapter exclusivo de Hospeda
```

La primera colección portable incluye siete commands: `qz-recap`,
`qz-handoff`, `qz-verify`, `qz-start-issue`, `qz-close-issue`, `qz-engram` y
`qz-artifact`. El manifest generado en `manifests/qz-command-manifest.json`
registra sus hashes y sirve como entrada para todos los adapters.

Para regenerar el manifest y comprobar cada formato:

```bash
npm run manifest
npm run render -- --client opencode --output /tmp/qz-opencode
npm run render -- --client claude --output /tmp/qz-claude
npm run render -- --client codex --output /tmp/qz-codex
npm run render -- --client gentle-shell --output /tmp/qz-gentle
```

El renderer sólo escribe en el directorio indicado. Incluye el contenido del
cliente y una copia visible de los recursos centrales bajo
`qz-agent-kit/instructions/` y `qz-agent-kit/guards/`. No elige destinos
globales ni instala archivos por su cuenta; esa responsabilidad pertenece al
instalador con backup, plan y rollback.

## Instalación

Desde un clone del repositorio, el kit puede exponerse como comandos globales
sin copiar su fuente de verdad:

Requiere Node.js 22 o superior.

```bash
npm install --global .
qz-kit --version
qz-kit install --plan
qz-kit install --apply
```

En una máquina nueva, `qz-kit install` abre un wizard interactivo. Detecta los
CLI disponibles, permite elegir qué clientes sincronizar y registra las
selecciones de Gentle AI, Engram, Context7, revisiones, agentes en segundo plano
y proveedores. El plan queda en
`~/.config/qz-agent-kit/install-plan.json` para repetirlo o auditarlo. La capa
qz se aplica con backup; los componentes externos quedan explícitamente como
selección pendiente hasta que exista un adapter verificable para cada uno. El
wizard nunca lee, copia, limpia ni migra credenciales, `.env` o la base de
Engram.

Para automatización se conservan `--plan`, `--check` y `--apply`. La instalación
interactiva equivale a elegir clientes y luego ejecutar `--apply`; no reemplaza
el plan read-only ni el rollback.

Una reinstalación puede reutilizar el plan sin abrir el wizard:

```bash
qz-kit install --from ~/.config/qz-agent-kit/install-plan.json --apply
```

Ese modo sólo reutiliza selecciones del plan; sigue creando el backup normal y
no convierte componentes externos pendientes en instalaciones implícitas.
Las rutas absolutas del equipo que creó el plan no se reutilizan: por defecto
se instala en el `HOME` actual. Se puede indicar otro destino con `--home`.

`qz-kit ecosystem` realiza un relevamiento read-only de OpenCode, Gentle AI,
Gentle Shell, Engram, Claude Code y Codex. Informa ejecutable, método probable,
versión y existencia de directorios de configuración. Sólo muestra nombres de
variables de entorno relacionadas; nunca imprime sus valores. Las integraciones
de red quedan como `not-probed` hasta que exista una operación explícitamente
segura para consultarlas.

El inventario también indica si existen los archivos de auth conocidos de cada
CLI, pero sólo informa `present: true/false`; nunca abre ni imprime su contenido.
También enumera rutas conocidas de TUI, themes, plugins y skills para detectar
qué ya existe. No carga, habilita, deshabilita ni modifica ninguno.

`qz-kit preflight` cruza el plan guardado con ese inventario y separa checks
correctos, warnings y componentes pendientes. `--strict` devuelve código de
error si hay algo pendiente o faltante; el modo normal no bloquea la capa qz
por la ausencia de un CLI o un adapter externo.

`qz-kit readiness` reúne ecosistema, backup y preflight, e incluye
`summary.ready`. Con `qz-kit readiness --strict` conserva el JSON completo pero
devuelve código de error si falta el plan o alguno de los bloques no está listo.

`qz-kit plan` muestra de forma segura los clientes, componentes, proveedores y
procedencia del plan persistido. No imprime campos desconocidos ni modifica el
archivo; `qz-kit plan --strict` falla si el plan no existe o es inválido.

`qz-kit external-plan` describe las acciones que todavía requieren aprobación
para Gentle AI, Engram u otros adapters. `qz-kit external-plan --strict`
devuelve código de error si queda alguna acción aprobable; nunca ejecuta esas
acciones.

`qz-kit external-preview` ejecuta sólo el preview seguro declarado por el
manifest del adapter, sin shell y sin incluir la salida del proceso. Devuelve
estado, código de salida y una huella del resultado. Para Engram se debe pasar
el proyecto explícitamente:

```bash
qz-kit external-preview --component gentle-ai
qz-kit external-preview --component engram --project hospeda
qz-kit external-preview --strict --project hospeda
qz-kit external-preview --strict --project hospeda --receipt /tmp/qz-preview.json
qz-kit external-receipt --check /tmp/qz-preview.json
```

Un preview exitoso no instala, actualiza ni configura nada y no habilita el
`apply` del adapter. El receipt es opcional y sólo se escribe cuando se pasa
explícitamente la ruta.

Para un diagnóstico Engram concreto, se puede pedir un único check con timeout:

```bash
qz-kit ecosystem --engram-check sqlite_lock_contention --project hospeda
```

El comando no acepta flags de reparación y no ejecuta `import`, `export`,
`sync`, `delete`, `consolidate` ni `cloud`.

Para auditar un proyecto concreto, pasá su raíz explícitamente:

```bash
qz-kit backup-plan --project /ruta/al/proyecto
```

Para una reinstalación reproducible, primero se clona una revisión concreta y
se ejecuta el mismo flujo. `npm install --global .` instala sólo los entrypoints
`qz-kit`, `qz` y los shims `qz-*`; los commands, agents, skills, instrucciones y guards se
distribuyen después mediante `qz-kit install`.

El bootstrap detecta los clientes disponibles, crea un backup de sus destinos,
instala la versión solicitada y registra el resultado. La instalación global no
instala configuración de proyecto.

```bash
qz-kit install --plan
qz-kit install --apply
qz-kit install --apply --client all
qz-kit install --plan --client opencode,claude
# sólo la capa central qz, sin instalar destinos de ningún CLI
qz-kit install --apply --client none
qz-kit doctor
qz-kit ecosystem
qz-kit preflight
qz-kit backup-plan
qz-kit external-plan
qz-kit external-preview
qz-kit provenance --manifest /ruta/al/install-manifest.json
qz-kit readiness --project /ruta/al/proyecto
qz-kit plan
qz-kit verify --client opencode
```

`qz-kit external-plan` genera comandos y precondiciones para instalar o
configurar Gentle AI y Engram. Es siempre read-only: cada acción requiere
aprobación explícita y el plan no ejecuta comandos externos.

`qz-kit provenance` compara el hash y commit de la fuente actual con el manifest
de una instalación anterior. Si difieren, marca `updateReview: required` sin
modificar archivos.

`qz-kit readiness` reúne en un solo JSON el inventario del ecosistema, el
backup plan del proyecto y el preflight del plan persistente. Es la operación
recomendada para una revisión inicial o antes de una reinstalación.

La instalación también coloca el dispatcher portable `qz` en
`~/.local/bin/qz` (o bajo el `--home` usado en una prueba). Así cualquier
proyecto con `.qz/project.json` tiene una entrada común sin copiar workflows
específicos de Hospeda al kit.

También conserva la fuente universal de instrucciones en
`~/.config/qz-agent-kit/instructions/AGENTS.md`. Ese archivo no reemplaza el
`AGENTS.md` de un proyecto ni se inyecta silenciosamente en repositorios: sirve
como recurso administrado para los adapters y para una futura sincronización
explícita por proyecto.

Los guards ejecutables se instalan junto a esa fuente en
`~/.config/qz-agent-kit/guards/`, con permisos ejecutables y el mismo backup
fechado. El kit no los conecta automáticamente a hooks de Git: cada adapter o
proyecto decide dónde aplicarlos.

Para registrar un proyecto se usa su adapter explícito:

```bash
qz-kit project register /ruta/al/proyecto
qz-kit project init /ruta/al/proyecto --plan
qz-kit project init /ruta/al/proyecto --apply
qz-kit project discover /ruta/de/proyectos --max-depth 3
qz-kit project list
qz-kit project unregister <project-id>
qz-kit project restore <backup.json>
```

Si ya existe el mismo `projectId` apuntando a otra raíz, `register` se detiene
para evitar reemplazar el proyecto silenciosamente. El cambio requiere
`--replace` explícito.

El registro se guarda en `~/.config/qz-agent-kit/projects.json`, separado de
los repositorios y sin valores secretos. Cada proyecto registrado declara su
adapter mediante `.qz/project.json`; el kit valida ese contrato antes de
aceptarlo.

```bash
qz-kit project validate /ruta/al/proyecto
qz-kit project list
qz-kit project inspect
```

`project inspect` valida todos los proyectos registrados y devuelve un informe
estructurado sin iniciar servidores, consultar issues ni modificar repositorios.

Para llevar la capa de conocimiento de un proyecto a los directorios que cada
cliente reconoce se usa `project sync`. Por defecto sólo calcula el plan; el
modo `--check` devuelve código distinto de cero si falta o cambió un recurso.
`--apply` crea un backup fuera del repositorio y copia únicamente los archivos
declarados por `knowledge`. Un archivo existente con drift bloquea la aplicación
hasta indicar `--replace`; `AGENTS.md` requiere además `--replace-instructions`
porque puede contener reglas universales mantenidas manualmente.

```bash
qz-kit project sync /ruta/al/proyecto --plan --client all
qz-kit project sync /ruta/al/proyecto --check --client opencode,claude
qz-kit project sync /ruta/al/proyecto --apply --client all
qz-kit project sync /ruta/al/proyecto --apply --replace --replace-instructions
```

El sync no elimina recursos obsoletos, no toca `.env`, credenciales, bases de
datos ni Git, y no ejecuta comandos del proyecto. Su manifest de rollback queda
en `~/.local/state/qz-agent-kit/project-backups/`.

`project discover` busca `.qz/project.json` debajo de una o varias rutas, valida
cada adapter encontrado y devuelve sus ids, raíces y estado. Es read-only: no
registra proyectos, no crea manifests y no lee secretos. Ignora directorios de
dependencias, builds y metadatos de Git; `--max-depth` limita el alcance de la
búsqueda.

El instalador nunca copia credenciales, tokens, `.env`, bases de datos ni
memoria Engram. Esos recursos se detectan y validan localmente, pero sus
valores permanecen fuera del repositorio y del manifest.

Los componentes opcionales que aparecen en el wizard también tienen un
contrato declarativo. Context7, RDD/review y background agents se informan como
`pending-adapter` hasta que exista una integración ejecutable y verificada; no
se tratan como componentes desconocidos ni se habilitan automáticamente.

## Actualización y sincronización

Una modificación de `source/` se distribuye a todos los clientes con un único
comando:

```bash
qz-kit update --check
qz-kit update --plan
qz-kit update --apply
```

También se puede limitar el alcance:

```bash
qz-kit update --client opencode
qz-kit rollback <install-manifest.json>
```

Cuando no se pasa `--client`, `qz-kit update` reutiliza los clientes guardados
en `~/.config/qz-agent-kit/install-plan.json`. Si todavía no existe un plan,
mantiene el comportamiento de detectar los clientes disponibles. El plan se
valida antes de usarlo; un archivo incompleto o alterado se rechaza sin aplicar
cambios.

El rollback se ejecuta con el manifest exacto producido por una instalación:

```bash
qz-kit rollback ~/.local/state/qz-agent-kit/backups/<timestamp>/install-manifest.json
```

Restaura únicamente los destinos registrados y elimina sólo los destinos que
ese manifest creó sin backup. No busca archivos por nombre ni toca otros
archivos del sistema.

`update --plan` muestra archivos nuevos, modificados, eliminados y con drift.
Cada destino aparece además con estado `missing`, `drift` o `current`.
`update --check` ejecuta la misma comprobación sin aplicar cambios; `update`
sin modo explícito es la única variante que aplica la actualización.
`update --apply` crea un backup, valida fuentes y hashes, copia sólo los
destinos administrados y escribe un manifest de rollback. La aplicación es
idempotente:
repetirla con la misma versión no produce cambios adicionales.

`manifests/qz-content-manifest.json` registra hashes de commands, agents,
skills, guards e instrucciones. El manifest permite revisar drift de toda la
fuente portable, incluso cuando el cambio no pertenece a un command.

La actualización automática no reemplaza el plan explícito. Puede ejecutarse
en modo chequeo para avisar que existe una versión nueva, pero la aplicación
requiere una orden clara cuando modifica permisos, prompts o policies.

## Versionado y procedencia

Cada release del kit identifica:

- versión semántica del kit;
- commit de la fuente de verdad;
- versión del adapter;
- cliente y proyecto destino;
- hash de cada archivo generado;
- backup anterior;
- resultado de las validaciones.

Esto permite saber qué CLI está desactualizado, qué archivo fue editado localmente
y desde qué release se generó.

## Seguridad

El kit clasifica operaciones en cuatro niveles:

| Nivel | Comportamiento |
|---|---|
| Read-only | Se permite automáticamente cuando no hay datos sensibles. |
| Safe shell | Se ejecuta con las herramientas y rutas declaradas por el adapter. |
| Mutating | Requiere autorización del agente o de la persona según el cliente. |
| Destructive/external | Queda bloqueado por defecto y exige una confirmación explícita. |

Los guards verifican manifests, comandos prohibidos, secretos staged, destinos
de instalación, drift y rollback. Los adapters traducen la política al modelo
de permisos de cada CLI; no prometen una paridad interna imposible entre
OpenCode, Claude, Codex y Pi.

## Relación con proyectos

El kit es genérico. Un proyecto aporta un adapter que declara:

- identificador del proyecto;
- proveedor de issues;
- patrón de branches;
- workflow de worktrees;
- fuente de variables de entorno;
- estrategia de base de datos;
- servidores y puertos;
- commands específicos del proyecto.

Hospeda mantiene sus workflows `hops-*`, su memoria, sus specs, Linear y sus
reglas de negocio en su propio repositorio. El adapter Hospeda consume los
componentes `qz-*` sin convertirlos en una segunda fuente de verdad.

## Verificación

Después de instalar o actualizar, el kit ejecuta validaciones que no requieren
modificar el proyecto:

```bash
qz-kit doctor
qz-kit verify
qz-kit verify --client opencode
```

El resultado indica qué clientes están instalados, qué versión tienen, qué
archivos coinciden con la fuente y qué destinos necesitan revisión. `verify`
es el alias read-only de `install --check`; el alcance se limita con
`--client` o `--home`.

## Principios

- Una fuente de verdad; varios adapters.
- `qz-*` para lo genérico; `hops-*` sólo para Hospeda.
- Git conserva la fuente técnica y los manifests explican la distribución.
- Los agentes invocan scripts deterministas en lugar de reconstruir workflows.
- Las credenciales y memorias viven fuera del repositorio.
- Toda actualización es revisable, idempotente y reversible.
- La compatibilidad entre clientes es operativa, no una promesa de identidad
  interna.

## Dispatcher portable `qz`

El ejecutable instalado `qz` es una entrada común consciente del proyecto. Busca `.qz/project.json` desde el directorio actual hacia arriba y expone:

```text
qz doctor
qz config --json
qz <comando> [args...]
```

`qz doctor` valida el contrato del proyecto y `qz config` muestra únicamente configuración sanitizada: elimina las secciones de secretos y nunca lee sus valores. Los comandos se delegan al adapter mediante `commands.dispatch` cuando existe. `qz start-issue` tiene además un fallback genérico para adapters ausentes o parciales: crea el worktree Git, branch, instalación y build declarados, sin inventar Linear, envs, bases ni servidores. `qz close-issue` dispone de un fallback local que verifica branch, worktree y limpieza sin afirmar que Linear fue actualizado. El adapter especializado conserva esas capacidades del proyecto. El kit mantiene la entrada estable y el límite de seguridad; cada proyecto conserva su lógica específica.

Un adapter puede declarar un dispatcher determinista:

```json
{
  "commands": {
    "genericPrefix": "qz-",
    "dispatch": "node tools/dispatch.mjs"
  }
}
```

La orden se ejecuta con la raíz del proyecto como directorio de trabajo. Si el adapter no declara `commands.dispatch`, `qz start-issue` y `qz close-issue` usan sus fallbacks genéricos instalados en `~/.config/qz-agent-kit/bin`; los demás comandos fallan de forma explícita. Si un dispatcher parcial devuelve código 2 para `start-issue`, también se intenta el fallback.
