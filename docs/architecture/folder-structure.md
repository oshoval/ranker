# Folder Structure

```
src/
├── app/                            # Next.js App Router
│   ├── api/
│   │   ├── health/route.ts         # Health check endpoint
│   │   ├── logs/
│   │   │   ├── product/route.ts    # Product error logs (admin-gated)
│   │   │   └── user/route.ts       # User-facing error logs
│   │   └── prs/route.ts            # PR fetch, score, filter endpoint
│   ├── globals.css                 # Global styles, theme tokens
│   ├── layout.tsx                  # Root layout, providers
│   └── page.tsx                    # Home page; renders AppShell
├── components/
│   └── ui/                         # Shared UI primitives (Radix-based)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── table.tsx
│       └── tooltip.tsx
├── features/
│   ├── ranker/                     # PRanker plugin
│   │   ├── api/prs.ts              # Business logic for PR endpoint
│   │   ├── components/
│   │   │   ├── pr-filter-view.tsx   # Main view: repo input, filters, stats
│   │   │   ├── pr-table.tsx         # Sortable, expandable PR table
│   │   │   └── score-badge.tsx      # Color-coded score badge
│   │   ├── hooks/use-prs.ts        # React Query hook for fetching PRs
│   │   ├── index.tsx               # Plugin definition
│   │   ├── lib/
│   │   │   ├── filter-config.ts    # Default filter configuration
│   │   │   ├── filters.ts          # PR filtering logic
│   │   │   └── scoring/
│   │   │       ├── engine.ts       # Scoring engine orchestrator
│   │   │       ├── heuristics.ts   # Scoring dimension calculations
│   │   │       └── types.ts        # Score types, file categories
│   │   └── types/index.ts          # Ranker-specific types
│   ├── registry.ts                 # Plugin registry (list of FeaturePlugin)
│   └── types.ts                    # FeaturePlugin interface
├── lib/
│   └── utils.ts                    # Utilities (cn helper)
├── shared/
│   ├── github/
│   │   ├── client.ts               # GitHub API client (GraphQL + REST)
│   │   └── types.ts                # GitHub API types
│   ├── storage/logs.ts             # In-memory log storage
│   ├── types/index.ts              # Shared types (GitHubPR, etc.)
│   └── utils/
│       ├── admin-auth.ts           # Admin authentication helper
│       ├── cache.ts                # TTL cache for API responses
│       └── logger.ts               # Structured logger
└── shell/
    ├── app-shell.tsx               # Main layout: sidebar + content + logs
    ├── app-sidebar.tsx             # Sidebar: nav, theme, log toggles
    ├── product-log-panel.tsx       # Product error log panel (admin)
    ├── providers.tsx               # App-wide providers (theme, query)
    └── user-log-panel.tsx          # User error log panel
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js routing and API endpoints |
| `src/components/ui/` | Reusable UI primitives |
| `src/features/` | Plugin modules (each self-contained) |
| `src/shared/` | Cross-cutting utilities and clients |
| `src/shell/` | App frame (sidebar, layout, log panels) |
| `e2e/` | Playwright E2E tests |
| `__tests__/` | Jest unit/component tests |
| `scripts/` | Self-healing and CI helper scripts |
