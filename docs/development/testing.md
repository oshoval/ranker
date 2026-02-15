# Testing

PRanker uses Jest for unit/component tests and Playwright for E2E tests.

## Unit Tests

```bash
npm run test           # Run all unit tests
npm run test:coverage  # Run with coverage report
```

Tests live in `__tests__/` mirroring the `src/` structure.

### Writing Tests

- Place tests in `__tests__/<path matching src>/<name>.test.ts(x)`
- Mock external dependencies (GitHub API, storage)
- API handler tests need `node` test environment (use `@jest-environment node` docblock or the split test command)

## E2E Tests

```bash
npm run test:e2e  # Run Playwright E2E tests
```

E2E tests live in `e2e/` and use Playwright with Chromium.

### Test Suites

| Suite | What it covers |
|-------|---------------|
| `basic-flow.spec.ts` | Page load, sidebar, theme toggle, health API |
| `pr-ranking.spec.ts` | Enter repo, see PRs, sort, expand, empty states |
| `error-paths.spec.ts` | 401, 404, 429, 500 error handling |
| `user-log-panel.spec.ts` | Log panel toggle, entries, clear |
| `product-log-panel.spec.ts` | Admin panel access, entries, clear |

### Mocking

All E2E tests mock API responses using Playwright's `page.route()`. No real GitHub token is needed for E2E tests.

## Coverage

Run `npm run test:coverage` to generate a coverage report. Target: >80% for business logic files.
