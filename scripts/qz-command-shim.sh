#!/usr/bin/env bash
set -euo pipefail

name="$(basename "$0")"
command="${name#qz-}"
if [ "$command" = "$name" ] || [ -z "$command" ]; then
  echo "qz shim inválido: $name" >&2
  exit 2
fi

exec "$(dirname "$0")/qz" "$command" "$@"
