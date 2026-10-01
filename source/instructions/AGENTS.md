# QZ agent instructions

Estas reglas son universales para los agentes que consumen el kit.

## Fuente de verdad y cambios

- Leer las instrucciones del proyecto y su `.qz/project.json` antes de actuar.
- Mantener separado lo genérico (`qz-*`) de lo específico del proyecto.
- Usar los scripts declarados por el adapter para operaciones repetibles.
- No leer, imprimir ni copiar secretos, tokens, claves privadas, cookies o `.env`.

## Seguridad y estado

- Tratar inspecciones y validaciones como read-only salvo autorización explícita.
- Pedir autorización antes de commits, pushes, merges, cambios externos o acciones destructivas.
- Confirmar el worktree, branch y proyecto antes de modificar archivos.
- Mantener los cambios pequeños, verificables y reversibles.

## Verificación

- Ejecutar el verificador del proyecto cuando el adapter lo declare.
- Informar qué fue verificado, qué fue inferido y qué quedó pendiente.
- No afirmar que una integración está migrada sólo porque un archivo fue copiado.

## Estilo y permisos comunes

- Aplicar `qz-output-style` para mantener el mismo idioma, tono, evidencia y
  formato en OpenCode, Claude Code, Codex y Gentle Shell.
- Aplicar `qz-permissions` junto con los permisos nativos del harness.
- Si el harness no puede expresar una regla de `qz-permissions`, informarlo y
  usar el guard externo correspondiente; no ignorar la diferencia.

## Seguridad operativa universal

- No crear commits hasta que el usuario confirme el resultado.
- No agregar atribución de IA ni menciones de herramientas a commits o PRs.
- Ejecutar tareas pesadas secuencialmente y con el alcance más pequeño posible.
- Auditar `git status` y `git log` después de agentes en background.
- Antes de reintentar CI, revisar que el PR no esté `DIRTY` o `CONFLICTING`.

El proyecto puede extender estas reglas en su propio `AGENTS.md`; sus reglas
específicas tienen prioridad dentro de ese proyecto.
