# Browse Mode Implementation Plan

## Overview

Add a "Browse" mode that allows users to view entire table contents without searching, handling large datasets (100k+ rows) efficiently through server-side pagination.

## Research Summary

### UX Best Practices (Sources)
- [Data Table Design UX Patterns - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables): Toggle between views should be intuitive; users should be able to switch based on their current task
- [NN/G Data Tables](https://www.nngroup.com/articles/data-tables/): Users need different interaction patterns for finding (search) vs. scanning (browse)
- [LogRocket Data Table Best Practices](https://blog.logrocket.com/ux-design/data-table-design-best-practices/): Tables are about finding information; context is key

### SQLite Pagination Performance (Sources)
- [PingCAP: Limit/Offset vs Cursor Pagination](https://www.pingcap.com/article/limit-offset-pagination-vs-cursor-pagination-in-mysql/): OFFSET pagination degrades with large offsets (O(offset + limit) vs O(limit))
- [DEV Community: Comparing Pagination Methods](https://dev.to/jacktt/comparing-limit-offset-and-cursor-pagination-1n81): Cursor pagination is more performant but harder to implement
- [SQLite Help Docs](https://sqlite.work/optimizing-row-number-and-pagination-performance-in-sqlite-queries/): For FTS5 tables, keyset pagination requires a unique identifier

**Decision**: Use LIMIT/OFFSET for simplicity since:
1. FTS5 tables may not have a reliable unique key for cursor pagination
2. Users typically don't paginate very deep into results
3. SQLite is local (no network latency), so performance is acceptable
4. Can add cursor pagination later if needed

### Vuetify Components
- [Vuetify Data Table Server](https://vuetifyjs.com/en/components/data-tables/server-side-tables/): `v-data-table-server` for server-side pagination
- Key props: `items-length`, `loading`, `@update:options` for page/sort changes

## Architecture Design

### Mode Toggle UI

```
+--------------------------------------------------+
|  [Search Icon] Search     [Table Icon] Browse    |  <- Segmented button group
+--------------------------------------------------+
|                                                  |
|  Search Mode:                Browse Mode:        |
|  [___Search input___]       Table: X rows total  |
|                             Loading page 1/100   |
+--------------------------------------------------+
```

**Location**: Above the search input, as a `v-btn-toggle` segmented control
**Icons**: `mdi-magnify` for Search, `mdi-table-eye` for Browse

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Renderer Process                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SearchInput.vue                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Search] [Browse]  <-- Mode Toggle                 │   │
│  │                                                     │   │
│  │  Search Mode: [____search term____] [Search]        │   │
│  │  Browse Mode: "Showing 50,000 rows in genes_fts"    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  search.store.js                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  mode: 'search' | 'browse'                          │   │
│  │  browseData: { items: [], totalCount: 0 }          │   │
│  │  browsePagination: { page: 1, itemsPerPage: 25 }   │   │
│  │  browseSort: { column: null, direction: 'asc' }    │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  useDatabase.js / useBrowse.js (new composable)           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  fetchBrowsePage(table, columns, page, limit, sort) │   │
│  │  → window.electronAPI.browseTable(...)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │ IPC
┌──────────────────────────────┼──────────────────────────────┐
│                      Main Process                           │
├──────────────────────────────┼──────────────────────────────┤
│                              ▼                              │
│  electron/main/index.js                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ipcMain.on('browse-table', ...)                    │   │
│  │  → SELECT * FROM table LIMIT ? OFFSET ?             │   │
│  │  → SELECT COUNT(*) FROM table                       │   │
│  │  → Returns { rows: [...], totalCount: N }           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Backend (Electron Main Process)

#### 1.1 Add `browse-table` IPC Handler

```javascript
// electron/main/index.js

/**
 * Browse table with server-side pagination
 * @param {string} tableName - Table to browse
 * @param {string[]} columns - Columns to select (for consistency with search)
 * @param {number} page - Page number (1-indexed)
 * @param {number} itemsPerPage - Items per page
 * @param {Object} sort - Sort configuration { column, direction }
 */
ipcMain.on('browse-table', async (event, tableName, columns, page, itemsPerPage, sort) => {
  if (!db) {
    event.reply('browse-error', 'Database connection not established.')
    return
  }

  // Security: Validate table name
  if (!isValidTable(tableName)) {
    event.reply('browse-error', `Invalid table: ${tableName}`)
    return
  }

  // Security: Validate columns
  const columnsValid = await areValidColumns(db, tableName, columns)
  if (!columnsValid) {
    event.reply('browse-error', 'Invalid column names')
    return
  }

  try {
    // Calculate offset (page is 1-indexed)
    const offset = (page - 1) * itemsPerPage

    // Build column list (validated above)
    const columnList = columns.map(c => `"${c}"`).join(', ')

    // Build ORDER BY clause if sort specified
    let orderByClause = ''
    if (sort && sort.column && columns.includes(sort.column)) {
      const direction = sort.direction === 'desc' ? 'DESC' : 'ASC'
      orderByClause = `ORDER BY "${sort.column}" ${direction}`
    }

    // Get paginated data
    const dataQuery = `SELECT ${columnList} FROM "${tableName}" ${orderByClause} LIMIT ? OFFSET ?`

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`

    // Execute both queries
    const [rows, countResult] = await Promise.all([
      new Promise((resolve, reject) => {
        db.all(dataQuery, [itemsPerPage, offset], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      }),
      new Promise((resolve, reject) => {
        db.get(countQuery, [], (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })
    ])

    event.reply('browse-results', {
      rows: rows,
      totalCount: countResult.count,
      page: page,
      itemsPerPage: itemsPerPage
    })
  } catch (error) {
    log.error('Browse error:', error.message)
    event.reply('browse-error', error.message)
  }
})
```

#### 1.2 Add `get-table-row-count` IPC Handler

```javascript
// For quick count without full browse
ipcMain.on('get-table-row-count', async (event, tableName) => {
  if (!db) {
    event.reply('table-row-count-error', 'Database not connected')
    return
  }

  if (!isValidTable(tableName)) {
    event.reply('table-row-count-error', `Invalid table: ${tableName}`)
    return
  }

  const query = `SELECT COUNT(*) as count FROM "${tableName}"`
  db.get(query, [], (err, row) => {
    if (err) {
      event.reply('table-row-count-error', err.message)
    } else {
      event.reply('table-row-count', row.count)
    }
  })
})
```

### Phase 2: Preload Script

```javascript
// electron/preload/index.js - Add to electronAPI

// Browse mode
browseTable: (tableName, columns, page, itemsPerPage, sort) =>
  ipcRenderer.send('browse-table', tableName, columns, page, itemsPerPage, sort),
onBrowseResults: callback => ipcRenderer.on('browse-results', callback),
onBrowseError: callback => ipcRenderer.on('browse-error', callback),

// Row count
getTableRowCount: (tableName) => ipcRenderer.send('get-table-row-count', tableName),
onTableRowCount: callback => ipcRenderer.on('table-row-count', callback),
onTableRowCountError: callback => ipcRenderer.on('table-row-count-error', callback),
```

### Phase 3: Store Updates

#### 3.1 Search Store Extensions

```javascript
// src/stores/search.store.js - Add browse mode state

// Mode state
const viewMode = ref('search') // 'search' | 'browse'

// Browse-specific state
const browseData = ref({
  rows: [],
  totalCount: 0,
  page: 1,
  itemsPerPage: 25
})
const browseLoading = ref(false)
const browseError = ref(null)
const browseSort = ref({ column: null, direction: 'asc' })

// Computed
const isBrowseMode = computed(() => viewMode.value === 'browse')
const isSearchMode = computed(() => viewMode.value === 'search')

// Actions
function setViewMode(mode) {
  viewMode.value = mode
  // Clear results when switching modes
  if (mode === 'search') {
    browseData.value = { rows: [], totalCount: 0, page: 1, itemsPerPage: 25 }
  } else {
    results.value = []
  }
}

function setBrowseResults(data) {
  browseData.value = data
  browseLoading.value = false
}

function setBrowsePagination(page, itemsPerPage) {
  browseData.value.page = page
  browseData.value.itemsPerPage = itemsPerPage
}

function setBrowseSort(column, direction) {
  browseSort.value = { column, direction }
}
```

### Phase 4: Composable (useBrowse.js)

```javascript
// src/composables/useBrowse.js

import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'
import { useUIStore } from '@/stores/ui.store'

export function useBrowse() {
  const databaseStore = useDatabaseStore()
  const searchStore = useSearchStore()
  const uiStore = useUIStore()

  /**
   * Fetch a page of browse data
   */
  function fetchBrowsePage(page = 1, itemsPerPage = 25) {
    if (!databaseStore.selectedTable) {
      uiStore.showError('No table selected')
      return
    }

    searchStore.setBrowseLoading(true)

    const columns = Array.from(databaseStore.selectedColumns)
    const sort = searchStore.browseSort

    window.electronAPI.browseTable(
      databaseStore.selectedTable,
      columns,
      page,
      itemsPerPage,
      sort
    )
  }

  /**
   * Change page
   */
  function changePage(page) {
    searchStore.setBrowsePagination(page, searchStore.browseData.itemsPerPage)
    fetchBrowsePage(page, searchStore.browseData.itemsPerPage)
  }

  /**
   * Change items per page
   */
  function changeItemsPerPage(itemsPerPage) {
    searchStore.setBrowsePagination(1, itemsPerPage) // Reset to page 1
    fetchBrowsePage(1, itemsPerPage)
  }

  /**
   * Change sort
   */
  function changeSort(column, direction) {
    searchStore.setBrowseSort(column, direction)
    fetchBrowsePage(1, searchStore.browseData.itemsPerPage) // Reset to page 1
  }

  /**
   * Toggle view mode
   */
  function setViewMode(mode) {
    searchStore.setViewMode(mode)
    if (mode === 'browse') {
      fetchBrowsePage()
    }
  }

  return {
    fetchBrowsePage,
    changePage,
    changeItemsPerPage,
    changeSort,
    setViewMode
  }
}
```

### Phase 5: UI Components

#### 5.1 Mode Toggle (in SearchInput.vue or new component)

```vue
<template>
  <div class="mode-toggle-container">
    <v-btn-toggle
      v-model="searchStore.viewMode"
      mandatory
      density="compact"
      color="primary"
      class="mode-toggle"
    >
      <v-btn value="search" size="small">
        <v-icon start size="small">mdi-magnify</v-icon>
        Search
      </v-btn>
      <v-btn value="browse" size="small">
        <v-icon start size="small">mdi-table-eye</v-icon>
        Browse
        <v-chip
          v-if="tableRowCount > 0"
          size="x-small"
          class="ml-2"
          color="primary"
          variant="tonal"
        >
          {{ formatNumber(tableRowCount) }}
        </v-chip>
      </v-btn>
    </v-btn-toggle>
  </div>
</template>
```

#### 5.2 Browse Results Display

Option A: **Extend ResultsTable.vue** to handle both modes
- Pros: Single component, consistent styling
- Cons: More complex conditionals

Option B: **Create BrowseTable.vue** (separate component)
- Pros: Clean separation of concerns
- Cons: Code duplication for similar table features

**Recommendation**: Option A - Extend ResultsTable.vue with mode awareness

```vue
<!-- In ResultsTable.vue -->
<template>
  <v-card v-if="shouldShowTable" ...>
    <!-- Shared header -->
    <v-card-title>
      <template v-if="searchStore.isBrowseMode">
        <v-icon size="small" class="mr-2">mdi-table-eye</v-icon>
        <span>Browse: {{ databaseStore.selectedTable }}</span>
        <span class="text-caption text-medium-emphasis ml-2">
          ({{ formatNumber(searchStore.browseData.totalCount) }} rows)
        </span>
      </template>
      <template v-else>
        <!-- Existing search results header -->
      </template>
    </v-card-title>

    <!-- For browse mode, use v-data-table-server -->
    <v-data-table-server
      v-if="searchStore.isBrowseMode"
      :headers="tableHeaders"
      :items="searchStore.browseData.rows"
      :items-length="searchStore.browseData.totalCount"
      :loading="searchStore.browseLoading"
      :items-per-page="searchStore.browseData.itemsPerPage"
      :page="searchStore.browseData.page"
      @update:options="onBrowseOptionsUpdate"
      density="compact"
      hover
    >
      <!-- Reuse existing cell templates -->
    </v-data-table-server>

    <!-- For search mode, existing v-data-table -->
    <v-data-table v-else ... />
  </v-card>
</template>
```

### Phase 6: App.vue IPC Listeners

```javascript
// Add to setupIPCListeners() in App.vue

// Browse results listener
const onBrowseResultsHandler = (event, data) => {
  searchStore.setBrowseResults(data)
  searchStore.setBrowseLoading(false)
}
window.electronAPI.onBrowseResults(onBrowseResultsHandler)

// Browse error listener
const onBrowseErrorHandler = (event, errorMessage) => {
  searchStore.setBrowseError(errorMessage)
  searchStore.setBrowseLoading(false)
  uiStore.showError(`Browse failed: ${errorMessage}`)
}
window.electronAPI.onBrowseError(onBrowseErrorHandler)

// Row count listener (optional, for badge display)
const onTableRowCountHandler = (event, count) => {
  // Store can track this for display in mode toggle
  databaseStore.setTableRowCount(count)
}
window.electronAPI.onTableRowCount(onTableRowCountHandler)
```

## File Changes Summary

| File | Changes |
|------|---------|
| `electron/main/index.js` | Add `browse-table` and `get-table-row-count` IPC handlers |
| `electron/preload/index.js` | Add browse API methods to electronAPI |
| `src/stores/search.store.js` | Add browse mode state, computed, and actions |
| `src/stores/database.store.js` | Add `tableRowCount` state (optional) |
| `src/composables/useBrowse.js` | New composable for browse operations |
| `src/components/search/SearchInput.vue` | Add mode toggle UI |
| `src/components/results/ResultsTable.vue` | Support both search and browse modes |
| `src/App.vue` | Add browse IPC event listeners |

## Performance Considerations

1. **LIMIT/OFFSET Performance**: For very large offsets (e.g., page 10000), consider:
   - Warning users about large tables
   - Implementing a "jump to page" feature with confirmation
   - Future: cursor pagination for rowid-based navigation

2. **Row Count Caching**:
   - Cache count per table in databaseStore
   - Refresh when table is selected or data changes

3. **Debouncing**:
   - Debounce rapid page changes
   - Show loading indicator immediately

4. **Memory**:
   - Only keep current page in memory
   - Clear browse data when switching tables

## Testing Checklist

- [ ] Browse mode toggle switches correctly
- [ ] Server-side pagination works (page navigation)
- [ ] Items per page changes reload data
- [ ] Sort by column works (server-side)
- [ ] Total count displays correctly
- [ ] Loading state shows during fetch
- [ ] Error handling for failed requests
- [ ] Large table (100k+ rows) performance
- [ ] Mode persistence across table switches
- [ ] Column visibility respects user preferences
- [ ] Actions column works (view details, copy)

## Future Enhancements

1. **Cursor-based pagination** for better performance on deep pages
2. **Server-side filtering** for browse mode
3. **Export current view** to CSV/JSON
4. **Virtual scrolling** for very large pages
5. **Bookmark pages** for quick navigation
