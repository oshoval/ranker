#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.
#
# Collect build errors and test failures for AI agent consumption.

set -euo pipefail

echo "=== Build errors ==="
npm run build 2>&1 || true

echo ""
echo "=== Test failures ==="
npm run test 2>&1 || true
