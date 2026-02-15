# Data Flow

How data moves through PRanker, from user input to scored results.

## Overview

```
User Input          API Layer           GitHub            Scoring           UI
─────────── ──→ ──────────── ──→ ─────────── ──→ ──────────── ──→ ──────────
owner/repo      /api/prs         GraphQL API      7-dimension      PR Table
                  │                  │             scoring            │
                  ├─ validate        ├─ fetch PRs   │                ├─ sort
                  ├─ rate limit      └─ return      ├─ filter        ├─ expand
                  ├─ check cache         data       └─ rank          └─ badges
                  └─ respond                                    
```

## Step by Step

### 1. User enters a repo

The user types `owner/repo` or a GitHub URL into the input field. The `parseRepoInput` function validates and extracts owner + repo.

### 2. Client fetches PRs

The `usePRs` React Query hook calls `GET /api/prs?owner=...&repo=...` with filter parameters. React Query handles caching, background refetching, and error states.

### 3. API validates and fetches

The `handleGetPRs` handler:
- Validates owner/repo format
- Checks per-IP rate limit (10 req/min)
- Checks the TTL cache for recent results
- Calls the GitHub GraphQL API via `GitHubClient`

### 4. Scoring and filtering

On the server side:
- `filterPRs()` applies hold labels, skip labels, draft exclusion, etc.
- `scoringEngine.scorePRs()` evaluates each PR across 7 dimensions
- Results are sorted by score (descending) and returned

### 5. UI renders results

The `PRTable` component displays scored PRs with:
- Sortable columns (score, title, lines, files, dates)
- Color-coded score badges with tooltip breakdowns
- Expandable rows with branch, label, and file details
- Stats cards showing totals and filtered counts

## Caching

- **Server**: TTL cache (5 min default) per owner/repo/limit key
- **Client**: React Query with 2 min stale time, background refetch on window focus
