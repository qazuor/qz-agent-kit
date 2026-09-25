---
description: Opera artifacts locales versionados mediante qz
---

Usá el subcomando determinista de `qz` según la operación:

- `qz artifact validate <bundle>` para validar un bundle local.
- `qz artifact publish <bundle>` para publicar un snapshot.
- `qz artifact list` para listar artifacts disponibles.
- `qz artifact state <slug>` para leer el estado persistido de un artifact.

El adapter hace el trabajo de filesystem, validación, publicación y estado.
Sólo agregá una explicación narrativa cuando la persona la pida. No edites el
JSON persistido a mano ni uses `localStorage` como fuente de estado.
