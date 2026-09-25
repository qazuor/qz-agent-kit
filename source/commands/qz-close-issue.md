---
description: Preflight de cierre de una issue sin mutar estado
---

Ejecutá primero `qz env --drift --json`; si no está limpio, detené el cierre y
reportá únicamente claves y estados pendientes. Luego ejecutá:

```text
qz close-issue --plan --issue ISSUE-ID
```

Usá el resultado para resumir criterios de cierre, Git, commits, spec/closeout,
issue tracker, PR/CI, smoke gates y worktrees. No marques Done, no publiques
comentarios, no limpies worktrees y no ejecutes push, merge ni otras
mutaciones.
