# Folder Structure

Annotated `src/` directory:

```
src/
├── app/
│   ├── api/
│   │   └── health/route.ts     # Health check API endpoint
│   ├── globals.css             # Global styles, theme tokens
│   ├── layout.tsx              # Root layout, providers
│   └── page.tsx                # Home page; renders AppShell
├── components/
│   └── ui/                     # Shared UI primitives
│       ├── badge.tsx
│       ├── button.tsx
│       └── tooltip.tsx
├── features/
│   ├── ranker/
│   │   └── index.tsx           # PRanker plugin definition
│   ├── registry.ts             # Plugin registry (list of FeaturePlugin)
│   └── types.ts                # FeaturePlugin interface
├── lib/
│   └── utils.ts                # Utilities (e.g. cn)
└── shell/
    ├── app-shell.tsx           # Main layout: sidebar + content
    ├── app-sidebar.tsx         # Sidebar: plugins nav, theme toggle
    └── providers.tsx           # App-wide providers (theme, etc.)
```
