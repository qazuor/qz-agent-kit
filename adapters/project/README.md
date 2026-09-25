# Project adapters

Un project adapter describe cómo se aplican los workflows genéricos a un
repositorio concreto. No contiene credenciales ni implementa los comandos del
kit; declara el proveedor de issues, branches, worktrees, env, base de datos,
servidores y prefijos del proyecto.

Cada proyecto mantiene su configuración en `.qz/project.json` y declara el
nombre del adapter en `adapter`. Un adapter puede extender un command `qz-*`
con comportamiento del proyecto, pero no cambia la fuente de verdad común.
