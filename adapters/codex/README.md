# Codex adapter

Distribuye `qz-*` commands y agents como skills bajo `~/.codex/skills/`.
La fuente portable se mantiene separada de cualquier credencial o
configuración de autenticación.

El kit no modifica `~/.codex/auth.json`, profiles, modelos ni policies globales.
Las instrucciones universales quedan en el store central y se incorporarán al
contexto de un proyecto mediante su adapter explícito.
