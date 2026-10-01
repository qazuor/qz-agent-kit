---
name: qz-shell-safety
description: Política portable para comandos de shell y archivos de entorno.
triggers:
  - bash
  - shell
  - .env
  - secretos
  - variables de entorno
---

# Shell y archivos de entorno

- `.env.local`, `.env.example` y `.env.test` pueden referenciarse cuando la
  tarea lo necesita, sin mostrar sus valores.
- `.env`, `.env.production`, `.env.prod`, claves privadas y credenciales deben
  bloquearse antes de ejecutar el comando.
- El guard analiza el texto del comando, no el contenido de los archivos.
- Una instrucción del agente no reemplaza el guard: el adapter del harness debe
  ejecutarlo antes de Bash/terminal.
- Los archivos staged se validan además con `staged-secrets.sh` antes de commit.
