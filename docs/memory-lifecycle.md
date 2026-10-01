# Memoria Claude y conocimiento compartido

`qz memory scan` releva la memoria de proyecto de Claude en modo sólo lectura.
No promociona, modifica ni elimina archivos.

```bash
qz-kit memory scan
qz-kit memory scan --json
qz-kit memory scan --root /ruta/a/memory
qz-kit memory plan --json
```

El resultado clasifica cada archivo como `feedback`, `gotcha`, `procedure`,
`work-item`, `workflow-state`, `architecture` o `context`. Los archivos que
contienen valores con forma de secreto o nombres explícitamente sensibles
quedan bloqueados para revisión manual. El scanner no imprime cuerpos de
memoria ni valores coincidentes.

`memory plan` usa el mismo inventario y agrega una acción sugerida por
candidato. Sigue siendo read-only: no escribe destinos ni elimina archivos.

La promoción futura seguirá este orden:

1. clasificar la memoria;
2. generar o actualizar el destino normativo (guard, skill, command, agent,
   ADR, Linear/specs o Engram);
3. validar el destino;
4. eliminar la memoria original de Claude cuando ya no sea necesaria;
5. actualizar el índice y comprobar que no reaparezca como duplicado.

La eliminación será posterior a la promoción validada. No se conservará una
copia histórica del cuerpo: sólo metadata mínima de procedencia, fingerprint,
destino y fecha, sin secretos.

La fuente normativa será `qz-agent-kit` para conocimiento genérico y el
adapter del proyecto para conocimiento específico. Claude `MEMORY.md` será una
bandeja de entrada local; no se copiará directamente a OpenCode, Codex o
Gentle Shell. Engram conservará contexto semántico que no sea una regla
determinista.
