# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`sqlite-search` is a modern Electron-based desktop application for searching SQLite databases using full-text search (FTS5). Built with Vue 3 Composition API + Vuetify 3 + Electron + Pinia + electron-vite.

## Development Commands

### Running the Application

- **Development mode**: `pnpm run dev` - Starts the app with hot-reload and dev tools (electron-vite)
- **Build**: `pnpm run build` - Builds the app (creates dist-electron/)
- **Create distributable**: `pnpm run build:dist` - Creates distributable Electron app with electron-builder
- **Preview**: `pnpm run preview` - Preview production build

### Code Quality

- **Lint**: `pnpm run lint` - Run ESLint with auto-fix
- **Format**: `pnpm run format` - Format code with Prettier
- **Type check**: `pnpm run typecheck` - Run TypeScript type checking

## Architecture

### Modern Vue 3 Architecture

The application follows SOLID principles with a modular, maintainable architecture:

1. **Pinia State Management** (Composition API)
   - `src/stores/database.store.js` - Database connection state (path, tables, columns, selections)
   - `src/stores/search.store.js` - Search state (term, results, loading, errors)
   - `src/stores/ui.store.js` - UI state (theme, dialogs, snackbar notifications)
   - All stores use Composition API pattern with `ref()`, `computed()`, and functions
   - Automatic localStorage persistence for user preferences

2. **Composables** (Reusable Business Logic)
   - `src/composables/useDatabase.js` - Database operations (select, load tables, reset)
   - `src/composables/useSearch.js` - Search functionality (perform search, clear, copy, view details)
   - `src/composables/useTheme.js` - Theme management with Vuetify integration
   - All composables use Pinia stores and return reactive state + actions

3. **Component Structure** (Vue 3 `<script setup>`)
   - `src/components/ui/` - UI components (AppHeader, HelpDialog, AppSnackbar)
   - `src/components/database/` - Database selectors (TableSelector, ColumnSelector)
   - `src/components/search/` - Search components (SearchInput)
   - `src/components/results/` - Results display (ResultsTable, ResultDetailDialog)
   - All components use modern Composition API with `<script setup>` syntax

4. **Main App** (`src/App.vue`)
   - Lightweight 217-line orchestrator (reduced from 564 lines)
   - Sets up IPC event listeners that bridge Electron events → Pinia stores
   - Manages component composition and layout

### Electron IPC Communication Pattern

The application uses a strict separation between main process (Node.js) and renderer process (browser):

1. **Main Process** (`electron/main/index.js`): Handles all database operations via sqlite3
   - IPC handlers: `perform-search`, `get-table-list`, `get-columns`, `change-database`, `open-file-dialog`
   - Maintains single global `db` connection that gets replaced when user selects new database
   - Only searches FTS5 tables (filters with `sql LIKE '%USING FTS5%'`)
   - Built with electron-vite, outputs to `dist-electron/main/`

2. **Preload Script** (`electron/preload/index.js`): Exposes safe API via contextBridge
   - Creates `window.electronAPI` with methods like `performSearch()`, `getTableList()`, etc.
   - All IPC communication goes through this bridge for security
   - Built with electron-vite, outputs to `dist-electron/preload/`

3. **Renderer Process** (Vue 3 SPA): Modern Vue 3 Composition API application
   - Entry point: `index.html` → `src/main.js` → `src/App.vue`
   - Uses `window.electronAPI` to communicate with main process
   - IPC responses come via event listeners in `App.vue:setupIPCListeners()`
   - Event data flows: Electron IPC → App.vue listeners → Pinia store mutations
   - Composables use direct `window.electronAPI` calls (not promises)
   - Built with Vite + electron-vite, outputs to `dist-electron/renderer/`

### FTS5 Search Implementation

Search queries use SQLite FTS5 column filter syntax:

```javascript
// Constructs: {column1 column2 column3}: searchTerm
const matchQuery = `{${selectedColumns.join(' ')}}: ${searchTerm}`
const query = `SELECT * FROM ${selectedTable} WHERE ${selectedTable} MATCH ?`
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

### Electron Layer

- `electron/main/index.js` - Main Electron process, all SQLite operations
- `electron/preload/index.js` - Context bridge for secure IPC
- `electron.vite.config.mjs` - electron-vite build configuration

### Vue Application

- `src/App.vue` - Main app orchestrator with IPC event bridge (217 lines, Composition API)
- `src/main.js` - Vue app initialization (Pinia + Vuetify + plugins)
- `index.html` - Entry point HTML

### State Management

- `src/stores/database.store.js` - Database state (Pinia Composition API)
- `src/stores/search.store.js` - Search state (Pinia Composition API)
- `src/stores/ui.store.js` - UI state (Pinia Composition API)

### Business Logic (Composables)

- `src/composables/useDatabase.js` - Database operations
- `src/composables/useSearch.js` - Search operations
- `src/composables/useTheme.js` - Theme management

### Components

- `src/components/ui/AppHeader.vue` - Header with navigation
- `src/components/ui/HelpDialog.vue` - Self-contained help system
- `src/components/ui/AppSnackbar.vue` - Global notifications
- `src/components/database/TableSelector.vue` - FTS5 table selector
- `src/components/database/ColumnSelector.vue` - Column multi-selector
- `src/components/search/SearchInput.vue` - Search input with FTS5 hints
- `src/components/results/ResultsTable.vue` - Dense, sortable results table
- `src/components/results/ResultDetailDialog.vue` - Detail view dialog

### Configuration

- `src/config/faqPageConfig.json` - Self-contained FAQ/help content (no external links)
- `src/styles/settings.scss` - Vuetify theme customization
- `package.json` - Dependencies and scripts (pnpm)
- `.prettierrc.json` - Code formatting rules
- `eslint.config.js` - ESLint configuration

## Important Notes

- **Build System**: electron-vite (not vue-cli or webpack) with Vite 6.x
- **Package Manager**: pnpm (required, see `engines` in package.json)
- **SQLite externals**: `sqlite3` is externalized by electron-vite's `externalizeDepsPlugin()`
- **FTS5 requirement**: Application only works with FTS5 virtual tables, not regular SQLite tables
- **Read-only mode**: Database connections are always opened with `OPEN_READONLY` flag
- **No router**: Single-page app with no Vue Router - component composition in App.vue
- **Security**: Uses contextIsolation with preload script (modern Electron security pattern)
- **Composition API**: All components use `<script setup>` syntax (no Options API)
- **IPC Pattern**: Composables use direct `window.electronAPI` calls; responses via App.vue event listeners
- **Reactive Arrays & IPC**: Must use `Array.from()` to convert Pinia reactive arrays before IPC transfer
- **Self-Contained**: All documentation embedded in app, no external links (GitHub, etc.)
