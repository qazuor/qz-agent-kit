# Claude Code adapter

Distribuye commands y agents portables hacia `~/.claude/commands/` y
`~/.claude/agents/`. Mantiene `qz-*` como convención común y no genera
`hops-*`.

Las instrucciones universales y guards se conservan en el store central del
kit; no se sobreescribe `~/.claude/CLAUDE.md`, `AGENTS.md`, settings, hooks ni
credenciales. La activación de instrucciones por proyecto requiere una etapa
explícita del adapter.
