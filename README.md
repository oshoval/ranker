# PRanker

![Beta](https://img.shields.io/badge/status-beta-yellow)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![CI](https://github.com/oshoval/ranker/actions/workflows/ci.yml/badge.svg)

Prioritize pull requests by review complexity. Enter a GitHub repo, get PRs scored on size, age, review activity, file types, and cross-cutting impact. Filter, sort, and focus on the PRs that matter.

## Setup

```bash
npm install
cp .env.local.example .env.local   # Add your GITHUB_TOKEN
npm run dev                   # http://localhost:3000
```

You need a [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope (for private repos) or `public_repo` (for public repos only).

## Usage

1. Enter `owner/repo` or a GitHub URL in the input field
2. PRs load with complexity scores (1-10)
3. Filter by drafts, approvals, conflicts, labels
4. Sort by score, title, or age
5. Expand rows for scoring details

## Development

```bash
make prepush   # lint + typecheck + test + build + license check
make e2e       # Playwright E2E tests
make heal      # Self-healing diagnostic report
```

## License

Apache-2.0 -- see [LICENSE](LICENSE) and [NOTICE](NOTICE).
