# Claude Code adapter

Distribuye commands, agents y skills portables hacia `~/.claude/commands/`,
`~/.claude/agents/` y `~/.claude/skills/`. Mantiene `qz-*` como convención
común y no genera `hops-*`.

Las instrucciones universales y guards se conservan en el store central del
kit; no se sobreescribe `~/.claude/CLAUDE.md`, `AGENTS.md`, settings, hooks ni
credenciales. La activación de instrucciones por proyecto requiere una etapa
explícita del adapter.

## Caché portable de rate limits

El kit distribuye `qz-claude-statusline.mjs`. Se puede usar como comando de
statusline de Claude Code: recibe por stdin el JSON de la sesión, extrae sólo
`rate_limits` y escribe el caché estable en
`~/.local/state/qz-agent-kit/subscriptions/claude-usage.json` (o en
`QZ_CLAUDE_USAGE_FILE`). Nunca persiste el JSON completo ni campos ajenos a las
ventanas de uso.

### Activación explícita

El kit no modifica `~/.claude/settings.json` automáticamente. Para activarlo,
la configuración de Claude debe apuntar el `statusLine` al ejecutable instalado:

```json
{
  "statusLine": {
    "type": "command",
    "command": "qz-claude-statusline.mjs"
  }
}
```

La activación debe hacerse después de revisar el settings existente. El
collector no imprime una línea de estado propia: su responsabilidad es
persistir el snapshot para `qz-kit subscriptions refresh`.
