---
name: qz-env-safety
description: Validación portable de variables de entorno, comandos Bash y guardrails locales. Cargar antes de cambiar envs, scripts shell o automatizaciones.
---

# Bash y entorno seguro

La validación debe ser determinista y no leer ni imprimir valores secretos.

## Variables de entorno

- Comparar uso en código contra el registro/schema declarado.
- Distinguir variables obligatorias, opcionales, públicas y secretas.
- Verificar nombres, prefijos por aplicación y reglas de igualdad entre
  servicios cuando el proyecto las declare.
- Usar `.env.example` como contrato de nombres, nunca como fuente de valores.
- Reportar nombres faltantes y drift; ocultar siempre los valores.

## Bash

- Usar `set -Eeuo pipefail` en scripts nuevos cuando sea compatible.
- Citar rutas y argumentos; no construir shell a partir de entrada sin validar.
- Preferir `spawn`/arrays de argumentos a `shell: true`.
- Rechazar rutas fuera del proyecto o del directorio de estado permitido.
- Hacer que los checks sean read-only por defecto y separar explícitamente los
  comandos mutantes.
- Detectar secretos staged y comandos destructivos antes de commit o closeout.

## Resultado

El guard debe devolver nombres, reglas incumplidas y una corrección sugerida,
pero nunca el contenido de `.env`, tokens, cookies o claves. Reutilizar
`qz verify` y `qz preflight` cuando cubran la regla; no duplicar validaciones.
