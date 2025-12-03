# Export Feature Implementation Plan

**Created:** 2025-12-03
**Status:** Ready for Approval
**Feature:** Download current viewable table in CSV/Excel formats

---

## Executive Summary

This plan implements a table export feature allowing users to download search results or browse data in CSV and Excel formats. The implementation follows existing architectural patterns (IPC, composables, Pinia stores) and adheres to SOLID, DRY, and KISS principles.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Library | **SheetJS (xlsx)** | Industry standard, MIT licensed, excellent Electron support, handles CSV/Excel natively |
| Export Location | Main Process | Security: file system access should be in main process with `dialog.showSaveDialog` |
| Row Limit | 100,000 rows | Balance between utility and performance; Excel supports 1M but UI/memory degrades |
| UI Pattern | Export menu button in ResultsTable header | Consistent with existing "Columns" button pattern |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Renderer Process (Vue)                        │
├─────────────────────────────────────────────────────────────────────┤
│  ResultsTable.vue                                                    │
│    └── Export Menu (v-menu)                                          │
│          ├── Export as CSV                                           │
│          └── Export as Excel                                         │
│                    │                                                 │
│  useExport.js (composable)                                           │
│    ├── exportToCSV()     → prepares data + calls IPC                 │
│    ├── exportToExcel()   → prepares data + calls IPC                 │
│    ├── validateExport()  → checks row limits                         │
│    └── getExportData()   → retrieves filtered/sorted data            │
│                    │                                                 │
│  export.config.js                                                    │
│    └── MAX_EXPORT_ROWS, FORMAT_OPTIONS, etc.                         │
└────────────────────────────────────────────────────────────────────┘
                           │ IPC
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Main Process (Electron)                       │
├─────────────────────────────────────────────────────────────────────┤
│  electron/main/index.js                                              │
│    └── IPC Handlers:                                                 │
│          ├── 'export-to-csv'     → showSaveDialog + write CSV        │
│          └── 'export-to-excel'   → showSaveDialog + write XLSX       │
│                                                                      │
│  electron/main/utils/export.js (NEW)                                 │
│    ├── generateCSV()      → manual CSV generation (no deps)          │
│    └── generateExcel()    → uses SheetJS for XLSX                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Configuration & Infrastructure

**Files to create/modify:**

#### 1.1 Export Configuration
**File:** `src/config/export.config.js` (NEW)

```javascript
export const EXPORT_CONFIG = {
  // Row limits
  MAX_EXPORT_ROWS: 100000,
  WARNING_THRESHOLD: 50000,

  // Format options
  FORMATS: {
    CSV: {
      extension: 'csv',
      mimeType: 'text/csv',
      label: 'CSV (Comma Separated)',
      icon: 'mdi-file-delimited'
    },
    EXCEL: {
      extension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      label: 'Excel Workbook',
      icon: 'mdi-microsoft-excel'
    }
  },

  // CSV options
  CSV_DELIMITER: ',',
  CSV_QUOTE_CHAR: '"',
  CSV_ESCAPE_CHAR: '"',

  // Excel options
  EXCEL_SHEET_NAME: 'Export'
}
```

#### 1.2 Add SheetJS Dependency
**File:** `package.json`

```diff
"dependencies": {
  ...
+ "xlsx": "^0.18.5"
}
```

**Rationale:** SheetJS is used ONLY in main process (Node.js), not bundled with renderer.

---

### Phase 2: Main Process Export Handlers

**File:** `electron/main/utils/export.js` (NEW)

```javascript
/**
 * Export utility functions for main process
 * Generates CSV/Excel files from data arrays
 *
 * @module electron/main/utils/export
 */

import XLSX from 'xlsx'

/**
 * Generate CSV string from data array
 * Pure function, no external dependencies
 *
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Column names in order
 * @param {Object} options - CSV options
 * @returns {string} CSV content
 */
export function generateCSV(data, columns, options = {}) {
  const {
    delimiter = ',',
    quoteChar = '"',
    escapeChar = '"'
  } = options

  // Escape function for CSV values
  const escapeValue = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    // Quote if contains delimiter, quote, newline, or carriage return
    if (str.includes(delimiter) || str.includes(quoteChar) ||
        str.includes('\n') || str.includes('\r')) {
      return quoteChar + str.replace(new RegExp(quoteChar, 'g'),
                                      escapeChar + quoteChar) + quoteChar
    }
    return str
  }

  // Header row
  const header = columns.map(escapeValue).join(delimiter)

  // Data rows
  const rows = data.map(row =>
    columns.map(col => escapeValue(row[col])).join(delimiter)
  )

  return [header, ...rows].join('\r\n')
}

/**
 * Generate Excel workbook buffer from data array
 *
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Column names in order
 * @param {string} sheetName - Worksheet name
 * @returns {Buffer} XLSX file buffer
 */
export function generateExcel(data, columns, sheetName = 'Export') {
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: columns,
    skipHeader: false
  })

  // Set column widths based on content
  const colWidths = columns.map(col => {
    const maxLen = Math.max(
      col.length,
      ...data.slice(0, 100).map(row =>
        String(row[col] || '').length
      )
    )
    return { wch: Math.min(maxLen + 2, 50) }
  })
  worksheet['!cols'] = colWidths

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}
```

**File:** `electron/main/index.js` (ADD IPC handlers)

```javascript
// Near top with other imports
import { generateCSV, generateExcel } from './utils/export.js'

// Add after existing IPC handlers (~line 700)

/**
 * Export data to CSV file
 * Opens save dialog and writes CSV file
 */
ipcMain.handle('export-to-csv', async (event, data, columns, defaultFilename) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Export as CSV',
    defaultPath: defaultFilename || 'export.csv',
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (canceled || !filePath) {
    return { success: false, reason: 'canceled' }
  }

  try {
    const csvContent = generateCSV(data, columns)
    await fs.promises.writeFile(filePath, csvContent, 'utf8')
    log.info(`CSV exported successfully: ${filePath} (${data.length} rows)`)
    return { success: true, filePath, rowCount: data.length }
  } catch (error) {
    log.error('CSV export error:', error.message)
    return { success: false, reason: error.message }
  }
})

/**
 * Export data to Excel file
 * Opens save dialog and writes XLSX file
 */
ipcMain.handle('export-to-excel', async (event, data, columns, defaultFilename) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Export as Excel',
    defaultPath: defaultFilename || 'export.xlsx',
    filters: [
      { name: 'Excel Files', extensions: ['xlsx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (canceled || !filePath) {
    return { success: false, reason: 'canceled' }
  }

  try {
    const buffer = generateExcel(data, columns)
    await fs.promises.writeFile(filePath, buffer)
    log.info(`Excel exported successfully: ${filePath} (${data.length} rows)`)
    return { success: true, filePath, rowCount: data.length }
  } catch (error) {
    log.error('Excel export error:', error.message)
    return { success: false, reason: error.message }
  }
})
```

---

### Phase 3: Preload Bridge

**File:** `electron/preload/index.js` (ADD)

```javascript
// Add to existing electronAPI object:

// Export operations
exportToCSV: (data, columns, filename) =>
  ipcRenderer.invoke('export-to-csv', data, columns, filename),
exportToExcel: (data, columns, filename) =>
  ipcRenderer.invoke('export-to-excel', data, columns, filename),
```

---

### Phase 4: Renderer Export Composable

**File:** `src/composables/useExport.js` (NEW)

```javascript
/**
 * Export Composable
 *
 * Provides export functionality for search results and browse data.
 * Handles validation, data preparation, and IPC communication.
 *
 * @module composables/useExport
 */

import { computed } from 'vue'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useUiStore } from '@/stores/ui.store'
import { EXPORT_CONFIG } from '@/config/export.config'

export function useExport() {
  const searchStore = useSearchStore()
  const databaseStore = useDatabaseStore()
  const uiStore = useUiStore()

  /**
   * Get current exportable data based on mode
   */
  const exportData = computed(() => {
    if (searchStore.isBrowseMode) {
      return searchStore.browseData.rows
    }
    return searchStore.filteredResults
  })

  /**
   * Get total exportable row count
   */
  const exportRowCount = computed(() => {
    if (searchStore.isBrowseMode) {
      // In browse mode, we only have current page loaded
      // Full export would require fetching all data
      return searchStore.browseData.totalCount
    }
    return searchStore.filteredResultCount
  })

  /**
   * Check if export is allowed
   */
  const canExport = computed(() => {
    return exportRowCount.value > 0 && exportRowCount.value <= EXPORT_CONFIG.MAX_EXPORT_ROWS
  })

  /**
   * Check if row count exceeds warning threshold
   */
  const showWarning = computed(() => {
    return exportRowCount.value > EXPORT_CONFIG.WARNING_THRESHOLD
  })

  /**
   * Check if export is blocked due to row limit
   */
  const exportBlocked = computed(() => {
    return exportRowCount.value > EXPORT_CONFIG.MAX_EXPORT_ROWS
  })

  /**
   * Get columns for export (respects visibility settings)
   */
  const exportColumns = computed(() => {
    return databaseStore.visibleColumns
  })

  /**
   * Generate default filename based on context
   */
  function getDefaultFilename(extension) {
    const table = databaseStore.selectedTable || 'export'
    const mode = searchStore.isBrowseMode ? 'browse' : 'search'
    const timestamp = new Date().toISOString().slice(0, 10)
    return `${table}_${mode}_${timestamp}.${extension}`
  }

  /**
   * Export current data to CSV
   */
  async function exportToCSV() {
    if (!canExport.value) {
      uiStore.showSnackbar(
        `Cannot export: row count (${exportRowCount.value.toLocaleString()}) exceeds limit (${EXPORT_CONFIG.MAX_EXPORT_ROWS.toLocaleString()})`,
        'error'
      )
      return
    }

    // Get data to export
    const data = Array.from(exportData.value)
    const columns = Array.from(exportColumns.value)
    const filename = getDefaultFilename('csv')

    try {
      const result = await window.electronAPI.exportToCSV(data, columns, filename)

      if (result.success) {
        uiStore.showSnackbar(
          `Exported ${result.rowCount.toLocaleString()} rows to CSV`,
          'success'
        )
      } else if (result.reason !== 'canceled') {
        uiStore.showSnackbar(`Export failed: ${result.reason}`, 'error')
      }
    } catch (error) {
      console.error('CSV export error:', error)
      uiStore.showSnackbar('Export failed: unexpected error', 'error')
    }
  }

  /**
   * Export current data to Excel
   */
  async function exportToExcel() {
    if (!canExport.value) {
      uiStore.showSnackbar(
        `Cannot export: row count (${exportRowCount.value.toLocaleString()}) exceeds limit (${EXPORT_CONFIG.MAX_EXPORT_ROWS.toLocaleString()})`,
        'error'
      )
      return
    }

    const data = Array.from(exportData.value)
    const columns = Array.from(exportColumns.value)
    const filename = getDefaultFilename('xlsx')

    try {
      const result = await window.electronAPI.exportToExcel(data, columns, filename)

      if (result.success) {
        uiStore.showSnackbar(
          `Exported ${result.rowCount.toLocaleString()} rows to Excel`,
          'success'
        )
      } else if (result.reason !== 'canceled') {
        uiStore.showSnackbar(`Export failed: ${result.reason}`, 'error')
      }
    } catch (error) {
      console.error('Excel export error:', error)
      uiStore.showSnackbar('Export failed: unexpected error', 'error')
    }
  }

  return {
    // State
    exportData,
    exportRowCount,
    exportColumns,
    canExport,
    showWarning,
    exportBlocked,

    // Actions
    exportToCSV,
    exportToExcel,
    getDefaultFilename,

    // Config (for UI)
    MAX_EXPORT_ROWS: EXPORT_CONFIG.MAX_EXPORT_ROWS,
    WARNING_THRESHOLD: EXPORT_CONFIG.WARNING_THRESHOLD,
    FORMATS: EXPORT_CONFIG.FORMATS
  }
}
```

---

### Phase 5: UI Components

**File:** `src/components/results/ResultsTable.vue` (MODIFY)

Add export menu button next to existing "Columns" button:

```vue
<!-- In template, after Column management button (around line 89) -->

<!-- Export menu button -->
<v-menu :close-on-content-click="true" location="bottom">
  <template #activator="{ props }">
    <v-btn
      variant="text"
      size="small"
      v-bind="props"
      :disabled="!exportComposable.canExport"
    >
      <v-icon start size="small">mdi-download</v-icon>
      Export
      <v-badge
        v-if="exportComposable.exportBlocked"
        color="error"
        icon="mdi-alert"
        inline
      />
      <v-badge
        v-else-if="exportComposable.showWarning"
        color="warning"
        icon="mdi-alert"
        inline
      />
    </v-btn>
  </template>

  <v-card min-width="280">
    <v-card-title class="text-subtitle-2 py-2 d-flex align-center">
      <v-icon size="small" class="mr-2">mdi-download</v-icon>
      Export Data
    </v-card-title>
    <v-divider />

    <!-- Row count info -->
    <v-card-text class="py-2">
      <div class="text-body-2 text-medium-emphasis">
        {{ exportComposable.exportRowCount.toLocaleString() }} rows
        <span v-if="exportComposable.exportBlocked" class="text-error">
          (exceeds {{ exportComposable.MAX_EXPORT_ROWS.toLocaleString() }} limit)
        </span>
        <span v-else-if="exportComposable.showWarning" class="text-warning">
          (large export)
        </span>
      </div>
      <div v-if="exportComposable.exportBlocked" class="text-caption text-error mt-1">
        Apply filters to reduce row count before exporting
      </div>
    </v-card-text>

    <v-divider />

    <!-- Export options -->
    <v-list density="compact">
      <v-list-item
        :disabled="exportComposable.exportBlocked"
        @click="exportComposable.exportToCSV"
      >
        <template #prepend>
          <v-icon size="small">mdi-file-delimited</v-icon>
        </template>
        <v-list-item-title>CSV (Comma Separated)</v-list-item-title>
        <v-list-item-subtitle>Universal spreadsheet format</v-list-item-subtitle>
      </v-list-item>

      <v-list-item
        :disabled="exportComposable.exportBlocked"
        @click="exportComposable.exportToExcel"
      >
        <template #prepend>
          <v-icon size="small">mdi-microsoft-excel</v-icon>
        </template>
        <v-list-item-title>Excel Workbook (.xlsx)</v-list-item-title>
        <v-list-item-subtitle>Microsoft Excel format</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-card>
</v-menu>
```

Add to script section:
```javascript
import { useExport } from '@/composables/useExport'

// In setup
const exportComposable = useExport()
```

---

### Phase 6: Browse Mode Full Export (Optional Enhancement)

For browse mode, the current page shows limited rows. To export ALL data in browse mode, we need a special IPC handler that fetches all rows:

**File:** `electron/main/index.js` (ADD)

```javascript
/**
 * Export full table to file (for browse mode)
 * Fetches all rows and exports directly to file
 *
 * @param {string} tableName - Table to export
 * @param {string[]} columns - Columns to include
 * @param {string} format - 'csv' or 'xlsx'
 * @param {Object|null} sort - Optional sort config
 */
ipcMain.handle('export-full-table', async (event, tableName, columns, format, sort) => {
  if (!db) {
    return { success: false, reason: 'Database not connected' }
  }

  // Security validations (same as browse-table)
  if (!isValidTable(tableName)) {
    return { success: false, reason: `Invalid table: ${tableName}` }
  }

  const columnsValid = await areValidColumns(db, tableName, columns)
  if (!columnsValid) {
    return { success: false, reason: 'Invalid column names' }
  }

  // Check row count first
  const countResult = await new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM "${tableName}"`, [], (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })

  if (countResult.count > EXPORT_CONFIG.MAX_EXPORT_ROWS) {
    return {
      success: false,
      reason: `Row count (${countResult.count}) exceeds export limit (${EXPORT_CONFIG.MAX_EXPORT_ROWS})`
    }
  }

  // Show save dialog
  const extension = format === 'xlsx' ? 'xlsx' : 'csv'
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: `Export as ${format.toUpperCase()}`,
    defaultPath: `${tableName}_export.${extension}`,
    filters: [
      { name: format === 'xlsx' ? 'Excel Files' : 'CSV Files', extensions: [extension] }
    ]
  })

  if (canceled || !filePath) {
    return { success: false, reason: 'canceled' }
  }

  // Fetch all data
  const columnList = columns.map(c => `"${c}"`).join(', ')
  let orderByClause = ''
  if (sort && sort.column && columns.includes(sort.column)) {
    const direction = sort.direction === 'desc' ? 'DESC' : 'ASC'
    orderByClause = `ORDER BY "${sort.column}" ${direction}`
  }

  const data = await new Promise((resolve, reject) => {
    db.all(`SELECT ${columnList} FROM "${tableName}" ${orderByClause}`, [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })

  // Generate and write file
  try {
    if (format === 'xlsx') {
      const buffer = generateExcel(data, columns)
      await fs.promises.writeFile(filePath, buffer)
    } else {
      const csvContent = generateCSV(data, columns)
      await fs.promises.writeFile(filePath, csvContent, 'utf8')
    }

    log.info(`Full table exported: ${filePath} (${data.length} rows)`)
    return { success: true, filePath, rowCount: data.length }
  } catch (error) {
    log.error('Full table export error:', error.message)
    return { success: false, reason: error.message }
  }
})
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | MODIFY | Add `xlsx` dependency |
| `src/config/export.config.js` | CREATE | Export configuration constants |
| `electron/main/utils/export.js` | CREATE | CSV/Excel generation utilities |
| `electron/main/index.js` | MODIFY | Add IPC handlers for export |
| `electron/preload/index.js` | MODIFY | Expose export APIs to renderer |
| `src/composables/useExport.js` | CREATE | Export business logic |
| `src/components/results/ResultsTable.vue` | MODIFY | Add export menu UI |

---

## Testing Checklist

### Unit Tests

- [ ] `generateCSV()` handles special characters (commas, quotes, newlines)
- [ ] `generateCSV()` handles null/undefined values
- [ ] `generateExcel()` creates valid XLSX buffer
- [ ] `useExport` computed properties calculate correctly

### Integration Tests

- [ ] CSV export creates valid file
- [ ] Excel export creates valid file
- [ ] Save dialog appears with correct filters
- [ ] Cancel dialog returns gracefully
- [ ] Row limit enforcement works
- [ ] Warning threshold displays correctly

### E2E Tests

- [ ] Export button appears when results exist
- [ ] Export menu opens on click
- [ ] CSV export workflow completes
- [ ] Excel export workflow completes
- [ ] Large dataset shows warning
- [ ] Blocked export shows error message

---

## Security Considerations

1. **File System Access**: All file operations in main process only
2. **Path Validation**: Using `dialog.showSaveDialog` ensures user-controlled paths
3. **Data Validation**: All table/column names validated against whitelist
4. **Row Limits**: Hard limit prevents memory exhaustion attacks
5. **IPC Serialization**: Data converted to plain arrays before IPC transfer

---

## Performance Considerations

1. **Row Limit**: 100K rows is ~10-20MB memory for typical datasets
2. **Streaming**: For very large exports, consider `XLSX.stream` (future enhancement)
3. **Column Widths**: Only sample first 100 rows for width calculation
4. **Array Conversion**: Use `Array.from()` to convert Pinia reactive arrays

---

## Anti-Patterns Avoided

1. **No God Object**: Export logic separated into composable, not in component
2. **No Magic Numbers**: All limits in `export.config.js`
3. **No Direct fs Access in Renderer**: All file ops through IPC
4. **No Synchronous File Ops**: Using `fs.promises` throughout
5. **No CSV Library for Simple Case**: Hand-rolled CSV is simpler for output-only

---

## Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| xlsx | ^0.18.5 | Excel file generation | Apache-2.0 |

**Note:** SheetJS is only used in main process, not bundled with renderer. This keeps the renderer bundle small.

---

## Future Enhancements (Out of Scope)

1. **JSON Export**: Add JSON format option
2. **PDF Export**: Add PDF format with pdfkit
3. **Custom Delimiters**: Allow user to choose CSV delimiter
4. **Column Selection**: Dialog to choose which columns to export
5. **Streaming Export**: For very large datasets (>100K rows)
6. **Export History**: Remember last export location
