# Matriz de auth y providers

El kit distingue presencia, configuración y funcionamiento. La primera puede
auditarse sin abrir secretos; las otras dos requieren pruebas específicas del
harness y autorización para cualquier login o escritura.

| Harness | Detección segura | Evidencia disponible | No se concluye automáticamente |
|---|---|---|---|
| OpenCode | binario, versión, ruta de auth y config | `providers list` puede listar OpenAI OAuth y GitHub Copilot por nombre | que el token sea válido o que un modelo responda |
| Gentle Shell | binario, versión, home aislado y auth path | `--help` expone gestión de auth delegada a Pi | provider/modelo seleccionado o login funcional |
| Claude Code | binario, versión, `.claude` y credentials path | presencia de configuración administrada | sesión válida o permisos efectivos |
| Codex | binario, versión, `.codex` y auth path | `login`, `doctor` y configuración declarados por el CLI | credencial válida o provider remoto operativo |

## Reglas del inventario

- Sólo se muestran nombres de variables de entorno y rutas, nunca valores.
- No se ejecutan login, logout, setup, upgrade ni comandos que escriban auth.
- Un archivo presente no equivale a autenticación válida.
- Un provider listado no equivale a acceso funcional al modelo.
- Las pruebas funcionales se ejecutan separadamente, con un modelo elegido y
  una autorización explícita.

## Gate recomendado

1. `qz-kit ecosystem` para presencia y rutas.
2. `qz-kit plan` para revisar selección de clientes/providers.
3. `qz-kit preflight --strict` para detectar faltantes.
4. Login manual en cada harness seleccionado.
5. Smoke no mutante con el modelo elegido.
6. Registrar versión, provider y resultado sin registrar credenciales.
