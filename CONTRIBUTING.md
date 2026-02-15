# Contributing to PRanker

Thank you for your interest in contributing to PRanker!

## Developer Certificate of Origin (DCO)

All commits must include a `Signed-off-by` line certifying that you wrote the code or have the right to submit it under the project's open-source license.

### How to sign off

```bash
git commit -s -m "feat: your change description"
```

This adds a trailer like:

```
Signed-off-by: Your Name <your.email@example.com>
```

### One-time setup

Make sure your Git config has your name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Signing off past commits

If you forgot to sign off, you can rebase:

```bash
git rebase --signoff HEAD~N
```

Where `N` is the number of commits to sign off.

## Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with signed commits
4. Ensure CI passes (lint, typecheck, tests, build)
5. Open a pull request against `main`

## Code Style

Code style is enforced automatically by Prettier and ESLint via Git hooks. Run locally:

```bash
npm run lint
npm run format
```

## Testing

Run the full test suite before submitting:

```bash
npm run test
```
