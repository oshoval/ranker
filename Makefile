# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.

.PHONY: lint format typecheck test e2e build heal prepush license-check

lint:
	npm run lint

format:
	npm run format

typecheck:
	npm run typecheck

test:
	npm run test

e2e:
	npm run test:e2e

build:
	npm run build

license-check:
	bash scripts/check-license-headers.sh

heal:
	bash scripts/ci-heal.sh

prepush: lint typecheck test build license-check
	@echo "All pre-push checks passed."
