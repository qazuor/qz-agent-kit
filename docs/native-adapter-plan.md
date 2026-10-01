# Adapters nativos de estilo y permisos

Fecha: 2026-10-01  
Estado: investigación verificada; no se modificaron configuraciones.

La capa semántica común ya está en `source/skills/qz-output-style` y
`source/skills/qz-permissions`. Este documento define cómo se proyectará sin
tratar los cuatro CLI como si tuvieran el mismo formato.

## Claude Code

Claude Code soporta custom output styles como Markdown con frontmatter en
`~/.claude/output-styles`, y permite seleccionar el estilo mediante
`outputStyle` en settings. El estilo custom conserva las instrucciones de
programación si declara `keep-coding-instructions: true`.

Adapter previsto:

- generar `~/.claude/output-styles/qz-output-style.md` desde la fuente común;
- activar `outputStyle: QZ` sólo mediante un cambio explícito y respaldado en
  settings;
- proyectar las reglas de permisos a la sintaxis nativa de Claude sin tocar
  credenciales ni settings ajenos;
- preservar `gentleman.md` como backup hasta validar el reemplazo.

Fuente oficial: [Claude Code output styles](https://code.claude.com/docs/en/output-styles).

El instalador ya incorpora este target nativo con backup y detección de drift.
La activación automática mediante `outputStyle` queda separada: primero se
debe comprobar que no sobrescriba una preferencia elegida por el usuario.

## OpenCode

La documentación V2 actual reconoce el archivo global
`~/.config/opencode/AGENTS.md` y una matriz de permisos ordenada con
`permissions`, `action`, `resource` y `effect`. También advierte que V2 no debe
usar las claves V1 `permission`, `bash` o `task`.

Como el entorno Hospeda se mantiene en OpenCode V1 por compatibilidad con los
plugins actuales, qz-kit no debe escribir una configuración V2 en esta etapa.
El adapter debe detectar la versión antes de elegir entre:

- una instrucción global `AGENTS.md` compatible con V1;
- una configuración V2 con `permissions` sólo cuando el binario y los plugins
  estén validados para V2.

Fuente oficial: [OpenCode instructions](https://dev.opencode.ai/v2/docs/instructions/) y
[OpenCode permissions](https://dev.opencode.ai/v2/docs/permissions/).

En la máquina relevada ya existe un `~/.config/opencode/AGENTS.md` de 14 KB con
bloques marcados como administrados por Gentle AI y Engram. `qz-kit` no debe
reemplazarlo. El plan de instrucciones detecta esos marcadores y exige una
revisión/merge por secciones; los bloques externos se conservan intactos.

## Codex

Codex utiliza `AGENTS.md` como instrucciones persistentes y mantiene su
configuración y sandbox en `~/.codex`. La forma exacta de expresar las reglas
de autorización depende de la versión instalada y no se debe inferir copiando
el formato de OpenCode.

Adapter previsto:

- proyectar la fuente común a la ubicación global `AGENTS.md` que reconozca la
  versión instalada;
- adaptar permisos/sandbox mediante `config.toml` sólo con un schema detectado;
- comprobar el resultado con `codex` en modo read-only;
- no tocar `auth.json`.

Fuente oficial: [Codex custom instructions](https://developers.openai.com/codex/guides/agents-md).

## Gentle Shell

Gentle Shell es el dueño de su runtime Pi, persona, modelos y prompts. La
documentación actual indica que Gentle AI no debe escribir el system prompt de
Pi y que `APPEND_SYSTEM.md` pertenece al ciclo de vida administrado por Gentle
Shell.

Adapter previsto:

- instalar `qz-output-style` y `qz-permissions` como skills/prompts portables;
- no sobrescribir `APPEND_SYSTEM.md`, persona, settings ni assets administrados
  por Gentle;
- usar sólo superficies públicas de Gentle Shell cuando exista un mecanismo
  explícito para agregar instrucciones comunes;
- reportar como parcial cualquier regla que no pueda expresarse sin competir
  con el prompt propietario.

Fuentes oficiales: [Gentle Shell](https://github.com/Gentleman-Programming/gentle-shell),
[Gentle AI Pi integration](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/pi.md).

## Contrato de implementación

Antes de aplicar cualquier adapter nativo, qz-kit debe:

1. detectar versión y ruta efectiva del cliente;
2. generar un plan read-only con archivo, hash anterior y cambio propuesto;
3. respaldar sólo el archivo que va a tocar;
4. escribir únicamente su namespace o archivo administrado;
5. ejecutar `qz-kit parity` y una prueba read-only del CLI;
6. registrar limitaciones de paridad;
7. permitir rollback mediante el manifest.

La skill portable es obligatoria en los cuatro clientes. La configuración
nativa es una optimización adicional y no puede convertirse en una segunda
fuente de verdad.
