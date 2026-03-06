# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`sqlite-search` is a modern Electron-based desktop application for searching SQLite databases using full-text search (FTS5). Built with Vue 3 Composition API + Vuetify 3 + Electron + Pinia + electron-vite.

## Development Commands

```bash
# Development with hot-reload
pnpm run dev

# Build electron-vite output (dist-electron/)
pnpm run build

# Create distributable installer (electron-builder)
pnpm run build:dist

# Full build + distribute in one step
pnpm run dist

# Code quality
pnpm run lint          # ESLint with auto-fix
pnpm run format        # Prettier
pnpm run typecheck     # vue-tsc type checking
```

### Testing

```bash
# Unit tests (Vitest)
pnpm run test              # Watch mode
pnpm run test:run          # Single run
pnpm run test:coverage     # With coverage report (threshold: 60%)
pnpm run test:ui           # Vitest UI

# Run a single test file
npx vitest run tests/unit/electron/search.spec.js

# Run tests matching a pattern
npx vitest run -t "escapeFts5SearchTerm"

# E2E tests (Playwright) - requires built app
pnpm run build             # Must build first
pnpm run test:e2e          # Headless
pnpm run test:e2e:headed   # With visible window
pnpm run test:e2e:debug    # With Playwright inspector
pnpm run test:e2e:setup    # Generate test database
```

## Architecture

### Three-Process Electron Architecture

1. **Main Process** (`electron/main/index.js`): Node.js process handling all SQLite operations
   - IPC event listeners: `perform-search`, `get-table-list`, `get-columns`, `change-database`, `browse-table`, `get-table-row-count`
   - IPC handlers (async): `open-file-dialog`, `export-to-csv`, `export-to-excel`, `get-current-database`
   - Security: whitelist validation for table names and column names before any query execution
   - Search utilities extracted to `electron/main/utils/search.js` (FTS5 escaping, syntax detection, query building)
   - Logging to `app.getPath('temp')/sqlite-search-debug.log`

2. **Preload Script** (`electron/preload/index.js`): Exposes `window.electronAPI` via contextBridge

3. **Renderer Process** (Vue 3 SPA): `index.html` → `src/main.js` → `src/App.vue`

### IPC Data Flow

```
Composable calls window.electronAPI.method() → Preload → Main Process
Main Process replies via event.reply('channel') → App.vue setupIPCListeners() → Pinia store mutations
```

Key pattern: Composables initiate IPC calls directly, but responses are received by event listeners in `App.vue` which update Pinia stores. This means composables do NOT return promises from IPC calls.

### State Management (Pinia Composition API)

- `src/stores/database.store.js` - Database path, tables, columns, selections
- `src/stores/search.store.js` - Search term, results, loading, errors
- `src/stores/ui.store.js` - Theme, dialogs, snackbar notifications

All stores use `ref()`, `computed()`, and plain functions (Composition API pattern, not Options API).

### Composables

- `src/composables/useDatabase.js` - Database operations (select, load tables, reset)
- `src/composables/useSearch.js` - Search, copy, view details
- `src/composables/useTheme.js` - Theme management with Vuetify integration

### Component Organization

- `src/components/ui/` - AppHeader, HelpDialog, AppSnackbar
- `src/components/database/` - TableSelector, ColumnSelector
- `src/components/search/` - SearchInput
- `src/components/results/` - ResultsTable, ResultDetailDialog

### FTS5 Search Implementation

Search queries use SQLite FTS5 column filter syntax:

```javascript
// Constructs: {column1 column2 column3}: searchTerm
const matchQuery = `{${selectedColumns.join(' ')}}: ${escapedTerm}`
const query = `SELECT * FROM ${validatedTable} WHERE ${validatedTable} MATCH ?`
```

The search utility (`electron/main/utils/search.js`) handles:
- FTS5 syntax detection (AND/OR/NOT/NEAR, prefix `*`, phrases)
- Special character escaping (quotes terms that contain periods, colons, hyphens, etc.)
- Boolean operator preservation when escaping

### Security Model

- **Whitelist validation**: `validTables[]` and `validColumnsCache` Map are populated when a database is opened; every query validates table/column names against these whitelists before execution
- **Read-only mode**: All database connections use `sqlite3.OPEN_READONLY`
- **Context isolation**: Preload script with contextBridge (no direct Node.js access from renderer)

### Database Connection Lifecycle

1. App starts with default path: `app.getPath('userData')/db/db.sqlite`
2. If file doesn't exist, connection is null until user selects database
3. When user selects new database: old connection closed, new opened read-only, whitelist caches cleared
4. E2E testing: set `SQLITE_SEARCH_TEST_DB` env var to auto-load a database

### State Persistence (localStorage)

`databasePath`, `selectedTable`, `selectedColumns`, `theme` - loaded on init, updated on change.

## Testing

### Unit Tests (`tests/unit/`)

- **Framework**: Vitest + Vue Test Utils
- **Setup file**: `tests/setup.js` - mocks `window.electronAPI`, `localStorage`, suppresses console warnings
- **Config**: `vitest.config.js` (root)
- **Store tests**: Use `setActivePinia(createPinia())` in `beforeEach` for isolation
- **Composable tests**: Mock Vuetify's `useTheme` with `vi.mock('vuetify')`
- **Search utility tests**: `tests/unit/electron/search.spec.js` - 194 lines covering FTS5 escaping, syntax detection, query building

### E2E Tests (`tests/e2e/`)

- **Framework**: Playwright with custom Electron fixtures (`tests/e2e/fixtures/electron.js`)
- **Config**: `playwright.config.js` - 60s timeout, 1 worker (sequential), retries: 0 local / 2 CI
- **Selectors**: Uses `data-testid` attributes (e.g., `[data-testid="search-input"]`)
- **Test database**: Generated by `tests/e2e/test-data/generate-test-db.js`
- **CI note**: E2E tests only run on pushes to main (not PRs); Linux CI uses `xvfb-run` for virtual display

## Important Notes

- **Build System**: electron-vite (not vue-cli or webpack) with Vite 6.x
- **Package Manager**: pnpm required (see `engines` in package.json)
- **SQLite externals**: `sqlite3` is externalized by electron-vite's `externalizeDepsPlugin()`
- **FTS5 only**: Application only works with FTS5 virtual tables, not regular SQLite tables
- **No router**: Single-page app with no Vue Router
- **Composition API only**: All components use `<script setup>` syntax (no Options API)
- **Reactive Arrays & IPC**: Must use `Array.from()` to convert Pinia reactive arrays before IPC transfer
- **Self-contained docs**: All help/FAQ content embedded in app via `src/config/faqPageConfig.json`, no external links
- **Code style**: No semicolons, single quotes, 100 char print width, trailing commas ES5, LF line endings (see `.prettierrc.json`)
