# Implementation Plan for Open Issues

**Created:** 2025-11-15
**Status:** Ready for Implementation
**Total Estimated Time:** 14-21 hours

---

## Executive Summary

This plan addresses 5 open GitHub issues. One issue (#15 - CI/CD) is already complete. The remaining 4 issues are prioritized and sequenced for efficient implementation.

### Implementation Order

1. **Issue #15** - ✅ COMPLETED (Close issue)
2. **Issue #16** - Fix special character handling (HIGH priority, 2-3 hours)
3. **Issue #14** - Bundle MDI fonts locally (MEDIUM priority, 1-2 hours)
4. **Issue #11** - Enhanced column selection UX (MEDIUM priority, 3-4 hours)
5. **Issue #5** - Support non-FTS5 tables (LOW priority, 8-12 hours)

---

## Issue #15: Automate builds using actions ✅

### Status: COMPLETED

**Evidence:**
- `.github/workflows/build.yml` - Multi-platform CI on every push
- `.github/workflows/release.yml` - Automated releases on version tags
- Both workflows use modern best practices (pnpm caching, matrix builds)

**Action Required:** Close this issue with comment referencing workflows.

---

## Issue #16: Bug - Search fails with special characters

### Priority: **HIGH** (Critical Bug)
### Complexity: **LOW**
### Estimated Time: 2-3 hours

### Problem
FTS5 special characters (`:`, `"`, `-`, `*`, `OR`, `AND`, `NOT`) cause syntax errors when used in search terms.

### Solution: FTS5 Query Escaping

**Key Insight:** In FTS5, the ONLY character that needs escaping is the double quote (`"`), which must be doubled (`""`). Wrapping the entire term in quotes treats it as a literal string.

**Transformation:**
```javascript
// Input: hello:world "test"
// Output: "hello:world ""test"""
```

### Implementation Steps

#### 1. Create Utility Function
**File:** `src/utils/fts5.js` (NEW)

```javascript
/**
 * Escapes a search term for safe FTS5 MATCH queries
 */
export function escapeFts5Query(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return '""'
  }
  // Replace " with "" and wrap in quotes
  return `"${searchTerm.replace(/"/g, '""')}"`
}
```

#### 2. Apply Escaping in Search Handler
**File:** `electron/main/index.js` (line ~355)

```javascript
// In perform-search IPC handler:
const escapedSearchTerm = `"${searchTerm.replace(/"/g, '""')}"`
const matchQuery = `{${searchColumns}}: ${escapedSearchTerm}`
```

#### 3. Add User Feedback (Optional)
**File:** `src/components/search/SearchInput.vue`

Show hint when special characters detected:
```javascript
const searchHint = computed(() => {
  const hasSpecialChars = /[:"*\-(){}]/.test(searchTerm.value || '')
  return hasSpecialChars
    ? 'Special characters will be treated as literal text'
    : 'Press Enter or click search to begin'
})
```

### Testing Checklist

- [ ] Search: `user:name:test` (colons)
- [ ] Search: `"quoted text"` (quotes)
- [ ] Search: `test "inner" value` (mixed quotes)
- [ ] Search: `hello-world` (dash)
- [ ] Search: `cats AND dogs OR birds` (operators)
- [ ] Search: `test*value` (asterisk)
- [ ] Search: `` (empty)
- [ ] Search: `   ` (whitespace only)

### Files Modified
- NEW: `src/utils/fts5.js`
- MODIFY: `electron/main/index.js` (1 function)
- OPTIONAL: `src/components/search/SearchInput.vue` (hint)

---

## Issue #14: Bug - MDI fonts not included in build

### Priority: **MEDIUM** (Build Quality)
### Complexity: **LOW**
### Estimated Time: 1-2 hours

### Problem
MDI icons loaded via CDN, causing:
- No offline support
- CSP security issues
- Slower first load
- Build doesn't include fonts despite `@mdi/font` dependency

### Solution: Bundle MDI Fonts with Vite

**Best Practice:** Import `@mdi/font/css/materialdesignicons.css` in JavaScript, not HTML. Vite automatically bundles CSS and font files.

### Implementation Steps

#### 1. Remove CDN Link
**File:** `index.html`

```html
<!-- REMOVE THIS LINE: -->
<link href="https://cdn.jsdelivr.net/npm/@mdi/font@7.x/css/materialdesignicons.min.css" rel="stylesheet">

<!-- UPDATE CSP (remove cdn.jsdelivr.net): -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:;">
```

#### 2. Import MDI CSS in JavaScript
**File:** `src/main.js`

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import App from './App.vue'

// ADD THIS LINE - Vite will bundle the fonts
import '@mdi/font/css/materialdesignicons.css'

// ... rest of file
```

#### 3. Verify Vuetify Config
**File:** `src/plugins/vuetify.js`

```javascript
export default createVuetify({
  icons: {
    defaultSet: 'mdi', // ✓ Already correct
  },
  // ... rest of config
})
```

### Testing Checklist

- [ ] Dev mode: `pnpm run dev` - icons display correctly
- [ ] Dev mode: Check Network tab - no CDN requests
- [ ] Build: `pnpm run dist` - build completes successfully
- [ ] Build: Check `dist-electron/renderer/assets/` - `.woff2` fonts present
- [ ] Offline test: Disconnect internet, launch built app - icons still work

### Files Modified
- MODIFY: `index.html` (remove CDN link, update CSP)
- MODIFY: `src/main.js` (add import)
- VERIFY: `src/plugins/vuetify.js` (already correct)

---

## Issue #11: Enhanced Dynamic Table and Column Loading

### Priority: **MEDIUM** (UX Enhancement)
### Complexity: **LOW-MEDIUM**
### Estimated Time: 3-4 hours

### Current State
- ✅ Dynamic table loading
- ✅ Dynamic column loading
- ✅ Multi-select column picker
- ⚠️ Auto-selects ALL columns (can be overwhelming)
- ❌ No default limit to first 5 columns

### Solution: Smart Column Selection

**Default Behavior:** Auto-select first 5 columns (or all if fewer than 5)

### Implementation Steps

#### 1. Create Configuration
**File:** `src/config/search.config.js` (NEW)

```javascript
export const SEARCH_CONFIG = {
  DEFAULT_COLUMN_COUNT: 5,
  MAX_CHIP_PREVIEW: 2,
  MAX_RESULTS_DISPLAY: 1000,
}
```

#### 2. Update Auto-Selection Logic
**File:** `src/App.vue` (line ~129)

```javascript
import { SEARCH_CONFIG } from '@/config/search.config'

// In onColumnsListHandler:
const onColumnsListHandler = (event, columns) => {
  if (columns && columns.length > 0) {
    databaseStore.setColumns(columns)

    // Select first 5 (or all if fewer)
    const limit = SEARCH_CONFIG.DEFAULT_COLUMN_COUNT
    const columnsToSelect = columns.slice(0, Math.min(columns.length, limit))
    databaseStore.selectColumns(columnsToSelect)

    // Helpful message
    if (columns.length > limit) {
      uiStore.showInfo(
        `Selected first ${limit} of ${columns.length} columns. ` +
        `You can add or remove columns using the dropdown.`
      )
    } else {
      uiStore.showSuccess(`All ${columns.length} column(s) selected`)
    }
  }
}
```

#### 3. Enhanced Column Selector UI
**File:** `src/components/database/ColumnSelector.vue`

Add quick action buttons and better chip display:

```vue
<template>
  <v-autocomplete
    v-model="selectedColumns"
    :items="databaseStore.columns"
    label="Select Columns to Search"
    variant="outlined"
    density="compact"
    multiple
    chips
    closable-chips
    :hint="columnHint"
  >
    <!-- Compact chip display (max 2 + "N more") -->
    <template #selection="{ item, index }">
      <v-chip v-if="index < 2" size="small" closable>
        {{ item.title }}
      </v-chip>
      <span v-if="index === 2" class="text-caption ml-1">
        (+{{ selectedColumns.length - 2 }} more)
      </span>
    </template>

    <!-- Quick action buttons -->
    <template #prepend-item>
      <v-list-item>
        <v-btn size="small" variant="text" @click="selectFirstFive">
          First 5
        </v-btn>
        <v-btn size="small" variant="text" @click="selectAll">
          Select All
        </v-btn>
      </v-list-item>
      <v-divider class="mb-2" />
    </template>
  </v-autocomplete>
</template>

<script setup>
const columnHint = computed(() => {
  const selected = selectedColumns.value.length
  const total = databaseStore.columns.length
  if (selected === 0) return 'Select at least one column'
  if (selected === total) return `All ${total} columns selected`
  return `${selected} of ${total} column(s) selected`
})

function selectFirstFive() {
  const firstFive = databaseStore.columns.slice(0, 5)
  databaseStore.selectColumns(firstFive)
}

function selectAll() {
  databaseStore.selectColumns(databaseStore.columns)
}
</script>
```

### Testing Checklist

- [ ] Table with 3 columns - verify all 3 auto-selected
- [ ] Table with 10 columns - verify first 5 auto-selected
- [ ] Click "Select All" - verify all columns selected
- [ ] Click "First 5" - verify reset to first 5
- [ ] Manual selection - verify search results clear
- [ ] Chip display - verify max 2 chips + "N more"
- [ ] Persistence - verify custom selection survives refresh

### Files Modified
- NEW: `src/config/search.config.js`
- MODIFY: `src/App.vue` (auto-selection logic)
- MODIFY: `src/components/database/ColumnSelector.vue` (UI enhancements)

---

## Issue #5: Enhancement - Search in Non-FTS5 Tables

### Priority: **LOW** (Feature Expansion)
### Complexity: **HIGH**
### Estimated Time: 8-12 hours
### Dependencies: Issue #16 (uses FTS5 escaping)

### Current State
- ❌ Only FTS5 tables shown in table list
- ❌ Regular tables completely ignored
- ❌ No fallback search method

### Solution: Dual-Mode Search

**Approach:**
1. Detect table type (FTS5 vs regular)
2. Use FTS5 MATCH for indexed tables
3. Use LIKE fallback for regular tables
4. Show clear indicators and warnings

### Implementation Steps

#### Phase 1: Table Type Detection

**1. Update Table List Query**
**File:** `electron/main/index.js` (line ~247)

```javascript
function refreshValidTables(database) {
  const query = `
    SELECT
      name,
      CASE
        WHEN sql LIKE 'CREATE VIRTUAL TABLE%USING fts5%' THEN 'fts5'
        WHEN sql LIKE 'CREATE VIRTUAL TABLE%' THEN 'virtual_other'
        ELSE 'regular'
      END AS table_type
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '%_content'
      AND name NOT LIKE '%_data'
    ORDER BY name`

  database.all(query, [], (err, tables) => {
    if (err) reject(err)
    else {
      validTables = tables.map(t => ({
        name: t.name,
        type: t.table_type,
        isFts5: t.table_type === 'fts5'
      }))
      resolve(validTables)
    }
  })
}
```

**2. Update Database Store**
**File:** `src/stores/database.store.js`

```javascript
const selectedTableType = ref('') // NEW

const isFts5Table = computed(() => selectedTableType.value === 'fts5') // NEW

const tableList = computed(() => {
  return tables.value.map(t => ({
    title: t.name + (t.isFts5 ? ' [FTS5]' : ' [Table]'),
    value: t.name,
    type: t.type,
    isFts5: t.isFts5
  }))
})

function selectTable(tableName) {
  selectedTable.value = tableName
  const tableObj = tables.value.find(t => t.name === tableName)
  selectedTableType.value = tableObj ? tableObj.type : '' // NEW
  localStorage.setItem('selectedTableType', selectedTableType.value)
}
```

**3. Update Table Selector UI**
**File:** `src/components/database/TableSelector.vue`

```vue
<template #item="{ item, props }">
  <v-list-item v-bind="props">
    <template #prepend>
      <v-icon :color="item.raw.isFts5 ? 'primary' : 'grey'">
        {{ item.raw.isFts5 ? 'mdi-magnify' : 'mdi-table' }}
      </v-icon>
    </template>
  </v-list-item>
</template>
```

#### Phase 2: Fallback Search Implementation

**4. Add Search Methods**
**File:** `electron/main/index.js`

```javascript
function isFts5Table(tableName) {
  const table = validTables.find(t => t.name === tableName)
  return table && table.isFts5
}

function performFts5Search(database, tableName, columns, searchTerm) {
  return new Promise((resolve, reject) => {
    const escapedTerm = `"${searchTerm.replace(/"/g, '""')}"`
    const matchQuery = `{${columns.join(' ')}}: ${escapedTerm}`
    const query = `SELECT * FROM ${tableName} WHERE ${tableName} MATCH ?`

    database.all(query, [matchQuery], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function performLikeSearch(database, tableName, columns, searchTerm) {
  return new Promise((resolve, reject) => {
    const likePattern = `%${searchTerm}%`
    const whereClauses = columns.map(col => `${col} LIKE ?`).join(' OR ')
    const query = `SELECT * FROM ${tableName} WHERE ${whereClauses}`
    const params = columns.map(() => likePattern)

    database.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Updated search handler
ipcMain.on('perform-search', async (event, searchTerm, selectedTable, selectedColumns) => {
  // ... validation ...

  try {
    let rows
    if (isFts5Table(selectedTable)) {
      rows = await performFts5Search(db, selectedTable, selectedColumns, searchTerm)
    } else {
      rows = await performLikeSearch(db, selectedTable, selectedColumns, searchTerm)
    }
    event.reply('search-results', rows)
  } catch (err) {
    event.reply('search-error', err.message)
  }
})
```

**5. Add User Feedback**
**File:** `src/components/search/SearchInput.vue`

```vue
<template>
  <v-text-field
    :label="searchLabel"
    :hint="searchHint"
  >
    <template #prepend-inner>
      <v-icon :color="searchIconColor">{{ searchIcon }}</v-icon>
    </template>
  </v-text-field>
</template>

<script setup>
const searchLabel = computed(() => {
  return databaseStore.isFts5Table
    ? 'Search Term (Full-Text Search)'
    : 'Search Term (Text Match)'
})

const searchIcon = computed(() => {
  return databaseStore.isFts5Table ? 'mdi-magnify' : 'mdi-text-search'
})

const searchHint = computed(() => {
  if (!databaseStore.isFts5Table) {
    return 'Using LIKE search (may be slower on large tables)'
  }
  return 'Press Enter to search'
})
</script>
```

**6. Add Performance Warning**
**File:** `src/App.vue`

```javascript
const onColumnsListHandler = (event, columns) => {
  // ... existing logic ...

  if (!databaseStore.isFts5Table) {
    uiStore.showWarning(
      'This table lacks FTS5 indexing. Search will use LIKE queries ' +
      'which may be slower on large datasets.',
      { timeout: 6000 }
    )
  }
}
```

### Testing Checklist

**Setup Test Database:**
```sql
-- FTS5 table
CREATE VIRTUAL TABLE articles USING fts5(title, content);
INSERT INTO articles VALUES ('FTS5', 'Fast search');

-- Regular table
CREATE TABLE users (id INTEGER, name TEXT, email TEXT);
INSERT INTO users VALUES (1, 'Alice', 'alice@test.com');
```

**Tests:**
- [ ] Table list shows both FTS5 and regular tables
- [ ] FTS5 tables have [FTS5] indicator
- [ ] Regular tables have [Table] indicator
- [ ] FTS5 search uses MATCH (check console)
- [ ] Regular search uses LIKE (check console)
- [ ] Warning shown when selecting regular table
- [ ] Performance comparison on large dataset

### Files Modified (Phase 1)
- MODIFY: `electron/main/index.js` (table query)
- MODIFY: `src/stores/database.store.js` (table type tracking)
- MODIFY: `src/components/database/TableSelector.vue` (UI indicators)

### Files Modified (Phase 2)
- MODIFY: `electron/main/index.js` (search methods)
- MODIFY: `src/components/search/SearchInput.vue` (feedback)
- MODIFY: `src/App.vue` (warnings)

### Risk Mitigation
- **SQL Injection:** Use existing whitelist validation
- **Performance:** Show clear warnings for non-FTS5 tables
- **Breaking Changes:** FTS5 remains default/preferred method

---

## Summary Matrix

| Issue | Priority | Complexity | Time | Dependencies | Status |
|-------|----------|------------|------|--------------|--------|
| #15 - CI/CD | - | - | 0h | None | ✅ COMPLETED |
| #16 - Special Chars | HIGH | LOW | 2-3h | None | Ready |
| #14 - MDI Fonts | MEDIUM | LOW | 1-2h | None | Ready |
| #11 - Column UX | MEDIUM | LOW-MED | 3-4h | None | Ready |
| #5 - Non-FTS5 | LOW | HIGH | 8-12h | #16 | Ready |

**Total Implementation Time:** 14-21 hours

---

## Next Steps

1. **Close Issue #15** - Add comment linking to workflows
2. **Implement Issue #16** - Critical bug fix (2-3 hours)
3. **Implement Issue #14** - Quick win for offline support (1-2 hours)
4. **Implement Issue #11** - UX improvement (3-4 hours)
5. **Implement Issue #5** - Major feature (8-12 hours)

---

## Future Enhancements

Consider creating new issues for:
- Search history tracking
- Export results to CSV/JSON
- Advanced FTS5 features (wildcards, phrase search)
- Query builder UI
- Performance metrics display
- Regex search option for regular tables
