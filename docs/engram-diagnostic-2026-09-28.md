# Diagnóstico read-only de Engram · 2026-09-28

Se ejecutó `engram projects list` y el check `doctor --json --check sqlite_lock_contention` sin mutaciones.

Engram reportó 203 proyectos registrados. Los proyectos revisados fueron `hospeda`, `hospeda2`, `qz-agent-kit` y `tmp`; todos devolvieron estado `ok`, sin warnings, bloqueos ni errores.

La evidencia común fue SQLite en modo WAL, `busy_timeout_ms=5000` y `checkpoint_busy=0`. No se ejecutaron `delete`, `consolidate`, `prune`, `import`, `sync`, `setup` ni operaciones cloud.

La lista de proyectos sigue requiriendo curación explícita. Este diagnóstico no decide qué memorias conservar y no cambia la base.
