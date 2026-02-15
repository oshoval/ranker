# PRanker

Prioritize pull requests by review complexity. Enter a GitHub repo, get PRs scored on size, age, review activity, file types, and cross-cutting impact.

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # Add your GITHUB_TOKEN
npm run dev                         # http://localhost:3000
```

See [Getting Started](getting-started/README.md) for full setup instructions.

## What's Inside

- **Scoring Engine** -- 7-dimension complexity scoring (1-10 scale)
- **Filters** -- hide drafts, approved, on-hold, conflicts, custom labels
- **PR Table** -- sortable, expandable rows with score badges
- **Log Panels** -- user errors and product diagnostics
- **Plugin Architecture** -- modular feature system
