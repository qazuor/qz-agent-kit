# Continuidad de Engram

La DB viva de Engram no forma parte de Git ni del repositorio de un proyecto.
El objetivo es poder reinstalar una máquina sin perder memoria y poder
verificar un restore antes de volver a usarlo.

## Reglas

- El instalador qz nunca lee, copia, importa, exporta, limpia ni actualiza la
  DB de Engram.
- La DB viva permanece local y fuera del repositorio.
- Cada backup debe tener fecha, origen, tamaño y checksum.
- No se sincroniza una DB SQLite viva mientras hay escritores activos.
- No se prueba un restore encima de la DB productiva: se usa un HOME aislado.
- Un backup no se considera válido hasta que se restaura y se verifica.

## Backup futuro

Antes de cualquier `setup`, upgrade, import, delete, consolidate, prune o
cloud operation:

1. detener temporalmente los procesos que escriben en Engram;
2. identificar la ruta real de la DB y sus archivos auxiliares WAL/SHM;
3. producir una copia consistente mediante el mecanismo SQLite elegido;
4. guardar la copia en un directorio de backup externo al repositorio;
5. calcular checksum y registrar versión de Engram, proyecto y fecha;
6. conservar al menos dos copias independientes antes de mutar nada.

La ruta detectada por `qz-kit ecosystem` sirve para inventario, pero no es una
autorización para copiarla automáticamente.

## Verificación read-only

Después del backup y antes de una migración se deben ejecutar, sin reparaciones:

```bash
engram version
engram stats --all
engram projects list
engram doctor --json --check sqlite_lock_contention --project <project>
```

Si `doctor` informa lock contention, WAL inconsistente o timeout, se detiene el
procedimiento y se corrige la causa antes de usar el backup.

## Restore aislado

El restore se prueba en un HOME temporal o una instalación aislada de Engram:

1. crear el HOME aislado;
2. colocar allí una copia del backup, sin tocar `~/.engram` activo;
3. iniciar Engram apuntando explícitamente al HOME aislado;
4. ejecutar `version`, `stats`, `projects list` y el check SQLite;
5. comparar conteos, proyectos y checksums con el inventario previo;
6. registrar el resultado y conservar el backup original.

No se ejecutan `import`, `consolidate`, `prune`, `sync` ni upgrades durante una
prueba de restore.

## Continuidad entre PCs

La estrategia recomendada es:

- DB viva local;
- snapshots cifrados fuera de Git;
- almacenamiento privado con retención y versionado;
- checksum por snapshot;
- restore periódico en entorno aislado;
- una copia offline adicional para recuperación ante errores del proveedor.

La implementación concreta del almacenamiento queda deliberadamente abierta
hasta elegir proveedor, cifrado y política de retención. El instalador sólo
debe orquestar el procedimiento después de una aprobación explícita.
