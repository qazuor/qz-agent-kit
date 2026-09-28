# Estado TUI por harness · 2026-09-28

## OpenCode

La configuración global existe y es JSON válido. `mouse=false`, `diff_style=auto`, atención con notificaciones sin sonido y atajos explícitos para Home/End y navegación de mensajes. El plugin visual Gentle está registrado bajo `tui-plugins/gentle-logo.tsx`.

Atajos configurados:

- `Home` / `Ctrl+A`: inicio de la línea actual.
- `End` / `Ctrl+E`: final de la línea actual.
- `Ctrl+Home`: inicio del buffer multilinea.
- `Ctrl+End`: final del buffer multilinea.
- `Ctrl+G` / `Ctrl+Alt+G`: primer/último mensaje.

La semántica de scroll con rueda requiere validación interactiva dentro de una sesión real; no se infiere desde el JSON.

## Gentle Shell

Usa modo fullscreen y tema `Gentleman-Cute`. La configuración de provider/modelo permanece separada de la TUI. No existe en el archivo actual un bloque equivalente de keybinds Home/End; se conserva el comportamiento nativo de Pi hasta una prueba interactiva específica.

## Codex y Claude Code

No se modifican en esta etapa. Sus TUIs, plugins y atajos quedan fuera del alcance de este diagnóstico.

## Seguridad

La inspección sólo leyó presencia, estructura y valores no sensibles. No se leyeron credenciales ni contenidos de secretos.
