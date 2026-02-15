#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.
#
# Self-healing: collect all warnings/errors and format for AI agent.
# Also runs: license header check, secret file detection.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  PRanker Self-Healing Report"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "========================================"
echo ""

echo "--- License Header Check ---"
bash "$SCRIPT_DIR/check-license-headers.sh" 2>&1 || true
echo ""

echo "--- Secret File Detection ---"
SECRETS_FOUND=0
for pattern in ".env" ".env.local" ".env.production" "*.pem" "*.key" "*.p12"; do
  if git ls-files --cached | grep -q "$pattern"; then
    echo "WARNING: tracked secret file matching '$pattern'"
    SECRETS_FOUND=1
  fi
done
if [ $SECRETS_FOUND -eq 0 ]; then
  echo "OK: No tracked secret files found."
fi
echo ""

echo "--- Warnings ---"
bash "$SCRIPT_DIR/ci-warnings.sh" 2>&1 || true
echo ""

echo "--- Errors ---"
bash "$SCRIPT_DIR/ci-errors.sh" 2>&1 || true
echo ""

echo "========================================"
echo "  Report complete"
echo "========================================"
