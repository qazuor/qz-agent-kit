#!/usr/bin/env bash
# Read-only policy guard for commit/PR metadata and known CI states.
# It never reads secrets and accepts values through arguments or stdin.
set -euo pipefail

usage() {
  echo "usage: qz-workflow-policy.sh [--commit-message FILE] [--pr-body FILE] [--merge-state STATUS]" >&2
}

commit_file=''
pr_file=''
merge_state=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --commit-message) commit_file="${2:-}"; shift 2 ;;
    --pr-body) pr_file="${2:-}"; shift 2 ;;
    --merge-state) merge_state="${2:-}"; shift 2 ;;
    --help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done

failed=0
if [ -n "$commit_file" ] && [ -f "$commit_file" ]; then
  if grep -Eiq 'generated with (claude|opencode|codex|gentle)|co-authored-by:.*(claude|opencode|codex|gentle)|\bai[- ]generated\b' "$commit_file"; then
    echo 'workflow guard: AI attribution in commit metadata' >&2
    failed=1
  fi
fi
if [ -n "$pr_file" ] && [ -f "$pr_file" ]; then
  if grep -Eiq 'generated with (claude|opencode|codex|gentle)|co-authored-by:.*(claude|opencode|codex|gentle)|\bai[- ]generated\b' "$pr_file"; then
    echo 'workflow guard: AI attribution in PR metadata' >&2
    failed=1
  fi
fi
case "${merge_state^^}" in
  DIRTY|CONFLICTING)
    echo "workflow guard: PR merge state is ${merge_state}; resolve conflicts before retrying CI" >&2
    failed=1
    ;;
esac

if [ "$failed" -ne 0 ]; then exit 1; fi
echo 'workflow guard: metadata and merge state clean'
