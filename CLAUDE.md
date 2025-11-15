# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`sqlite-search` is an Electron-based desktop application for searching SQLite databases using full-text search (FTS5). Built with Vue 3 + Vuetify 3 + Electron.

## Development Commands

### Running the Application
- **Development mode**: `npm run electron:serve` - Starts the app with hot-reload and dev tools
- **Web development**: `npm run serve` - Runs Vue app in browser (without Electron)
- **Build production**: `npm run electron:build` - Creates distributable Electron app

### Code Quality
- **Lint**: `npm run lint` - Run ESLint to check code style
- **Build web**: `npm run build` - Build Vue app for production

## Architecture

### Electron IPC Communication Pattern

The application uses a strict separation between main process (Node.js) and renderer process (browser):

1. **Main Process** (`src/background.js`): Handles all database operations via sqlite3
   - IPC handlers: `perform-search`, `get-table-list`, `get-columns`, `change-database`, `open-file-dialog`
   - Maintains single global `db` connection that gets replaced when user selects new database
   - Only searches FTS5 tables (filters with `sql LIKE '%USING FTS5%'`)

2. **Preload Script** (`src/preload.js`): Exposes safe API via contextBridge
   - Creates `window.electronAPI` with methods like `performSearch()`, `getTableList()`, etc.
   - All IPC communication goes through this bridge for security

3. **Renderer Process** (`src/App.vue`): Vue 3 single-file component with Vuetify UI
   - Uses `window.electronAPI` to communicate with main process
   - Manages application state and localStorage persistence

### FTS5 Search Implementation

Search queries use SQLite FTS5 column filter syntax:
```javascript
// Constructs: {column1 column2 column3}: searchTerm
const matchQuery = `{${selectedColumns.join(' ')}}: ${searchTerm}`;
const query = `SELECT * FROM ${selectedTable} WHERE ${selectedTable} MATCH ?`;
```

This allows searching specific columns within FTS5 virtual tables.

### State Persistence

The app uses localStorage to persist:
- `databasePath`: Currently selected database file path
- `selectedTable`: Last selected FTS5 table
- `selectedColumns`: Array of columns to search within
- `theme`: Dark/light theme preference

State is loaded on app initialization and updated when user makes changes.

### Database Connection Lifecycle

1. App starts with default path: `app.getPath('userData')/db/db.sqlite`
2. If file doesn't exist, connection is null until user selects database
3. When user selects new database via file dialog:
   - Old connection is closed
   - New connection is initialized in read-only mode
   - Tables/columns are reset
   - localStorage is cleared for table/column selections

## Key Files

- `src/background.js`: Main Electron process, all SQLite operations
- `src/preload.js`: Context bridge for secure IPC
- `src/App.vue`: Main Vue component with entire UI
- `src/main.js`: Vue app initialization with Vuetify
- `src/components/HelloWorld.vue`: Unused boilerplate component
- `src/config/faqPageConfig.json`: FAQ modal content
- `src/config/footerConfig.json`: Footer links configuration
- `vue.config.js`: Build configuration including Electron builder options

## Important Notes

- **SQLite externals**: `sqlite3` is marked as external in vue.config.js to prevent webpack bundling
- **FTS5 requirement**: Application only works with FTS5 virtual tables, not regular SQLite tables
- **Read-only mode**: Database connections are always opened with `OPEN_READONLY` flag
- **No router**: Single-page app with no Vue Router - all UI is in App.vue
- **Security**: Uses contextIsolation with preload script (modern Electron security pattern)
