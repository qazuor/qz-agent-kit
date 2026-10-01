---
description: Prepara una issue de backlog con confirmación humana
---

Usá el adapter del proyecto para `qz-linear-backlog`. No llames directamente a
la API de Linear ni inventes team, estado o labels.

Primero generá el borrador y mostrá al usuario título, descripción, tipo,
prioridad, labels y destino. Sólo después de una confirmación explícita se
puede crear la issue. Si el adapter no tiene escritura implementada, informá
`pending-adapter` y no mutés Linear.
