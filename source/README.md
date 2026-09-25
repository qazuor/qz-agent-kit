# Fuente de verdad

Esta carpeta contiene los recursos portables del kit. Los adapters generan el
formato que necesita cada cliente; no se editan copias instaladas a mano.

- `agents/`: agentes comunes y sus límites.
- `skills/`: conocimiento especializado cargado bajo demanda.
- `commands/`: commands `qz-*` que delegan en scripts deterministas.
- `prompts/`: templates para clientes que los exponen como slash commands.
- `policies/`: reglas de permisos y seguridad.
- `guards/`: validaciones ejecutables sin secretos.
- `instructions/`: instrucciones universales (`AGENTS.md`) que se distribuyen
  como referencia administrada por el kit y no contienen reglas de un proyecto
  concreto.
