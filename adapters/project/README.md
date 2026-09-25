# Project adapters

Un project adapter describe cómo se aplican los workflows genéricos a un
repositorio concreto. No contiene credenciales ni implementa los comandos del
kit; declara el proveedor de issues, branches, worktrees, env, base de datos,
servidores y prefijos del proyecto.

Cada proyecto mantiene su configuración en `.qz/project.json` y declara el
nombre del adapter en `adapter`. Un adapter puede extender un command `qz-*`
con comportamiento del proyecto, pero no cambia la fuente de verdad común.

`commands.dispatch` es opcional durante el registro, pero debe declararse para
habilitar `qz <comando>`. Cuando existe, apunta a un dispatcher determinista
del proyecto y se ejecuta desde la raíz del repositorio. `qz doctor` informa
si está declarado; `qz` falla explícitamente si se intenta usar sin él.
