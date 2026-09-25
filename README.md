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

## Clientes soportados

| Cliente | Destino generado | Forma de integración |
|---|---|---|
| OpenCode | `~/.config/opencode/` | Commands, skills, agents, plugins y configuración compatible. |
| Claude Code | `~/.claude/` | Commands, skills, agents, instrucciones y hooks compatibles. |
| Codex CLI | `~/.codex/` | Skills, instrucciones y policies compatibles con Codex. |
| Gentle Shell | `~/.gentle-shell/agent/` | Prompt templates, skills, agents y configuración Pi/Gentle. |

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

El renderer sólo escribe en el directorio indicado. No elige destinos globales
ni instala archivos por su cuenta; esa responsabilidad pertenece al instalador
con backup, plan y rollback.

## Instalación

El bootstrap detecta los clientes disponibles, crea un backup de sus destinos,
instala la versión solicitada y registra el resultado. La instalación global no
instala configuración de proyecto.

```bash
qz-kit install --plan
qz-kit install --apply
qz-kit doctor
qz-kit verify --manifest
qz-kit verify --clients
qz-kit verify --drift
```

La instalación también coloca el dispatcher portable `qz` en
`~/.local/bin/qz` (o bajo el `--home` usado en una prueba). Así cualquier
proyecto con `.qz/project.json` tiene una entrada común sin copiar workflows
específicos de Hospeda al kit.

También conserva la fuente universal de instrucciones en
`~/.config/qz-agent-kit/instructions/AGENTS.md`. Ese archivo no reemplaza el
`AGENTS.md` de un proyecto ni se inyecta silenciosamente en repositorios: sirve
como recurso administrado para los adapters y para una futura sincronización
explícita por proyecto.

Para registrar un proyecto se usa su adapter explícito:

```bash
qz-kit project register /ruta/al/proyecto
qz-kit project list
```

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

El instalador nunca copia credenciales, tokens, `.env`, bases de datos ni
memoria Engram. Esos recursos se detectan y validan localmente, pero sus
valores permanecen fuera del repositorio y del manifest.

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
qz-kit update --project hospeda
qz-kit update --rollback <manifest-id>
```

`update --plan` muestra archivos nuevos, modificados, eliminados y con drift.
`update --apply` crea un backup, genera los adapters, valida hashes, ejecuta
smoke checks y escribe un manifest de rollback. La aplicación es idempotente:
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
qz-kit verify --manifest
qz-kit verify --clients
qz-kit verify --drift
```

El resultado indica qué clientes están instalados, qué versión tienen, qué
archivos coinciden con la fuente y qué destinos necesitan revisión.

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

`qz doctor` valida el contrato del proyecto y `qz config` muestra únicamente configuración sanitizada: elimina las secciones de secretos y nunca lee sus valores. Los demás comandos se delegan al adapter mediante `commands.dispatch` en `.qz/project.json`. El kit mantiene la entrada estable y el límite de seguridad; cada proyecto conserva su lógica de issues, worktrees, bases, variables de entorno y servidores. El dispatcher genérico no inventa workflows de Hospeda ni exige Linear.

Un adapter puede declarar un dispatcher determinista:

```json
{
  "commands": {
    "genericPrefix": "qz-",
    "dispatch": "node tools/dispatch.mjs"
  }
}
```

La orden se ejecuta con la raíz del proyecto como directorio de trabajo. Si el adapter no declara `commands.dispatch`, `qz` falla de forma explícita en lugar de adivinar un workflow.
