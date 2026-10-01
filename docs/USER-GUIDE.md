# Guía operativa de qz-agent-kit

Esta guía explica qué es el paquete, qué instala, cómo se configura, cómo se usa y cómo se diagnostica. `qz-agent-kit` es la fuente versionada de los componentes reutilizables que deben funcionar con OpenCode, Gentle Shell, Claude Code y Codex.

## Modelo mental

El sistema tiene tres capas:

1. **qz-agent-kit**: comandos, skills, agentes, instrucciones, instaladores, adapters y servicios comunes.
2. **Adapter del proyecto**: configuración específica de cada repositorio en `.qz/project.json` y scripts propios del proyecto.
3. **Harness**: el CLI que conversa con el modelo. El kit instala integración para cada harness disponible sin convertir la lógica en una copia separada.

La fuente de verdad vive en este repositorio. Los archivos instalados en cada CLI son proyecciones generadas o sincronizadas desde aquí; no deben editarse directamente.

## Instalación en una máquina nueva

```bash
git clone <url-del-repositorio> ~/projects/TOOLS/qz-agent-kit
cd ~/projects/TOOLS/qz-agent-kit
npm install --global .
qz-kit install
qz-kit plan
qz-kit check
```

`qz-kit install` detecta los harness disponibles, muestra una selección interactiva y prepara componentes comunes. Puede instalar o configurar Gentle AI, Engram, OpenCode, Gentle Shell, instrucciones, skills, agentes, comandos y servicios opcionales. No se deben copiar secretos al repositorio.

También podés ejecutar `qz-kit` sin argumentos para abrir el menú principal. Ese
menú reúne instalación, comprobación, plan de actualización, doctor, verify y
escaneo de memoria. En scripts o CI usá siempre un subcomando explícito.

Para instalar la capa de un proyecto:

```bash
cd /ruta/al/proyecto
qz-kit project init
qz-kit project sync
```

El asistente intenta autodetectar nombre, remotos, ramas, package manager, worktrees, comandos de verificación y rutas generadas. Los valores detectados se presentan como defaults editables.

## Actualización y rollback

```bash
qz-kit update --check
qz-kit update --plan
qz-kit update
qz-kit verify
```

El flujo conserva un registro de procedencia y compara el estado instalado con la fuente. `--check` es de lectura; `--plan` muestra acciones; `update` aplica la actualización. Antes de una actualización importante conviene guardar el plan y revisar el diff. Para volver atrás se usa la versión anterior del repositorio y se ejecuta nuevamente el instalador; no se borran automáticamente proyectos, worktrees, Git, DBs ni memorias Engram.

Los archivos `qz-*` que fueron administrados por una instalación anterior y ya
no forman parte del manifest se informan como obsoletos en `--check` y se
respaldan antes de eliminarse durante `--apply`. Los archivos legacy ajenos al
kit no se eliminan automáticamente.

## Comandos principales

| Comando | Uso | Efecto |
|---|---|---|
| `qz-kit install` | instalación inicial o reparación | mutante, interactivo |
| `qz-kit update` | sincronizar una versión nueva | mutante |
| `qz-kit plan` | revisar acciones | lectura |
| `qz-kit check` / `verify` | validar instalación | lectura |
| `qz-kit project init` | registrar un proyecto | mutante en el proyecto |
| `qz-kit project sync` | sincronizar adapter y comandos | mutante en el proyecto |
| `qz-kit memory scan` | relevar memoria de Claude y clasificar candidatos | sólo lectura |
| `qz-kit clean --plan` | inventariar y recomendar limpieza legacy | lectura |
| `qz-kit clean --apply` | confirmar y limpiar elementos seleccionados | mutante, interactivo |
| `qz-kit external list` | ver adapters externos | lectura |
| `qz-kit external doctor` | diagnosticar adapters | lectura |
| `qz-kit external-plan` | mostrar acciones externas declaradas | lectura |
| `qz-kit external-preview` | ejecutar previews seguros y generar receipt | lectura, salvo el receipt |
| `qz-kit external-backup` | crear backup explícito de Engram | mutante en backup externo |
| `qz-kit external-apply` | aplicar un adapter externo aprobado | mutante, aprobación obligatoria |
| `qz-kit subscriptions` | levantar dashboard y datos de suscripciones | puede iniciar servicios |
| `qz-kit subscriptions install` | instalar servicio de dashboard | mutante en el usuario/OS |
| `qz-kit subscriptions tray` | instalar o ejecutar indicador KDE | mutante si instala dependencias |
| `qz-kit artifacts` | gestionar visor local de artifacts | mutante si inicia servidor |

## Comandos portables `qz-*`

Los comandos portables son wrappers deterministas. Hacen el trabajo costoso en scripts y devuelven JSON o texto legible; el harness agrega solamente contexto y razonamiento cuando hace falta.

| Comando | Propósito |
|---|---|
| `qz-recap` | contexto estático del worktree, issue, branch, Git, DB y servidores |
| `qz-handoff` | preparar un handoff delimitado con hallazgos, decisiones y próximos pasos |
| `qz-start-issue` | iniciar issue, validar Linear, branch y worktree mediante adapter o fallback genérico |
| `qz-close-issue` | ejecutar closeout, verificaciones y limpieza según adapter |
| `qz-verify` | ejecutar la verificación declarada por el proyecto; `--changed` limita el alcance |
| `qz-artifact` | generar o actualizar un artifact con datos separados del markup |
| `qz-engram` | wrapper seguro de consultas y diagnóstico de Engram |
| `qz-gentle` | wrapper de estado y diagnóstico de Gentle AI |

Los nombres específicos de Hospeda siguen siendo `hops-*` y viven en el adapter de Hospeda. Un comando genérico no debe asumir Linear, PostgreSQL ni la estructura de Hospeda.

## Engram y Gentle AI

`qz-engram` deja pasar únicamente operaciones de lectura: versión, doctor, estadísticas, proyectos, búsqueda, contexto, timeline, conflictos, estado cloud y quick test. Bloquea import, export, sync, setup, consolidate, prune y cualquier escritura. La memoria se conserva fuera de Git y se respalda antes de cualquier limpieza.

`qz-gentle` permite inspeccionar versión, doctor, estado SDD/ODD, review y telemetry. Bloquea instalación, upgrade, sync, restore, desinstalación y mutaciones de review o telemetry. Las actualizaciones de Gentle y Engram se hacen desde una etapa explícita del instalador, nunca como efecto oculto de un comando de trabajo.

El flujo externo de Engram exige un proyecto, un backup SQLite consistente y un
receipt de preview:

```bash
qz-kit external-backup --component engram --project <project> --approve ENGRAM_BACKUP
qz-kit external-preview --component engram --project <project> \
  --receipt /tmp/engram-preview.json
qz-kit external-apply --component engram --project <project> \
  --backup ~/.local/state/qz-agent-kit/external-backups/engram/<timestamp>/manifest.json \
  --receipt /tmp/engram-preview.json --approve ENGRAM_APPLY
```

El apply sólo ejecuta `engram setup opencode --protocol=full` y corre el doctor
de lock SQLite después. Nunca exporta, poda, consolida ni borra memorias.

## Configuración de un proyecto

El adapter reside en `.qz/project.json`. Debe describir, como mínimo:

- nombre y repositorio;
- ramas base (`develop`, `staging`, `main`) y rama predeterminada;
- comandos de start/close issue y worktree;
- package manager y comandos de instalación;
- health checks y puertos;
- comandos de verificación;
- rutas generadas por build.

La sección `verification.generatedPaths` declara artefactos que un build puede producir y que no deben confundirse con cambios manuales. `verification.build` permite distinguir una verificación pendiente de una verificación realmente ejecutada.

## Linear, issues y worktrees

El kit solo define el contrato genérico. El adapter decide cómo consultar Linear, cómo nombrar branches, dónde crear worktrees, cómo copiar `.env`, qué DB template usar, cómo asignar puertos y cómo limpiar.

Un proyecto sin adapter puede usar el fallback básico: consultar el identificador de issue si existe una integración, crear branch desde la base indicada y crear un worktree Git. No promete DB, secrets, servers ni sincronización de Linear.

El flujo esperado es:

1. `qz-start-issue HOS-NNN` valida el issue y el estado permitido.
2. El adapter crea branch/worktree desde `develop` por defecto o desde `staging` mediante parámetro explícito.
3. Se sincronizan envs desde la fuente protegida del proyecto y se prepara la DB template si el adapter lo soporta.
4. El agente trabaja en el worktree.
5. `qz-close-issue` ejecuta verify, resume resultados, actualiza el estado externo y limpia solo lo declarado por el adapter.

## Suscripciones, dashboard y tray

El dashboard local corre en `http://127.0.0.1:4319/`. Lee snapshots y fuentes locales sin mostrar secretos. La interfaz presenta Claude, OpenAI y NAN Builder con el mismo peso visual, fecha humana y actualización periódica.

```bash
qz-kit subscriptions
qz-kit subscriptions status
qz-kit subscriptions install
qz-kit subscriptions tray
```

El tray KDE usa un entorno Python aislado. Si falta `python3-venv`, el instalador puede pedir autorización para instalarlo mediante `apt`; no instala paquetes del proyecto dentro de sus worktrees. El servicio de usuario se registra para iniciar con la sesión y consulta los mismos datos del dashboard.

El popup muestra barras de uso/restante por proveedor, nombre `NAN Builder` y etiquetas legibles para Claude. En KDE/StatusNotifier el hover no es confiable: el comportamiento soportado es abrir con click y cerrar con un segundo click. Si el popup no aparece, revisar el servicio y ejecutar el tray en foreground.

## Seguridad y límites

- Nunca se leen ni se imprimen valores de `.env`, tokens, cookies o claves privadas.
- Las operaciones de lectura se pueden ejecutar automáticamente.
- Instalación, escritura de configuración, servicios, Git, Linear, DB y shell requieren el flujo explícito correspondiente.
- Push, merge, producción, migraciones destructivas, borrado de memoria y cambios en permisos no son efectos implícitos.
- Los adapters deben validar rutas y evitar escribir fuera del proyecto o de directorios de estado declarados.

## Diagnóstico rápido

```bash
qz-kit check
qz-kit external doctor
qz-engram doctor
qz-gentle doctor
qz-kit subscriptions status
systemctl --user status qz-subscriptions-tray.service
```

Si OpenAI aparece temporalmente sin datos, el proveedor local puede no responder al momento de la consulta; repetir `status` o usar refresh. Eso no invalida los datos de Claude o NAN Builder. Los valores de uso y límites solo se consideran verificados cuando la fuente local o API correspondiente respondió correctamente.

## Desarrollo y publicación

Para cambiar una capacidad:

1. editar la fuente en `qz-agent-kit`;
2. actualizar tests y documentación;
3. ejecutar `npm run check`, `npm test` y `npm run release:check`;
4. revisar el plan de instalación y la procedencia;
5. publicar una versión y ejecutar `qz-kit update` en cada máquina.

No se editan directamente los archivos proyectados en `~/.config`, `~/.local`, `~/.gentle-shell` ni dentro de un CLI. Si una proyección se desvió, se diagnostica y se regenera desde la fuente.
