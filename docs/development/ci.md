# CI Pipeline

PRanker uses GitHub Actions for continuous integration.

## Jobs

| Job | What it checks |
|-----|---------------|
| **Lint** | ESLint with zero warnings |
| **Typecheck** | TypeScript strict mode |
| **Unit Tests** | Jest test suites |
| **Build** | Next.js production build |
| **E2E Tests** | Playwright browser tests |
| **Security** | `npm audit` at moderate level |

All jobs must pass for the **CI Pass** gate to succeed. Branch protection requires this gate.

## Reading Failures

- **Lint failures**: Check the ESLint output for the file and line number
- **Typecheck failures**: Look for `error TS` codes in the output
- **Test failures**: Jest shows the failing test name and assertion
- **E2E failures**: Playwright report is uploaded as an artifact
- **Security failures**: Review `npm audit` output and update dependencies

## Makefile Targets

```bash
make lint           # Run ESLint
make typecheck      # Run TypeScript check
make test           # Run unit tests
make e2e            # Run E2E tests
make build          # Production build
make license-check  # Verify SPDX headers
make heal           # Self-healing report
make prepush        # All pre-push checks (lint + typecheck + test + build + license)
```

## Dependabot

Dependabot is configured to create weekly PRs for:
- npm dependencies (Mondays, max 10 PRs)
- GitHub Actions (Mondays, max 5 PRs)
