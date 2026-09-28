# Política de modelos económicos

La configuración de referencia usa modelos compatibles con la suscripción OpenAI
actual. Los nombres se validaron con smoke tests read-only el 29-09-2026.

| Harness | Modelo principal | Modelo liviano | Estado |
| --- | --- | --- | --- |
| OpenCode | `openai/gpt-5.6-sol` | `openai/gpt-5.6-luna` | probado |
| Codex CLI | `gpt-5.6-sol` | selección explícita por invocación | probado |
| Gentle Shell | `gpt-5.6-sol` | selección explícita por invocación | probado |
| Claude Code | sin cambio | sin cambio | no usa estos modelos OpenAI |

También funcionan en OpenCode `openai/gpt-5.6-sol-fast`, `openai/gpt-5.6-luna-fast`,
`openai/gpt-5.5-fast` y `openai/gpt-6-luna-fast`. Los sufijos `fast` no son
intercambiables entre harnesses: Codex y Gentle Shell aceptan los nombres base
`gpt-5.6-luna` y `gpt-5.6-sol`, pero rechazaron los `fast` probados.

El catálogo puede mostrar modelos que una cuenta ChatGPT no puede usar. En la
cuenta probada, `gpt-5.4-mini`, `gpt-5.3-codex-spark` y `gpt-5.4-fast` fueron
rechazados por el proveedor. No deben configurarse como defaults sólo porque
aparezcan en `opencode models`.

Los valores de autenticación nunca forman parte de esta política ni del repositorio.
