#!/usr/bin/env bash
# Read-only shell policy. It validates command text and never reads env values.
set -euo pipefail

usage() { echo 'usage: qz-shell-policy.sh --command TEXT' >&2; }
command_text=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --command) command_text="${2:-}"; shift 2 ;;
    --help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
[ -n "$command_text" ] || { usage; exit 2; }

# Allow local/example/test env references; block production or bare env files.
if printf '%s' "$command_text" | grep -Eiq '(^|[^A-Za-z0-9_])\.env([^A-Za-z0-9_.]|$)|(^|[^A-Za-z0-9_])\.env\.(production|prod)([^A-Za-z0-9_]|$)|(^|[^A-Za-z0-9_])(id_rsa|id_ed25519)([^A-Za-z0-9_]|$)|\.(pem|key)([^A-Za-z0-9_]|$)'; then
  echo 'shell guard: comando bloqueado por referenciar un archivo sensible' >&2
  exit 1
fi

echo 'shell guard: comando permitido'
