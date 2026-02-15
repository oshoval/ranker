#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.
#
# Verify all .ts/.tsx source files have the SPDX license header.
# Exit 1 if any are missing.

set -euo pipefail

HEADER="SPDX-License-Identifier: Apache-2.0"
EXIT_CODE=0
COUNT=0
MISSING=0

while IFS= read -r -d '' file; do
  COUNT=$((COUNT + 1))
  if ! head -n 3 "$file" | grep -q "$HEADER"; then
    echo "MISSING: $file"
    MISSING=$((MISSING + 1))
    EXIT_CODE=1
  fi
done < <(find src __tests__ e2e -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 2>/dev/null)

echo ""
echo "Checked $COUNT files, $MISSING missing headers."
exit $EXIT_CODE
