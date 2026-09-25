---
description: Diagnóstico seguro para iniciar una issue del proyecto
---

Comenzá con `qz env --drift --json`. Si hay variables faltantes, obsoletas o
cruzadas distintas, informalo antes de crear el worktree. Después ejecutá el
adapter en modo plan:

```text
qz start-issue ISSUE-ID --agent <cliente> --dry-run
```

La base, el patrón de branch, el worktree y el agente se resuelven desde
`.qz/project.json`. Si el adapter no tiene implementación propia, qz usa un
fallback genérico que sólo crea Git, instala y construye; reporta explícitamente
que no cubre Linear, envs, DB ni servidores. Pedí autorización explícita antes
de repetirlo sin `--dry-run`, porque esa variante puede crear estado y lanzar
un agente. No reimplementes el workflow en el command.
