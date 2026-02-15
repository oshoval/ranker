# Architecture

PRanker is built with Next.js and uses a plugin-based architecture. Features are self-contained modules registered with the app shell.

## Topics

- [Plugin System](plugin-system.md) -- how features are organized and registered
- [Data Flow](data-flow.md) -- from user input to scored PR table
- [Folder Structure](folder-structure.md) -- annotated directory tree

## Key Decisions

- **Plugin pattern**: Each feature (like PRanker) is a standalone module with its own components, hooks, API logic, and tests
- **Server-side scoring**: PRs are scored on the server to keep the scoring algorithm private (OPSEC)
- **Shared infrastructure**: Cross-cutting concerns (GitHub client, cache, logging) live in `src/shared/`
- **Shell separation**: The app frame (sidebar, layout, log panels) is independent of plugins
