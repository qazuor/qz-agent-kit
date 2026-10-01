---
name: qz-linear-backlog
description: Registrar problemas o ideas en el backlog del issue tracker con borrador y confirmación.
triggers:
  - dejar en backlog
  - mandarlo a Linear
  - crear issue
  - registrar problema
---

# Backlog portable

Cuando una observación deba convertirse en trabajo futuro, usá el comando
`qz-linear-backlog` del proyecto. El comando debe:

1. leer la configuración declarativa de `.qz/project.json`;
2. preparar un borrador con título, descripción, tipo, prioridad y labels;
3. mostrar el borrador antes de cualquier escritura;
4. pedir confirmación humana explícita;
5. delegar la mutación al adapter del issue tracker;
6. devolver el identificador y URL creados.

Nunca crees una issue directamente desde el agente si existe el wrapper. Si el
adapter no implementa escritura, devolvé `pending-adapter` y conservá el
borrador sin intentar una mutación alternativa.
