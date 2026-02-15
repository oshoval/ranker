#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.
#
# ci-heal-agent.sh — Run ci-heal.sh and pipe the report to an AI agent
# to fix what it can and triage the rest.
#
# Usage:
#   ./scripts/ci-heal-agent.sh cursor   # run via Cursor agent
#   ./scripts/ci-heal-agent.sh claude    # run via Claude Code

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

AGENT="${1:-}"
if [[ -z "$AGENT" ]]; then
  echo "Usage: $0 <cursor|claude>" >&2
  exit 1
fi

# ── Collect the report ────────────────────────────────────────────────
REPORT=$(./scripts/ci-heal.sh 2>/dev/null) || true

if [[ -z "$REPORT" ]]; then
  echo "No CI data collected." >&2
  exit 0
fi

# ── Build the prompt ──────────────────────────────────────────────────
PROMPT="$(cat <<'EOF'
Below is a CI heal report for this repo. Follow the INSTRUCTIONS section exactly:

1. Check if each warning/error matches an already-triaged key — if so, skip it
2. If fixable: fix it, commit the fix (one commit per logical change)
3. If not fixable: add to docs/OPEN_ISSUES.md with a new CI-WARN-xxx or CI-ERR-xxx key
4. If needs human judgment: also add to docs/NEEDS_HUMAN.md with the key and what's needed (keep this minimal)
5. Do NOT push — leave commits local for review

Here is the report:

EOF
)${REPORT}"

# ── Run the agent ─────────────────────────────────────────────────────
case "$AGENT" in
  cursor)
    echo "Running Cursor agent..." >&2
    agent -p -f "$PROMPT"
    ;;
  claude)
    echo "Running Claude Code..." >&2
    claude -p "$PROMPT"
    ;;
  *)
    echo "Unknown agent: $AGENT (use 'cursor' or 'claude')" >&2
    exit 1
    ;;
esac
