---
name: qz-permissions
description: Política común de permisos, seguridad y operaciones sensibles para los cuatro CLI.
---

# Política de permisos QZ

Esta política es la fuente semántica común para OpenCode, Claude Code, Codex
y Gentle Shell. Cada adapter debe traducirla a su mecanismo nativo y reportar
si alguna regla no puede expresarse.

## Permitir automáticamente

- Lectura de código, documentación y configuración no sensible.
- Diagnósticos read-only y validaciones locales.
- `git status`, `git diff`, `git log` y consultas equivalentes.
- Ejecución de tests o linters que no escriban fuera de sus artefactos normales.
- Scripts qz/hops explícitamente declarados como read-only.

## Pedir autorización

- Crear, modificar o borrar archivos fuera del alcance declarado.
- Commits, push, merges, cambios de branch y creación/cierre de PRs.
- Crear, actualizar o cerrar issues en Linear o GitHub.
- Cambiar bases de datos, worktrees, servidores, puertos o archivos `.env`.
- Instalar, actualizar, desinstalar o habilitar plugins, MCPs o servicios.
- Operar sobre producción o servicios externos.
- Ejecutar comandos destructivos, limpiezas o migraciones.

## Prohibir

- Leer o mostrar valores de secretos, tokens, passwords, cookies o claves privadas.
- Copiar credenciales a repositorios, manifests, logs o recibos.
- Borrar Git, worktrees útiles, specs, Linear, Engram o bases de memoria sin un
  backup y una autorización específica.
- Hacer pasar una inferencia como una verificación.
- Desactivar un guard para evitar una validación.

## Reglas de implementación

- El texto de esta skill no sustituye los permisos nativos del CLI.
- Los guards de qz deben ejecutarse antes de operaciones shell sensibles.
- El `doctor` del kit debe comparar la política proyectada en los cuatro clientes.
- Toda aplicación debe generar backup, manifest y rollback cuando corresponda.
