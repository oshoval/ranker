# Getting Started

## Prerequisites

- **Node.js** 20+ (22 recommended)
- **GitHub personal access token** with `repo` scope (private repos) or `public_repo` (public only)

## Setup

```bash
git clone <repo-url>
cd ranker
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and set your `GITHUB_TOKEN`.

## Run

```bash
npm run dev    # Start dev server at http://localhost:3000
```

## Next Steps

- [Usage Guide](usage.md) -- how to use the app
