# OpenCode adapter

Distribuye commands y agents portables desde `source/` hacia
`~/.config/opencode/`. La fuente universal `AGENTS.md` y los guards quedan en
`~/.config/qz-agent-kit/` y no se inyectan automáticamente en repositorios.

| Recurso | Destino | Estado |
| --- | --- | --- |
| `qz-*` commands | `~/.config/opencode/commands/` | instalado por el kit |
| `qz-*` agents | `~/.config/opencode/agents/` | instalado por el kit |
| `qz-commands` skill | `~/.config/opencode/skills/qz-commands/SKILL.md` | instalado por el kit |
| `qz-agents` skill | `~/.config/opencode/skills/qz-agents/SKILL.md` | instalado por el kit |
| plugins/config | no administrados por el kit | deliberado |
| `AGENTS.md` | store central del kit | sincronización por proyecto pendiente |

El adapter no promete que OpenCode interprete igual los recursos de otros
clientes; sólo distribuye el formato que el cliente reconoce.
