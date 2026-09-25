# Installers

Los instaladores detectan clientes, crean backups, generan adapters, validan
manifests y permiten rollback. No copian credenciales, `.env`, bases de datos
ni memoria Engram.

El flujo operativo es `plan → backup → apply → verify`; la aplicación debe ser
idempotente y dejar un manifest de procedencia.
