#!/usr/bin/env bash
# Update graphify-out/ from the command line - no agent session needed.
# Uses an LLM backend key from .env.local if one is set (full AST + semantic
# extraction); otherwise falls back to a code-only update.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if ! command -v graphify >/dev/null 2>&1; then
  echo "error: graphify CLI not found on PATH. Install with: pip install graphifyy (or: uv tool install graphifyy)" >&2
  exit 1
fi

# Scope the graph to code + documentation: docs/, src/, contact-worker/.
# `graphify extract` only takes one root, so everything else at the repo
# root (agent-tooling dirs, generated reports, specs/, data/, etc.) is
# excluded at runtime - this stays correct even as new top-level files show
# up later, without a hand-maintained exclude list going stale.
include_dirs=(docs src contact-worker)
exclude_args=()
for entry in * .[!.]*; do
  [ -e "$entry" ] || continue
  keep=false
  for dir in "${include_dirs[@]}"; do
    if [ "$entry" = "$dir" ]; then
      keep=true
      break
    fi
  done
  $keep || exclude_args+=(--exclude "$entry")
done

if [ -n "${GEMINI_API_KEY:-}${GOOGLE_API_KEY:-}${ANTHROPIC_API_KEY:-}${OPENAI_API_KEY:-}${DEEPSEEK_API_KEY:-}${MOONSHOT_API_KEY:-}${AZURE_OPENAI_API_KEY:-}" ]; then
  # Pin gemini explicitly - .env.local may also carry other backend keys
  # (e.g. OPENAI_API_KEY for an unrelated proxy) that auto-detect could
  # otherwise pick up first.
  graphify extract . "${exclude_args[@]}" --backend gemini
else
  echo "note: no LLM backend key set in .env.local - running a code-only update." >&2
  graphify update . "${exclude_args[@]}"
fi

graphify cluster-only .
graphify export wiki
