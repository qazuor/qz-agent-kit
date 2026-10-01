---
name: qz-safety
description: Reglas portables para commits, agentes en background, CI y consumo de recursos.
---

# QZ safety

Aplicá estas reglas en cualquier CLI y proyecto antes de ejecutar una
operación que cambie estado.

## Commits y PRs

- Implementá y verificá primero; no hagas `git commit` hasta que el usuario
  confirme que el resultado está aprobado.
- No agregues atribución de IA, nombres de herramientas ni líneas
  `Co-Authored-By` en commits o PRs.
- Antes de publicar, revisá `git status`, el diff y el mensaje final.

## Agentes en background

El reporte de finalización de un agente es una afirmación, no un inventario.
Después de cada tanda:

1. comprobá que el proceso terminó;
2. revisá `git status` y `git log`;
3. compará los archivos cambiados con el alcance solicitado;
4. verificá que no haya commits o escrituras posteriores.

## Recursos

- Ejecutá una tarea pesada por vez.
- No combines suite completa, typecheck, lint o builds pesados en paralelo.
- Preferí una comprobación enfocada y secuencial.

## CI y pull requests

Antes de reintentar CI, verificá que el PR no esté `CONFLICTING` o `DIRTY`.
Un PR en conflicto puede no generar workflows `pull_request`; resolver el
conflicto es la corrección, no repetir el mismo disparador.

## Autoridad

Estas reglas son universales. Las reglas de un adapter de proyecto pueden
agregar restricciones, pero no relajar las de seguridad sin una decisión
explícita y documentada.
