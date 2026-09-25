---
description: Prepara un handoff completo para otra sesión o agente
---

Ejecutá primero `qz handoff --plan --json`. Usá ese JSON como fuente de los
hechos del worktree, branch, cambios, commits y estado read-only.

Encerrá todo el resultado entre estos marcadores, en líneas separadas:

```text
===== BEGIN QZ HANDOFF =====
...
===== END QZ HANDOFF =====
```

Incluí contexto, trabajo realizado, hallazgos, decisiones, pendientes,
bloqueos y una única acción siguiente. Separá hechos de inferencias. No hagas
commit, push, cambios en el issue tracker, escrituras en memoria ni ediciones
del proyecto. No incluyas secretos, tokens, `.env`, cookies ni logs completos.
