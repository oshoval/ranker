#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.
#
# Collect eslint and tsc warnings for AI agent consumption.

set -euo pipefail

echo "=== ESLint warnings ==="
npx eslint . --format compact 2>&1 || true

echo ""
echo "=== TypeScript warnings ==="
npx tsc --noEmit 2>&1 || true
