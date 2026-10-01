---
description: Consulta segura y descubrible de la memoria Engram
---

Usá `qz engram --help` para ver las operaciones disponibles y elegí siempre la
lectura más acotada que responda la pregunta. Preferí `--json` cuando el
resultado vaya a alimentar otra decisión.

Antes de una migración o cambio de instalación, consultá `qz-kit ecosystem`,
`qz-kit preflight` y `qz-kit backup-plan --project <ruta>`. Esas operaciones
relevan versiones, selección y rutas de backup sin modificar Engram.

Para revisar salud operativa, empezá por un check acotado y por proyecto, por
ejemplo `engram doctor --json --check sqlite_lock_contention --project <name>`.
El doctor completo puede recorrer memoria histórica y tardar o quedar esperando
si hay una sesión MCP concurrente; si supera el timeout, informalo y no lo
reintentes en bucle.

No ejecutes operaciones de escritura (`delete`, `import`, `sync`, `setup`,
`cloud` u otras equivalentes) sin confirmación explícita. Para guardar una
decisión cuando un MCP no puede resolver la sesión, usá sólo el wrapper
determinista, con proyecto explícito:

```bash
qz engram save "Título" "Contenido" --type decision \
  --project hospeda --confirm ENGRAM_SAVE
```

El wrapper fija `ENGRAM_PROJECT` y exige `ENGRAM_SAVE`; no elige una sesión por
recencia. Nunca muestres valores secretos ni trates la memoria como fuente de
verdad del código.
