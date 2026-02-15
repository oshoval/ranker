#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.
#
# dev-errors.sh — Fetch client-side errors captured by the dev error API.
#
# Usage:
#   ./scripts/dev-errors.sh              # show errors (pretty-printed)
#   ./scripts/dev-errors.sh --watch      # poll every 3s
#   ./scripts/dev-errors.sh --watch 5    # poll every 5s
#   ./scripts/dev-errors.sh --clear      # clear captured errors
#   ./scripts/dev-errors.sh --raw        # raw JSON (pipe-friendly)
#   ./scripts/dev-errors.sh --count      # just the count
#
# Reads ADMIN_TOKEN from .env.local if the endpoint is protected (ADMIN_AUTH_ENABLED=true).

set -euo pipefail

BASE_URL="${DEV_ERRORS_URL:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/dev-errors"

# Load ADMIN_TOKEN from .env.local if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.local"
TOKEN="${ADMIN_TOKEN:-}"
if [[ -z "$TOKEN" && -f "$ENV_FILE" ]]; then
  TOKEN=$(grep -E '^ADMIN_TOKEN=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
fi

auth_header=()
if [[ -n "$TOKEN" ]]; then
  auth_header=(-H "Authorization: Bearer ${TOKEN}")
fi

# Colors
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

pretty_print() {
  local json="$1"
  local count
  count=$(echo "$json" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])" 2>/dev/null || echo "?")

  if [[ "$count" == "0" ]]; then
    echo -e "${GREEN}✓ No errors captured${NC}"
    return
  fi

  echo -e "${RED}${BOLD}✗ ${count} error(s) captured${NC}"
  echo ""

  echo "$json" | python3 -c "
import sys, json, textwrap

data = json.load(sys.stdin)
for i, err in enumerate(data['errors'], 1):
    ts = err['timestamp'][11:19]
    typ = err['type']
    msg = err['message']
    src = err.get('source', '')

    print(f'  \033[0;33m[{ts}]\033[0m \033[0;36m{typ}\033[0m')
    # Truncate long messages for readability
    lines = msg.split('\n')
    for line in lines[:8]:
        print(f'    {line[:200]}')
    if len(lines) > 8:
        print(f'    \033[2m... ({len(lines) - 8} more lines)\033[0m')
    if src:
        print(f'    \033[2m@ {src}\033[0m')
    print()
" 2>/dev/null || echo "$json"
}

do_fetch() {
  curl -sf "${auth_header[@]+"${auth_header[@]}"}" "$ENDPOINT" 2>/dev/null
}

do_clear() {
  local resp
  resp=$(curl -sf -X DELETE "${auth_header[@]+"${auth_header[@]}"}" "$ENDPOINT" 2>/dev/null) || {
    echo -e "${RED}Failed to reach ${ENDPOINT}${NC}" >&2
    exit 1
  }
  echo -e "${GREEN}✓ Error log cleared${NC}"
}

cmd_watch() {
  local interval="${1:-3}"
  echo -e "${DIM}Polling ${ENDPOINT} every ${interval}s (Ctrl+C to stop)${NC}"
  echo ""
  local prev_count="-1"
  while true; do
    local json
    json=$(do_fetch) || {
      echo -e "${RED}Failed to reach ${ENDPOINT}${NC}" >&2
      sleep "$interval"
      continue
    }
    local count
    count=$(echo "$json" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])" 2>/dev/null || echo "?")
    if [[ "$count" != "$prev_count" ]]; then
      clear 2>/dev/null || true
      echo -e "${DIM}$(date +%H:%M:%S) — polling every ${interval}s${NC}"
      echo ""
      pretty_print "$json"
      prev_count="$count"
    fi
    sleep "$interval"
  done
}

cmd_count() {
  local json
  json=$(do_fetch) || { echo -e "${RED}Failed to reach ${ENDPOINT}${NC}" >&2; exit 1; }
  echo "$json" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])"
}

# --- Main ---

case "${1:-}" in
  --clear|-c)
    do_clear
    ;;
  --watch|-w)
    cmd_watch "${2:-3}"
    ;;
  --raw|-r)
    json=$(do_fetch) || { echo "Failed to reach ${ENDPOINT}" >&2; exit 1; }
    echo "$json" | python3 -m json.tool
    ;;
  --count|-n)
    cmd_count
    ;;
  --help|-h)
    echo "Usage: $0 [--watch [interval]] [--clear] [--raw] [--count] [--help]"
    echo ""
    echo "  (no args)       Show captured errors (pretty)"
    echo "  --watch, -w [N] Poll every N seconds (default 3)"
    echo "  --clear, -c     Clear all captured errors"
    echo "  --raw, -r       Output raw JSON"
    echo "  --count, -n     Print error count only"
    echo "  --help, -h      Show this help"
    echo ""
    echo "Environment:"
    echo "  DEV_ERRORS_URL    Base URL (default: http://localhost:3000)"
    echo "  ADMIN_TOKEN       Auth token (auto-read from .env.local)"
    ;;
  *)
    json=$(do_fetch) || { echo -e "${RED}Failed to reach ${ENDPOINT}. Is the dev server running?${NC}" >&2; exit 1; }
    pretty_print "$json"
    ;;
esac
