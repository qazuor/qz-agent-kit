# Installers

Los instaladores detectan clientes, crean backups, generan adapters, validan
manifests y permiten rollback. No copian credenciales, `.env`, bases de datos
ni memoria Engram.

El flujo operativo es `plan → backup → apply → verify`; la aplicación debe ser
idempotente y dejar un manifest de procedencia.

El procedimiento reproducible completo está documentado en
[`docs/clean-room-install.md`](../docs/clean-room-install.md). La ejecución
real del clean-room sigue siendo un gate separado y no se simula desde este
repositorio.
