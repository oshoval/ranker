# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Red Hat, Inc.

.PHONY: dev clean kill fresh build start install lint format typecheck test e2e \
        heal heal-cursor heal-claude prepush license-check

# ── Lifecycle ─────────────────────────────────────────────────

# Install dependencies
install:
	npm install

# Kill all running Next.js processes and clean lock files
kill:
	@echo "Killing Next.js processes..."
	@pkill -f "[n]ext dev" 2>/dev/null || true
	@pkill -f "[n]ext start" 2>/dev/null || true
	@sleep 1
	@rm -f .next/dev/lock
	@echo "Done."

# Remove all caches
clean: kill
	@echo "Cleaning caches..."
	@rm -rf .next
	@rm -rf node_modules/.cache
	@echo "Done."

# Clean everything, install deps, start dev server
fresh: clean install
	@echo "Starting fresh dev server..."
	npm run dev

# Normal dev (kill stale processes first)
dev: kill
	npm run dev

# Production build
build: kill
	npm run build

# Production start
start: kill
	npm run build
	npm run start

# ── Quality ───────────────────────────────────────────────────

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

license-check:
	bash scripts/check-license-headers.sh

# All pre-push checks
prepush: lint typecheck test build license-check
	@echo "All pre-push checks passed."

# ── Self-Healing ──────────────────────────────────────────────

# Heal: collect warnings + errors, print report for manual review
heal:
	bash scripts/ci-heal.sh

# Heal via Cursor agent: collect + fix + triage headlessly
heal-cursor:
	bash scripts/ci-heal-agent.sh cursor

# Heal via Claude Code: collect + fix + triage headlessly
heal-claude:
	bash scripts/ci-heal-agent.sh claude
