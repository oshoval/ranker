# Plugin System

PRanker uses a plugin architecture so features are self-contained modules that can be added or removed independently.

## How It Works

1. Each plugin implements the `FeaturePlugin` interface
2. Plugins are registered in `src/features/registry.ts`
3. The sidebar reads the registry and creates navigation items
4. Selecting a plugin mounts its React component in the main content area

## FeaturePlugin Interface

A plugin must provide:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name in sidebar |
| `description` | string | Short description |
| `icon` | React component | Lucide icon for sidebar |
| `component` | React component | Main UI rendered in content area |

## Adding a Plugin

See [Adding a Plugin](../development/adding-a-plugin.md) for a step-by-step guide.

## Design Principles

- **Self-contained**: Each plugin owns its components, hooks, API logic, and types
- **No cross-plugin imports**: Plugins communicate only through shared infrastructure (`src/shared/`)
- **Independent testing**: Each plugin's tests live in `__tests__/features/<plugin>/`
