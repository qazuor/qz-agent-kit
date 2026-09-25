---
description: Ejecuta las verificaciones declaradas por CI
---

Para verificar cambios durante una tarea, ejecutá primero `qz verify --changed`.
El adapter lee el workflow real de CI y corre los checks afectados. Usá
`--full` sólo cuando la persona lo pida o cuando el cambio exija una suite
completa.

Cuando otro agente consuma el resultado, agregá `--json`: debe devolver un
contrato con `status`, pasos, fallos, paquetes afectados y
`mutations: "none"`. Resumí comandos, resultados y fallos sin alterar archivos
ni ocultar errores.
