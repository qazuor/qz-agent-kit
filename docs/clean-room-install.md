# Procedimiento clean-room

Este runbook deja una máquina nueva preparada para trabajar con la capa común
`qz-agent-kit`. Es deliberadamente reversible: no copia credenciales, `.env`,
bases de datos ni la memoria de Engram, y no ejecuta instalaciones externas sin
aprobación explícita.

## 1. Obtener y verificar la fuente

```bash
git clone <url-del-repositorio-qz-agent-kit> ~/projects/TOOLS/qz-agent-kit
cd ~/projects/TOOLS/qz-agent-kit
git checkout <commit-o-tag-revisado>
node --version
npm --version
npm install --global .
qz-kit --version
```

La revisión debe estar identificada por commit o tag. El package no debe
contener archivos sensibles.

## 2. Crear el plan interactivo

```bash
qz-kit install
qz-kit plan
qz-kit external-plan
qz-kit readiness --strict
```

El wizard detecta los cuatro harnesses y permite elegir clientes,
componentes y providers. El plan queda en:

```text
~/.config/qz-agent-kit/install-plan.json
```

La selección es auditable y se puede repetir con:

```bash
qz-kit install --from ~/.config/qz-agent-kit/install-plan.json --apply
```

## 3. Aplicar sólo la capa qz

```bash
qz-kit install --apply
qz-kit verify
qz-kit doctor
```

La aplicación crea backups de los destinos administrados y registra un
manifest de rollback. Para revisar antes de escribir:

```bash
qz-kit install --plan
qz-kit verify
```

## 4. Registrar un proyecto

Desde el proyecto que se va a incorporar:

```bash
qz-kit project init /ruta/al/proyecto --plan
qz-kit project init /ruta/al/proyecto --apply
qz-kit project validate /ruta/al/proyecto
qz-kit project register /ruta/al/proyecto
qz-kit project sync /ruta/al/proyecto --check --client all
qz-kit project sync /ruta/al/proyecto --apply --client all
```

El proyecto debe declarar su adapter en `.qz/project.json`. Las reglas
específicas, worktrees, Linear, envs, bases y servidores pertenecen al adapter
del proyecto.

## 5. Componentes externos

Antes de tocar Gentle AI, Engram, Context7, RDD/review o background agents:

```bash
qz-kit external-plan
qz-kit external-plan --strict
```

El modo estricto debe fallar mientras existan acciones que requieran
aprobación. La instalación o configuración externa se ejecuta sólo después de
revisar su comando, sus precondiciones y los backups correspondientes.

Para Engram se requiere además un backup externo verificado antes de cualquier
operación mutante. El instalador qz no importa, exporta, limpia ni modifica la
base de Engram.

## 6. Gate final

```bash
npm run release:check
qz-kit readiness --strict --project /ruta/al/proyecto
```

El procedimiento se considera validado sólo si ambos gates terminan con código
cero y se conserva el manifest de rollback. La prueba debe repetirse en un
HOME o máquina realmente limpia antes de publicar la revisión.

## Rollback

Cada aplicación informa el manifest exacto:

```bash
qz-kit rollback ~/.local/state/qz-agent-kit/backups/<timestamp>/install-manifest.json
```

El rollback restaura sólo destinos registrados por esa ejecución.
