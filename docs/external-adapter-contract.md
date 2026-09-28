# Contrato de adapters externos

Los adapters externos describen herramientas que viven fuera de qz-agent-kit,
como Gentle AI, Engram, Context7 o RDD/review. Un manifest declarativo no
equivale a una instalación ejecutable.

## Estados

- `unknown`: no hay manifest conocido.
- `pending-adapter`: existe el componente, pero todavía no tiene ejecutor
  verificado.
- `planned`: existe un comando de preview y un plan declarativo.
- `review-required`: el plan no coincide con el alcance verificado.
- `applied`: sólo puede aparecer después de una ejecución explícita con
  aprobación y receipt.

## Requisitos de un adapter ejecutable

1. detección read-only del binario y versión;
2. preview reproducible sin mutaciones;
3. lista explícita de archivos y servicios que puede cambiar;
4. backup verificable antes de aplicar;
5. aprobación humana separada del preview;
6. ejecución con argumentos estructurados y allowlist de binarios;
7. receipt con versión, commit, comandos, destinos y resultado;
8. rollback documentado o límite explícito cuando no sea posible;
9. prueba aislada en HOME temporal;
10. prueba de compatibilidad con las versiones soportadas.

## Restricciones

- Nunca tomar un string del manifest y ejecutarlo con un shell sin validación.
- Nunca copiar auth, `.env`, bases o memoria como efecto implícito.
- Nunca hacer upgrade, sync, import, delete, consolidate o cloud operation sin
  aprobación específica.
- Nunca marcar `applied` porque el binario exista.
- Nunca ocultar warnings de versión, lock contention o drift.

## Flujo previsto

```text
plan → preview → backup → aprobación → apply → receipt → verify → rollback
```

Hasta completar estos requisitos, `external-plan` sólo describe acciones y
`external-plan --strict` debe bloquearlas. `external-preview` puede ejecutar
únicamente el preview declarado por el manifest, sin shell y sin mostrar su
salida; devuelve estado, código de salida y una huella del resultado. No es un
`apply` y no convierte un preview exitoso en una instalación aplicada.
