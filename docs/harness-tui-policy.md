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

## Gate antes de agregar un plugin

1. identificar el problema concreto;
2. comprobar si OpenCode, Codex, Claude o Gentle Shell ya lo resuelven;
3. revisar código, permisos, actividad y compatibilidad;
4. probarlo aislado en un proyecto fixture;
5. medir costo de contexto, CPU, memoria y superficie de seguridad;
6. documentar rollback y decisión de mantenerlo o descartarlo.
