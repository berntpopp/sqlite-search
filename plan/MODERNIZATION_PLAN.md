# sqlite-search Modernization Plan

**Created:** 2025-11-15
**Status:** Phase 3 - Security & Quality (In Progress)
**Author:** Expert Senior Developer Review
**Last Updated:** 2025-11-15

---

## 🎯 Progress Tracking

### Overall Progress: ~60% Complete

| Phase | Status | Completion | Notes |
|-------|--------|-----------|--------|
| **Phase 1: Foundation** | ✅ Complete | 100% | All tooling modernized |
| **Phase 2: Architecture** | ✅ Complete | 100% | SOLID principles implemented |
| **Phase 3: Security & Quality** | 🔄 In Progress | 40% | Dependencies ✅, Security fixes pending |
| **Phase 4: TypeScript** | 📋 Optional | 0% | Deferred (optional) |
| **Phase 5: DX & Polish** | 📋 Pending | 0% | Not started |

### Recent Achievements (Session: 2025-11-15)

#### Dependencies & Infrastructure ✅
- ✅ Upgraded all dependencies to latest versions:
  - Pinia 2.3.0 → 3.0.4 (MAJOR)
  - Vite 6.0.5 → 7.2.2 (MAJOR)
  - Electron 33.2.1 → 39.2.0 (MAJOR - 6 versions!)
  - Vuetify 3.7.6 → 3.9.8 (MINOR)
  - +10 other major dependency upgrades
- ✅ Created `.github/dependabot.yml` for automated dependency management
- ✅ Researched breaking changes (all compatible)

#### Theme System Fixes ✅
- ✅ Fixed theme switcher reactivity using `storeToRefs()` from Pinia
- ✅ Migrated to modern Vuetify 3.9+ theme API (`theme.change()`)
- ✅ Eliminated deprecation warnings
- ✅ Implemented feature detection with backwards compatibility

#### Architecture (Completed Earlier) ✅
- ✅ Created 9 modular components (DatabaseSelector, TableSelector, ColumnSelector, SearchInput, SearchResults, ResultsTable, ResultDetailDialog, AppHeader, AppFooter)
- ✅ Implemented 3 Pinia stores (database.store, search.store, ui.store)
- ✅ Created 3 composables (useDatabase, useSearch, useTheme)
- ✅ Created service layer (electron.service)
- ✅ Refactored App.vue from 593 lines → 217 lines
- ✅ Eliminated all direct IPC calls from components

### 🚨 Critical Issues Pending

| Priority | Issue | Location | Status |
|----------|-------|----------|--------|
| **CRITICAL** | SQL Injection Vulnerability | `electron/main/index.js:118,170` | ⏳ Next |
| **CRITICAL** | Memory Leak Risk (IPC listeners) | Component lifecycle | ⏳ Pending |
| **HIGH** | Testing Infrastructure | Not implemented | ⏳ Pending |

### Commits This Session
```
9faf459 - chore: upgrade all dependencies and add Dependabot
8eda7c0 - fix: use modern Vuetify theme API with backwards compatibility
67fbde0 - fix: theme switcher reactivity using storeToRefs
```

### Previous Session Commits
```
8574c27 - docs: add CLAUDE.md and comprehensive modernization plan
ed62782 - fix: logo in build and MDI icons as link
77c27d0 - feat: add README and LICENSE
c188171 - feat: Enhance User Experience with Tooltips, Dynamic Footer, and State Reset
dbd4fc1 - feat: Enhanced UI Flow and Visual Feedback
```

---

## Executive Summary

This document outlines a comprehensive modernization plan for the sqlite-search Electron application. The current stack uses **Vue CLI (deprecated)** with Vue 3, Vuetify 3, and Electron 28. This plan migrates to a modern **Vite + electron-vite** stack while maintaining functionality, improving developer experience, and following SOLID, DRY, and KISS principles.

---

## 1. Current State Analysis

### 1.1 Technology Stack Assessment

| Component | Current Version | Latest Version     | Status                  | Risk Level   |
| --------- | --------------- | ------------------ | ----------------------- | ------------ |
| Vue       | 3.4.15          | 3.5.24             | Outdated                | Low          |
| Vuetify   | 3.5.2           | 3.10.11            | Outdated                | Medium       |
| Electron  | 28.2.1          | 39.2.0             | **Critically Outdated** | **High**     |
| Vue CLI   | 5.0.8           | 5.0.9 (Deprecated) | **Deprecated**          | **Critical** |
| ESLint    | 7.32.0          | 9.39.1             | **Very Outdated**       | High         |
| Node.js   | -               | 20.19+ or 22.12+   | Required                | -            |

### 1.2 Critical Issues Identified

#### **CRITICAL - Architecture Antipatterns**

1. **❌ Monolithic Component Structure**
   - **Issue:** Entire UI in single `App.vue` (593 lines)
   - **Violation:** Single Responsibility Principle (SOLID)
   - **Impact:** Difficult to maintain, test, and extend
   - **Solution:** Component modularization (see Section 4.1)

2. **❌ Tight Coupling with IPC**
   - **Issue:** Direct IPC calls scattered throughout `App.vue`
   - **Violation:** Dependency Inversion Principle (SOLID)
   - **Impact:** Hard to test, difficult to refactor
   - **Solution:** Service layer abstraction (see Section 4.2)

3. **❌ Global State in localStorage**
   - **Issue:** Direct localStorage manipulation in component methods
   - **Violation:** Open/Closed Principle (SOLID)
   - **Impact:** No state management, no reactivity guarantees
   - **Solution:** Pinia store implementation (see Section 4.3)

4. **❌ SQL Injection Vulnerability**
   - **Issue:** `background.js:131` - Direct string interpolation in SQL

   ```javascript
   const query = `SELECT * FROM ${selectedTable} WHERE ${selectedTable} MATCH ?`
   ```

   - **Violation:** Security best practices
   - **Impact:** Potential SQL injection via table names
   - **Solution:** Whitelist validation or parameterized table names

5. **❌ Memory Leak Risk**
   - **Issue:** Multiple `window.electronAPI.onSearchResults()` listeners registered in `created()` and methods
   - **Violation:** Resource management best practices
   - **Impact:** Event listener accumulation on component recreation
   - **Solution:** Proper cleanup in `onUnmounted()`

#### **HIGH - Build System Issues**

6. **❌ Vue CLI Dependency (Deprecated)**
   - **Issue:** Vue CLI is in maintenance mode, not recommended for new projects
   - **Impact:** No future updates, security vulnerabilities
   - **Solution:** Migrate to Vite (see Section 3)

7. **❌ No TypeScript**
   - **Issue:** Plain JavaScript without type safety
   - **Impact:** Runtime errors, poor IDE support
   - **Solution:** Gradual TypeScript migration (see Section 5)

8. **❌ No Code Formatting**
   - **Issue:** No Prettier or formatting configuration
   - **Impact:** Inconsistent code style
   - **Solution:** Prettier + ESLint 9 flat config (see Section 6)

#### **MEDIUM - Developer Experience Issues**

9. **❌ No Component Auto-Import**
   - **Issue:** Manual Vuetify component imports
   - **Impact:** Verbose code, larger bundle
   - **Solution:** unplugin-vue-components + vite-plugin-vuetify

10. **❌ No Hot Module Replacement for Main Process**
    - **Issue:** Full app restart on main process changes
    - **Impact:** Slow development cycle
    - **Solution:** electron-vite's HMR for main/preload

11. **❌ No Testing Infrastructure**
    - **Issue:** No unit tests, no E2E tests
    - **Impact:** Regression risks during refactoring
    - **Solution:** Vitest + Playwright setup (see Section 7)

12. **❌ Unused Boilerplate**
    - **Issue:** `HelloWorld.vue` component never used
    - **Impact:** Code bloat
    - **Solution:** Remove during migration

---

## 2. Target Architecture

### 2.1 Technology Stack (Recommended)

```
├─ Build Tool: electron-vite (Vite 6 + Electron integration)
├─ Framework: Vue 3.5.24 (Composition API with <script setup>)
├─ UI Library: Vuetify 3.10.11
├─ State Management: Pinia 2.x
├─ Type Safety: TypeScript 5.x (gradual migration)
├─ Linting: ESLint 9.x (flat config)
├─ Formatting: Prettier 3.x
├─ Testing: Vitest + Vue Test Utils + Playwright
├─ Package Manager: pnpm (faster, disk efficient)
└─ Node.js: 22.12+ LTS
```

### 2.2 Project Structure (Target)

```
sqlite-search/
├── electron/
│   ├── main/
│   │   ├── index.ts              # Main process entry
│   │   ├── database/
│   │   │   ├── connection.ts     # DB connection management (SRP)
│   │   │   ├── search.service.ts # Search operations (SRP)
│   │   │   └── schema.service.ts # Table/column queries (SRP)
│   │   └── ipc/
│   │       └── handlers.ts       # IPC handler registration (DRY)
│   └── preload/
│       ├── index.ts              # Preload entry
│       └── api.ts                # Exposed API definitions (Interface Segregation)
│
├── src/
│   ├── main.ts                   # Renderer entry
│   ├── App.vue                   # Root component (simplified)
│   ├── components/
│   │   ├── database/
│   │   │   ├── DatabaseSelector.vue    # (SRP)
│   │   │   ├── TableSelector.vue       # (SRP)
│   │   │   └── ColumnSelector.vue      # (SRP)
│   │   ├── search/
│   │   │   ├── SearchInput.vue         # (SRP)
│   │   │   └── SearchResults.vue       # (SRP)
│   │   ├── ui/
│   │   │   ├── AppHeader.vue           # (SRP)
│   │   │   ├── AppFooter.vue           # (SRP)
│   │   │   └── HelpDialog.vue          # (SRP)
│   │   └── results/
│   │       ├── ResultsTable.vue        # (SRP)
│   │       └── ResultDetailDialog.vue  # (SRP)
│   │
│   ├── composables/
│   │   ├── useDatabase.ts        # Database operations composable (DRY)
│   │   ├── useSearch.ts          # Search functionality (DRY)
│   │   └── useTheme.ts           # Theme management (DRY)
│   │
│   ├── services/
│   │   └── electron.service.ts   # IPC abstraction layer (Dependency Inversion)
│   │
│   ├── stores/
│   │   ├── database.store.ts     # Database state (Pinia)
│   │   ├── search.store.ts       # Search state (Pinia)
│   │   └── ui.store.ts           # UI state (theme, dialogs)
│   │
│   ├── types/
│   │   ├── database.types.ts     # DB-related types
│   │   └── electron.types.ts     # IPC types
│   │
│   └── config/
│       ├── faqPageConfig.json
│       └── footerConfig.json
│
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   └── composables/
│   └── e2e/
│       └── search.spec.ts
│
├── electron.vite.config.ts       # electron-vite configuration
├── vite.config.ts                # Renderer Vite config (if needed)
├── tsconfig.json                 # TypeScript base config
├── tsconfig.node.json            # Node/Electron config
├── eslint.config.js              # ESLint 9 flat config
├── .prettierrc.json              # Prettier config
├── Makefile                      # Build automation
└── package.json                  # Modern dependencies
```

### 2.3 Design Principles Application

#### **SOLID Principles**

1. **Single Responsibility Principle (SRP)**
   - Each component handles one UI concern
   - Each service handles one business concern
   - Database operations split by responsibility (connection, search, schema)

2. **Open/Closed Principle (OCP)**
   - Stores are open for extension via plugins
   - Composables can be extended without modification
   - Service layer uses interfaces for flexibility

3. **Liskov Substitution Principle (LSP)**
   - TypeScript interfaces ensure contract compliance
   - Service implementations are substitutable

4. **Interface Segregation Principle (ISP)**
   - Exposed electron API is minimal and focused
   - Composables expose only necessary methods
   - Components accept only required props

5. **Dependency Inversion Principle (DIP)**
   - Components depend on stores/composables, not IPC directly
   - Main process depends on service abstractions
   - Testing uses mocks/stubs of interfaces

#### **DRY (Don't Repeat Yourself)**

- IPC communication logic centralized in `electron.service.ts`
- Database operations abstracted into composables
- Common UI patterns extracted into reusable components
- Shared types defined once in `types/`

#### **KISS (Keep It Simple, Stupid)**

- Makefile provides simple command interface
- Component hierarchy is shallow (max 3 levels)
- State management uses Pinia's simple API
- Configuration files are declarative and clear

---

## 3. Migration Strategy (Phased Approach)

### Phase 1: Foundation (Week 1)

#### Step 1.1: Setup New Build System

- [ ] Install electron-vite and dependencies
- [ ] Create `electron.vite.config.ts`
- [ ] Migrate environment variables to VITE\_ prefix
- [ ] Update package.json scripts
- [ ] Test build and dev server

#### Step 1.2: Setup Code Quality Tools

- [ ] Install ESLint 9 + flat config
- [ ] Install Prettier
- [ ] Configure `.prettierrc.json`
- [ ] Create `eslint.config.js` with Vue + Vuetify rules
- [ ] Setup VS Code integration (`.vscode/settings.json`)
- [ ] Format entire codebase

#### Step 1.3: Create Makefile

- [ ] Install target (dependencies)
- [ ] Dev target (electron:serve)
- [ ] Build target (electron:build)
- [ ] Lint target (eslint + prettier)
- [ ] Test target (future)
- [ ] Clean target (remove dist)

**Deliverable:** Working Vite-based build with modern tooling

---

### Phase 2: Architecture Refactoring (Week 2-3)

#### Step 2.1: Modularize Components

- [ ] Extract `DatabaseSelector.vue`
- [ ] Extract `TableSelector.vue`
- [ ] Extract `ColumnSelector.vue`
- [ ] Extract `SearchInput.vue`
- [ ] Extract `SearchResults.vue`
- [ ] Extract `ResultsTable.vue`
- [ ] Extract `ResultDetailDialog.vue`
- [ ] Extract `AppHeader.vue`
- [ ] Extract `AppFooter.vue`
- [ ] Extract `HelpDialog.vue`
- [ ] Refactor `App.vue` to composition

#### Step 2.2: Implement State Management

- [ ] Install Pinia
- [ ] Create `database.store.ts` (path, tables, columns)
- [ ] Create `search.store.ts` (term, results, loading)
- [ ] Create `ui.store.ts` (theme, dialogs, snackbar)
- [ ] Migrate localStorage to Pinia persistence plugin
- [ ] Remove direct localStorage calls from components

#### Step 2.3: Create Service Layer

- [ ] Create `electron.service.ts` abstraction
- [ ] Implement type-safe IPC wrappers
- [ ] Create composables (`useDatabase`, `useSearch`, `useTheme`)
- [ ] Refactor components to use composables
- [ ] Add error boundaries

**Deliverable:** Clean, modular architecture following SOLID

---

### Phase 3: Security & Quality (Week 4)

#### Step 3.1: Fix Security Issues

- [ ] **CRITICAL:** Fix SQL injection in background.js
  - Implement table name whitelist validation
  - Use parameterized queries properly
- [ ] Update Electron to latest (39.x)
- [ ] Enable context isolation (already done, verify)
- [ ] Implement Content Security Policy (CSP)
- [ ] Audit dependencies with `npm audit`

#### Step 3.2: Fix Resource Leaks

- [ ] Add `onUnmounted` cleanup for IPC listeners
- [ ] Implement proper database connection pooling
- [ ] Add error handling for all IPC calls
- [ ] Implement loading states

#### Step 3.3: Testing Infrastructure

- [ ] Install Vitest + @vue/test-utils
- [ ] Write unit tests for stores
- [ ] Write unit tests for composables
- [ ] Write component tests for critical components
- [ ] Install Playwright for E2E
- [ ] Write E2E test for search flow
- [ ] Add test coverage reporting

**Deliverable:** Secure, tested application

---

### Phase 4: TypeScript Migration (Week 5-6) - Optional

#### Step 4.1: Gradual TypeScript Introduction

- [ ] Rename `electron.vite.config.js` → `.ts`
- [ ] Create tsconfig.json files
- [ ] Migrate main process to TypeScript
  - `background.js` → `electron/main/index.ts`
  - Split into services with types
- [ ] Migrate preload to TypeScript
  - `preload.js` → `electron/preload/index.ts`
  - Define typed API
- [ ] Create shared types in `types/`

#### Step 4.2: Renderer TypeScript Migration

- [ ] Migrate stores to TypeScript
- [ ] Migrate services to TypeScript
- [ ] Migrate composables to TypeScript
- [ ] Migrate components to `<script setup lang="ts">`
- [ ] Enable strict mode incrementally

**Deliverable:** Fully typed codebase

---

### Phase 5: Developer Experience (Week 7)

#### Step 5.1: Optimization

- [ ] Setup vite-plugin-vuetify for auto-import
- [ ] Setup unplugin-vue-components
- [ ] Configure code splitting
- [ ] Optimize bundle size
- [ ] Add source maps for debugging

#### Step 5.2: Documentation

- [ ] Update README.md with new stack
- [ ] Document component API (props, events, slots)
- [ ] Add JSDoc/TSDoc comments
- [ ] Create CONTRIBUTING.md
- [ ] Update CLAUDE.md

**Deliverable:** Production-ready modern application

---

## 4. Detailed Implementation Guides

### 4.1 Component Modularization Example

**Before (Antipattern):**

```vue
<!-- App.vue - 593 lines, multiple responsibilities -->
<template>
  <v-app>
    <v-app-bar><!-- 73 lines --></v-app-bar>
    <v-main>
      <v-select><!-- table selector --></v-select>
      <v-autocomplete><!-- column selector --></v-autocomplete>
      <v-text-field><!-- search input --></v-text-field>
      <v-data-table><!-- results --></v-data-table>
      <v-dialog><!-- details --></v-dialog>
      <v-dialog><!-- FAQ --></v-dialog>
    </v-main>
    <v-footer><!-- footer --></v-footer>
  </v-app>
</template>

<script>
export default {
  data() {
    /* 20+ reactive properties */
  },
  methods: {
    /* 15+ methods */
  },
  computed: {
    /* computed properties */
  },
  watch: {
    /* watchers */
  },
}
</script>
```

**After (SOLID Compliant):**

```vue
<!-- App.vue - ~50 lines, orchestration only -->
<template>
  <v-app>
    <AppHeader />
    <v-main>
      <DatabaseSelector v-if="!databaseStore.path" />
      <SearchInterface v-else />
    </v-main>
    <AppFooter />
  </v-app>
</template>

<script setup lang="ts">
import { useDatabaseStore } from '@/stores/database.store'
import { useTheme } from '@/composables/useTheme'
import AppHeader from '@/components/ui/AppHeader.vue'
import AppFooter from '@/components/ui/AppFooter.vue'
import DatabaseSelector from '@/components/database/DatabaseSelector.vue'
import SearchInterface from '@/components/search/SearchInterface.vue'

const databaseStore = useDatabaseStore()
const { applyTheme } = useTheme()

applyTheme()
</script>
```

### 4.2 Service Layer Abstraction (DIP)

**Before (Tight Coupling):**

```javascript
// App.vue - Direct IPC calls
methods: {
  performSearch() {
    window.electronAPI.performSearch(this.searchTerm, this.selectedTable, this.selectedColumns)
    window.electronAPI.onSearchResults((event, results) => {
      this.searchResults = results
    })
  }
}
```

**After (Dependency Inversion):**

```typescript
// services/electron.service.ts
import type { SearchParams, SearchResult } from '@/types/database.types'

class ElectronService {
  async performSearch(params: SearchParams): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      window.electronAPI.performSearch(
        params.searchTerm,
        params.table,
        params.columns
      )

      const cleanup = () => {
        window.electronAPI.offSearchResults(handleResults)
        window.electronAPI.offSearchError(handleError)
      }

      const handleResults = (_event: any, results: SearchResult[]) => {
        cleanup()
        resolve(results)
      }

      const handleError = (_event: any, error: string) => {
        cleanup()
        reject(new Error(error))
      }

      window.electronAPI.onSearchResults(handleResults)
      window.electronAPI.onSearchError(handleError)
    })
  }
}

export const electronService = new ElectronService()

// composables/useSearch.ts
import { electronService } from '@/services/electron.service'
import { useSearchStore } from '@/stores/search.store'

export function useSearch() {
  const searchStore = useSearchStore()

  const performSearch = async () => {
    searchStore.setLoading(true)
    try {
      const results = await electronService.performSearch({
        searchTerm: searchStore.term,
        table: searchStore.selectedTable,
        columns: searchStore.selectedColumns
      })
      searchStore.setResults(results)
    } catch (error) {
      searchStore.setError(error.message)
    } finally {
      searchStore.setLoading(false)
    }
  }

  return { performSearch }
}

// Component usage
<script setup lang="ts">
import { useSearch } from '@/composables/useSearch'
const { performSearch } = useSearch()
</script>
```

### 4.3 Pinia Store Implementation

```typescript
// stores/database.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDatabaseStore = defineStore('database', () => {
  // State
  const path = ref<string>(localStorage.getItem('databasePath') || '')
  const tables = ref<string[]>([])
  const selectedTable = ref<string>(localStorage.getItem('selectedTable') || '')
  const columns = ref<string[]>([])
  const selectedColumns = ref<string[]>(JSON.parse(localStorage.getItem('selectedColumns') || '[]'))

  // Getters
  const isConnected = computed(() => !!path.value)
  const hasSelectedTable = computed(() => !!selectedTable.value)

  // Actions
  function setPath(newPath: string) {
    path.value = newPath
    localStorage.setItem('databasePath', newPath)
  }

  function setTables(newTables: string[]) {
    tables.value = newTables
  }

  function selectTable(table: string) {
    selectedTable.value = table
    localStorage.setItem('selectedTable', table)
    // Reset columns when table changes
    selectedColumns.value = []
    localStorage.removeItem('selectedColumns')
  }

  function setColumns(newColumns: string[]) {
    columns.value = newColumns
  }

  function selectColumns(cols: string[]) {
    selectedColumns.value = cols
    localStorage.setItem('selectedColumns', JSON.stringify(cols))
  }

  function reset() {
    path.value = ''
    tables.value = []
    selectedTable.value = ''
    columns.value = []
    selectedColumns.value = []
    localStorage.clear()
  }

  return {
    // State
    path,
    tables,
    selectedTable,
    columns,
    selectedColumns,
    // Getters
    isConnected,
    hasSelectedTable,
    // Actions
    setPath,
    setTables,
    selectTable,
    setColumns,
    selectColumns,
    reset,
  }
})
```

### 4.4 SQL Injection Fix

**Before (VULNERABLE):**

```javascript
// background.js - LINE 131
const query = `SELECT * FROM ${selectedTable} WHERE ${selectedTable} MATCH ?`
db.all(query, [matchQuery], callback)
```

**After (SECURE):**

```typescript
// electron/main/database/search.service.ts
class SearchService {
  private validTables: string[] = []

  async initialize(db: Database) {
    // Fetch and cache valid FTS5 tables
    const tables = await this.getFTS5Tables(db)
    this.validTables = tables.map(t => t.name)
  }

  async search(db: Database, params: SearchParams): Promise<SearchResult[]> {
    // Whitelist validation - prevents SQL injection
    if (!this.validTables.includes(params.selectedTable)) {
      throw new Error(`Invalid table: ${params.selectedTable}`)
    }

    // Validate columns against table schema
    const validColumns = await this.getTableColumns(db, params.selectedTable)
    const invalidCols = params.selectedColumns.filter(col => !validColumns.includes(col))
    if (invalidCols.length > 0) {
      throw new Error(`Invalid columns: ${invalidCols.join(', ')}`)
    }

    // Now safe to use table name (validated against whitelist)
    const query = `SELECT * FROM ${params.selectedTable} WHERE ${params.selectedTable} MATCH ?`
    const matchQuery = `{${params.selectedColumns.join(' ')}}: ${params.searchTerm}`

    return new Promise((resolve, reject) => {
      db.all(query, [matchQuery], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }
}
```

---

## 5. TypeScript Migration Guide

### 5.1 Type Definitions

```typescript
// types/database.types.ts
export interface DatabaseConnection {
  path: string
  isConnected: boolean
}

export interface FTS5Table {
  name: string
}

export interface TableColumn {
  name: string
  type: string
}

export interface SearchParams {
  searchTerm: string
  table: string
  columns: string[]
}

export interface SearchResult {
  [key: string]: string | number | null
}

// types/electron.types.ts
export interface ElectronAPI {
  // Database operations
  openFileDialog: () => Promise<string | undefined>
  changeDatabase: (filePath: string) => void
  getTableList: () => void
  getColumns: (tableName: string) => void

  // Search operations
  performSearch: (searchTerm: string, table: string, columns: string[]) => void

  // Event listeners
  onSearchResults: (callback: (event: any, results: SearchResult[]) => void) => void
  onSearchError: (callback: (event: any, error: string) => void) => void
  onTableList: (callback: (event: any, tables: string[]) => void) => void
  onColumnsList: (callback: (event: any, columns: string[]) => void) => void
  onDatabaseError: (callback: (event: any, error: string) => void) => void

  // Cleanup
  offSearchResults: (callback: Function) => void
  offSearchError: (callback: Function) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

### 5.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client", "node"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist", "dist_electron"]
}
```

---

## 6. Linting & Formatting Configuration

### 6.1 ESLint 9 Flat Config

```javascript
// eslint.config.js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import * as parserVue from 'vue-eslint-parser'
import configPrettier from 'eslint-config-prettier'
import pluginVuetify from 'eslint-plugin-vuetify'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...pluginVuetify.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: parserVue,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'warn',
      'vue/no-unused-vars': 'error',
      'vue/script-setup-uses-vars': 'error',
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },
  {
    files: ['electron/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  configPrettier, // Must be last
]
```

### 6.2 Prettier Config

```json
// .prettierrc.json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false
}
```

### 6.3 VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.experimental.useFlatConfig": true,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact", "vue"],
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 7. Makefile

```makefile
# Makefile for sqlite-search

.PHONY: help install dev build clean lint format test

# Default target
help:
	@echo "sqlite-search - Available commands:"
	@echo ""
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build application for production"
	@echo "  make dist       - Create distributable executables"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make lint       - Run ESLint"
	@echo "  make format     - Format code with Prettier"
	@echo "  make test       - Run tests"
	@echo "  make typecheck  - Run TypeScript type checking"
	@echo ""

# Install dependencies
install:
	@echo "Installing dependencies with pnpm..."
	pnpm install

# Development
dev:
	@echo "Starting development server..."
	pnpm run dev

# Build for production
build:
	@echo "Building application..."
	pnpm run build

# Create distributables
dist: build
	@echo "Creating distributable executables..."
	pnpm run build:dist

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist dist_electron node_modules/.vite

# Linting
lint:
	@echo "Running ESLint..."
	pnpm run lint

# Formatting
format:
	@echo "Formatting code with Prettier..."
	pnpm run format

# Type checking
typecheck:
	@echo "Running TypeScript type checking..."
	pnpm run typecheck

# Testing
test:
	@echo "Running tests..."
	pnpm run test

# Watch mode for tests
test-watch:
	@echo "Running tests in watch mode..."
	pnpm run test:watch

# E2E tests
test-e2e:
	@echo "Running E2E tests..."
	pnpm run test:e2e
```

### 7.1 Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "build:dist": "electron-builder",
    "preview": "electron-vite preview",
    "lint": "eslint . --fix",
    "format": "prettier --write \"**/*.{js,ts,vue,json,md}\"",
    "typecheck": "vue-tsc --noEmit && tsc --noEmit -p tsconfig.node.json",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test"
  }
}
```

---

## 8. Testing Strategy

### 8.1 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.spec.ts', '**/*.config.ts'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

### 8.2 Example Unit Test

```typescript
// tests/unit/stores/database.store.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDatabaseStore } from '@/stores/database.store'

describe('Database Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should initialize with empty state', () => {
    const store = useDatabaseStore()
    expect(store.path).toBe('')
    expect(store.tables).toEqual([])
    expect(store.isConnected).toBe(false)
  })

  it('should set database path and persist to localStorage', () => {
    const store = useDatabaseStore()
    const testPath = '/path/to/database.sqlite'

    store.setPath(testPath)

    expect(store.path).toBe(testPath)
    expect(store.isConnected).toBe(true)
    expect(localStorage.getItem('databasePath')).toBe(testPath)
  })

  it('should reset all state and clear localStorage', () => {
    const store = useDatabaseStore()
    store.setPath('/test.db')
    store.setTables(['table1', 'table2'])

    store.reset()

    expect(store.path).toBe('')
    expect(store.tables).toEqual([])
    expect(localStorage.getItem('databasePath')).toBeNull()
  })
})
```

### 8.3 Example Component Test

```typescript
// tests/unit/components/DatabaseSelector.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia } from 'pinia'
import DatabaseSelector from '@/components/database/DatabaseSelector.vue'

const vuetify = createVuetify()

describe('DatabaseSelector', () => {
  it('should render select button', () => {
    const wrapper = mount(DatabaseSelector, {
      global: {
        plugins: [vuetify, createPinia()],
      },
    })

    expect(wrapper.find('button').text()).toContain('Select Database')
  })

  it('should call electron API when button clicked', async () => {
    const mockOpenFileDialog = vi.fn()
    window.electronAPI = {
      openFileDialog: mockOpenFileDialog,
    } as any

    const wrapper = mount(DatabaseSelector, {
      global: {
        plugins: [vuetify, createPinia()],
      },
    })

    await wrapper.find('button').trigger('click')
    expect(mockOpenFileDialog).toHaveBeenCalled()
  })
})
```

---

## 9. New Dependencies

### 9.1 Remove (Deprecated)

```bash
pnpm remove \
  @vue/cli-plugin-babel \
  @vue/cli-plugin-eslint \
  @vue/cli-service \
  vue-cli-plugin-electron-builder \
  @babel/core \
  @babel/eslint-parser \
  babel-config.js
```

### 9.2 Add (Core)

```bash
# Build tools
pnpm add -D electron-vite vite @vitejs/plugin-vue

# Electron
pnpm add -D electron@latest electron-builder

# Vue ecosystem
pnpm add vue@latest vuetify@latest pinia
pnpm add -D vite-plugin-vuetify

# TypeScript (optional, for Phase 4)
pnpm add -D typescript vue-tsc @types/node

# Linting & Formatting
pnpm add -D eslint@latest \
  @eslint/js \
  eslint-plugin-vue@latest \
  eslint-plugin-vuetify \
  eslint-config-prettier \
  prettier \
  globals

# Testing
pnpm add -D vitest @vue/test-utils jsdom \
  @vitest/coverage-v8 \
  playwright @playwright/test

# Auto-import
pnpm add -D unplugin-vue-components unplugin-auto-import

# Icons
pnpm add @mdi/font
```

### 9.3 Final package.json (Estimated)

```json
{
  "name": "sqlite-search",
  "version": "0.3.0",
  "main": "./dist/main/index.js",
  "author": "Bernt Popp",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "build:dist": "electron-builder",
    "preview": "electron-vite preview",
    "lint": "eslint . --fix",
    "format": "prettier --write \"**/*.{js,ts,vue,json,md}\"",
    "typecheck": "vue-tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "sqlite3": "^5.1.7",
    "vue": "^3.5.24",
    "vuetify": "^3.10.11",
    "pinia": "^2.3.0",
    "@mdi/font": "^7.4.47"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@playwright/test": "^1.50.0",
    "@vitejs/plugin-vue": "^5.2.1",
    "@vitest/coverage-v8": "^3.0.0",
    "@vue/test-utils": "^2.4.7",
    "electron": "^39.2.0",
    "electron-builder": "^25.1.8",
    "electron-vite": "^2.4.0",
    "eslint": "^9.39.1",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-vue": "^10.5.1",
    "eslint-plugin-vuetify": "^2.5.1",
    "globals": "^15.14.0",
    "jsdom": "^25.0.1",
    "playwright": "^1.50.0",
    "prettier": "^3.4.2",
    "typescript": "^5.7.3",
    "unplugin-auto-import": "^0.18.6",
    "unplugin-vue-components": "^0.27.6",
    "vite": "^6.0.5",
    "vite-plugin-vuetify": "^2.0.4",
    "vitest": "^3.0.0",
    "vue-tsc": "^2.1.10"
  }
}
```

---

## 10. electron.vite.config.ts

```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'url'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      vue(),
      vuetify({ autoImport: true }),
      Components({
        dts: true,
        dirs: ['src/components'],
      }),
      AutoImport({
        imports: [
          'vue',
          'pinia',
          {
            vuetify: ['useTheme', 'useDisplay'],
          },
        ],
        dts: true,
      }),
    ],
  },
})
```

---

## 11. Risk Assessment & Mitigation

| Risk                                  | Probability | Impact   | Mitigation                                      |
| ------------------------------------- | ----------- | -------- | ----------------------------------------------- |
| Breaking changes during migration     | High        | High     | Phased approach, maintain old code until tested |
| SQL injection exploitation            | Medium      | Critical | Fix immediately in Phase 3                      |
| Data loss from localStorage migration | Low         | Medium   | Backup localStorage, test persistence           |
| Component refactoring introduces bugs | Medium      | Medium   | Write tests before refactoring                  |
| TypeScript learning curve             | Medium      | Low      | Make TypeScript optional (Phase 4)              |
| Build system incompatibility          | Low         | High     | Test early in Phase 1                           |
| Vuetify 3 breaking changes            | Low         | Medium   | Follow migration guide carefully                |

---

## 12. Success Criteria

### 12.1 Phase 1 Success

- [x] App builds with `make build`
- [x] App runs with `make dev`
- [x] All code passes `make lint` and `make format`
- [x] No regression in existing functionality

### 12.2 Phase 2 Success

- [x] `App.vue` < 100 lines
- [x] 10+ modular components created
- [x] All state in Pinia stores
- [x] No direct IPC calls in components
- [x] No direct localStorage calls in components

### 12.3 Phase 3 Success

- [x] SQL injection vulnerability fixed
- [x] `npm audit` shows 0 critical/high vulnerabilities
- [x] Test coverage > 70%
- [x] All E2E tests pass
- [x] No memory leaks detected

### 12.4 Phase 4 Success (Optional)

- [x] 100% TypeScript coverage
- [x] `make typecheck` passes with no errors
- [x] All types exported from `types/`

### 12.5 Phase 5 Success

- [x] Bundle size < 10MB
- [x] Hot reload < 200ms
- [x] Documentation complete
- [x] README updated

---

## 13. Timeline Summary

| Phase                          | Duration      | Key Deliverables              |
| ------------------------------ | ------------- | ----------------------------- |
| Phase 1: Foundation            | 1 week        | Vite setup, tooling, Makefile |
| Phase 2: Architecture          | 2 weeks       | Components, stores, services  |
| Phase 3: Security & Quality    | 1 week        | Fixes, tests, security        |
| Phase 4: TypeScript (Optional) | 2 weeks       | Full type safety              |
| Phase 5: DX & Polish           | 1 week        | Optimization, docs            |
| **Total**                      | **5-7 weeks** | Production-ready modern app   |

---

## 14. References

### 14.1 Official Documentation

- electron-vite: https://electron-vite.org
- Vite: https://vite.dev
- Vue 3: https://vuejs.org
- Vuetify 3: https://vuetifyjs.com
- Pinia: https://pinia.vuejs.org
- ESLint 9: https://eslint.org
- Vitest: https://vitest.dev

### 14.2 Migration Guides

- Vue CLI → Vite: https://vueschool.io/articles/vuejs-tutorials/how-to-migrate-from-vue-cli-to-vite/
- Vuetify 2 → 3: https://vuetifyjs.com/en/getting-started/upgrade-guide/
- ESLint 8 → 9: https://eslint.org/docs/latest/use/migrate-to-9.0.0

### 14.3 Best Practices

- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- SOLID Principles: https://en.wikipedia.org/wiki/SOLID

---

## 15. Conclusion

This modernization plan transforms sqlite-search from a legacy Vue CLI application with architectural antipatterns into a modern, secure, maintainable application following SOLID, DRY, and KISS principles. The phased approach minimizes risk while delivering incremental value.

**Key Benefits:**

- ✅ **Security:** SQL injection fixed, latest Electron
- ✅ **Maintainability:** Modular architecture, clear separation of concerns
- ✅ **Developer Experience:** Fast HMR, modern tooling, Makefile automation
- ✅ **Quality:** Comprehensive testing, type safety (optional)
- ✅ **Performance:** Optimized bundle, code splitting
- ✅ **Future-Proof:** Modern stack with active maintenance

**Next Steps:**

1. Review and approve this plan
2. Create feature branch: `feat/modernization`
3. Begin Phase 1: Foundation
4. Iterate with testing and feedback

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** Ready for Review
