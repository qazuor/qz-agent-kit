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

## Modelos gratuitos de OpenCode

OpenCode mantiene un catálogo gratuito independiente de suscripciones. Se conservan porque no requieren credenciales ni pago adicional:

- `opencode/big-pickle`
- `opencode/ling-3.0-flash-fin-free`
- `opencode/longcat-2.5-preview-free`
- `opencode/mimo-v2.6-flash-free`
- `opencode/muse-spark-1.3-contributor-free`
- `opencode/nemotron-3-ultra-free`
- `opencode/nemotron-3.5-lightning-free`
- `opencode/space-bunny-free`

Se verificó `opencode/mimo-v2.6-flash-free` con una ejecución read-only; respondió correctamente y registró costo cero. Se mantienen visibles para tareas simples, exploración y fallback.

## Alcance por harness

- **OpenCode**: provider custom `nan` mediante `@ai-sdk/openai-compatible`; credencial fuera del repositorio.
- **Gentle Shell**: provider `nan` con API `openai-completions`; credencial fuera del repositorio.
- **Codex y Claude Code**: no se modifican en esta etapa. Su compatibilidad con NaN se evaluará posteriormente mediante adapters o router, sin cambiar sus defaults actuales.

## Seguridad

La API key vive en un archivo externo con permisos restrictivos y nunca se copia a repositorios, artifacts, logs ni documentación.

## Selector común

`qz-kit model status` muestra el default de OpenCode y Gentle Shell. `qz-kit model use provider/model` cambia ambos y guarda un backup reversible en `~/.local/state/qz-agent-kit/model-switch-backups/`. No modifica credenciales, Codex ni Claude Code.
