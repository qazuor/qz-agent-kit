---
name: qz-refine-spec
description: Refinar specs con evidencia del código y decisiones explícitas antes de implementar.
triggers:
  - refinar spec
  - preparar spec
  - hacer implementable una spec
  - spec refinement
---

# Refinamiento portable de specs

Usá este skill sólo para preparar una spec, no para implementar la feature.

1. Confirmá que la spec existe y que su estado en el índice coincide con Git.
2. Leé el código real antes de proponer una solución; separá hechos, inferencias
   y decisiones todavía abiertas.
3. Preguntá las decisiones de producto que cambien el alcance. No las completes
   por conveniencia del agente.
4. Reescribí la spec con user stories, ejemplos, criterios de aceptación,
   catálogo de archivos y dependencias.
5. Marcá el veredicto de ajuste al modelo objetivo: básico, mixto o potente.
6. Si una spec ya fue implementada, corregí el índice y registrá el drift en vez
   de volver a refinarla.

No toques código de producto, no cierres issues automáticamente y no confundas
un PR abierto con una spec pendiente: verificá merge y closeout en Git.
