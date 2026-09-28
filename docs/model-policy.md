# Política de modelos

La suscripción económica de referencia para OpenCode y Gentle Shell es **NaN Builders**. Su API es compatible con OpenAI y usa `https://api.nan.builders/v1`.

## Modelos iniciales

- `nan/glm5.3-flash`: modelo principal para coding.
- `nan/deepseek-v4-flash`: análisis general y lectura de imágenes.
- `nan/qwen3.8-flash`: respuestas rápidas y tareas simples.
- `nan/mimo-v2.6-flash`: alternativa rápida, sujeta a disponibilidad en la cuenta.
- `nan/gemma4` y `nan/qwen3.6`: alternativas para probar.
- `nan/glm5.3`: sólo si la cuenta tiene tier premium.

Los IDs se mantienen exactamente como los publica NaN. No se deben sustituir por nombres aproximados.

## Alcance por harness

- **OpenCode**: provider custom `nan` mediante `@ai-sdk/openai-compatible`; credencial fuera del repositorio.
- **Gentle Shell**: provider `nan` con API `openai-completions`; credencial fuera del repositorio.
- **Codex y Claude Code**: no se modifican en esta etapa. Su compatibilidad con NaN se evaluará posteriormente mediante adapters o router, sin cambiar sus defaults actuales.

## Seguridad

La API key vive en un archivo externo con permisos restrictivos y nunca se copia a repositorios, artifacts, logs ni documentación.
