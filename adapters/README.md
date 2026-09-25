# Adapters

Cada adapter transforma la fuente común al formato de un cliente. El adapter
no duplica la lógica del workflow: genera archivos, registra hashes y declara
las capacidades que el cliente puede aplicar.

Los adapters soportados son `opencode`, `claude`, `codex` y `gentle-shell`.
Las diferencias de permisos, TUI, agentes y descubrimiento se documentan en
el adapter correspondiente.
