# Política de TUI y plugins

La capa qz distribuye workflows y conocimiento. La TUI, los temas y los
plugins siguen siendo responsabilidad de cada harness porque sus formatos,
permisos y superficies de ejecución no son equivalentes.

## Clasificación

### Global

- atajos de edición del prompt;
- preferencia de tema base;
- comportamiento de notificaciones;
- política general de mouse y scroll;
- plugins aprobados para todos los proyectos.

### Por proyecto

- commands y skills del adapter;
- browser, worktree o MCP específico;
- puertos, rutas y servidores del proyecto;
- plugins que necesitan acceso al código o al entorno del proyecto.

### Externo

- credenciales;
- MCP remotos;
- providers y modelos;
- telemetría;
- servicios de notificación.

## Reglas de instalación

- El instalador enumera rutas y presencia, pero no habilita plugins por
  accidente.
- Cada plugin debe declarar si accede a filesystem, shell, red o telemetría.
- Un plugin de comunidad necesita validación de compatibilidad con la versión
  del harness antes de entrar al plan.
- Un plugin que duplica una función nativa queda fuera por defecto.
- La configuración global no debe contener reglas de negocio del proyecto.
- Los cambios se aplican con backup, manifest y rollback.

## OpenCode

La configuración de TUI se mantiene separada de la configuración de workflows.
La política acordada para la migración es:

- tema oscuro por defecto;
- selector de tema disponible;
- `mouse: false` cuando se necesite scroll/selección nativos del terminal;
- Home y End con semántica normal de edición del prompt;
- Ctrl+Home y Ctrl+End para el buffer multilínea;
- notificaciones visuales activas y sonido desactivado;
- no instalar un plugin de TUI si la versión del harness no lo soporta.

La semántica exacta de los binds se valida en la versión instalada antes de
versionar una configuración global.

## Relevamiento de la máquina de referencia

El 28-09-2026 se verificaron las versiones instaladas sin leer credenciales:

| Harness | Versión observada | Configuración TUI relevante |
| --- | --- | --- |
| OpenCode | `1.18.32` | `~/.config/opencode/tui.json`, `mouse: false`, tema oscuro, atención visual sin sonido y binds Home/End separados del buffer |
| Gentle Shell | `3.7.0` | `~/.gentle-shell/agent/settings.json`; tema administrado por Gentle Shell, sin equivalente portable de los binds de OpenCode verificado |
| Claude Code | `2.1.284` | configuración y atajos propios del cliente; no se copia desde OpenCode |
| Codex CLI | `0.155.0` | configuración TUI propia; no se copia desde OpenCode |

La configuración de OpenCode se pudo parsear y contiene los binds acordados,
pero la validación automatizada de la semántica física de Home/End, scroll y
mouse todavía requiere una sesión TUI interactiva. Por eso esta evidencia no
marca completa la tarea de compatibilidad TUI: confirma la configuración
versionada y deja pendiente la prueba de comportamiento por harness.

## Gate antes de agregar un plugin

1. identificar el problema concreto;
2. comprobar si OpenCode, Codex, Claude o Gentle Shell ya lo resuelven;
3. revisar código, permisos, actividad y compatibilidad;
4. probarlo aislado en un proyecto fixture;
5. medir costo de contexto, CPU, memoria y superficie de seguridad;
6. documentar rollback y decisión de mantenerlo o descartarlo.
