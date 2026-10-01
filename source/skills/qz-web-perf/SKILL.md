---
name: qz-web-perf
description: Auditorías de rendimiento web con navegador, DevTools, Lighthouse y Core Web Vitals. Cargar para medir o mejorar carga, interacción y estabilidad visual.
---

# Web performance portable

Medir antes de recomendar. Usar documentación vigente de web.dev y Chrome
DevTools para umbrales, nombres de métricas y APIs.

## Flujo

1. Confirmar que existe un navegador/MCP de DevTools disponible. Si no existe,
   informar la limitación y no inventar resultados.
2. Medir una carga fría y una navegación representativa.
3. Revisar LCP, INP y CLS; complementar con FCP, TBT, Speed Index y red.
4. Identificar recursos bloqueantes, cadenas de dependencias, imágenes grandes,
   caché y cambios de layout.
5. Relacionar cada recomendación con un impacto medible y una ruta concreta.
6. Repetir la medición después del cambio.

No declarar que una página mejoró sin comparar mediciones equivalentes. No
recomendar cambios con impacto nulo sólo por cumplir una lista.

Fuentes: `https://web.dev/articles/vitals` y la documentación de Chrome DevTools
y Lighthouse. Los datos del sitio auditado no se guardan en la skill.
