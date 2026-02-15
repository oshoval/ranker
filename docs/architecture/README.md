# Architecture

PRanker uses a plugin-based architecture. Features (like PRanker) are registered as plugins; the sidebar discovers them and renders their UI in the main area.

## Plugin System

- **FeaturePlugin interface**: Each plugin defines `id`, `name`, `description`, `icon`, and a React `component`.
- **Sidebar discovery**: The app sidebar reads the plugin registry and lists all plugins. Selecting one mounts its component in the main content area.
- **Adding a plugin**: Add a new folder under `src/features/` with your plugin implementation, then register it in the plugin registry (add one line to the registry array).
