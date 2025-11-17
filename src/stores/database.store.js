/**
 * Database Store
 * Manages database connection state, table/column selections with localStorage persistence
 * Enhanced with column management (visibility and ordering)
 * Uses Pinia Composition API pattern
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { SEARCH_CONFIG } from '@/config/search.config'

export const useDatabaseStore = defineStore('database', () => {
  // State - using ref for reactivity
  const path = ref(localStorage.getItem('databasePath') || '')
  const tables = ref([])
  const selectedTable = ref(localStorage.getItem('selectedTable') || '')
  const columns = ref([]) // Array of { name: string, type: string } objects
  const selectedColumns = ref(JSON.parse(localStorage.getItem('selectedColumns') || '[]'))

  // Column management state
  const columnOrder = ref([]) // Array of column names in display order
  const hiddenColumns = ref([]) // Array of hidden column names

  // Getters - using computed
  const isConnected = computed(() => !!path.value)
  const hasSelectedTable = computed(() => !!selectedTable.value)
  const hasColumns = computed(() => columns.value.length > 0)
  const fileName = computed(() => {
    if (!path.value) return ''
    const pathParts = path.value.split(/[/\\]/)
    return pathParts[pathParts.length - 1]
  })

  /**
   * Get column names from structured column data
   * For backward compatibility with components expecting string arrays
   */
  const columnNames = computed(() => {
    return columns.value.map(col => col.name)
  })

  /**
   * Get only TEXT-type columns for auto-selection
   * Includes: TEXT, VARCHAR, CHAR, CLOB, and empty type (defaults to TEXT in SQLite)
   */
  const textColumns = computed(() => {
    return columns.value
      .filter(col => {
        const type = (col.type || '').toUpperCase()
        return (
          type === '' ||
          type === 'TEXT' ||
          type.startsWith('VARCHAR') ||
          type.startsWith('CHAR') ||
          type === 'CLOB'
        )
      })
      .map(col => col.name)
  })

  /**
   * Get column type for a specific column name
   * @param {string} columnName - Name of the column
   * @returns {string} - Column type (e.g., 'TEXT', 'INTEGER', 'REAL')
   */
  function getColumnType(columnName) {
    const column = columns.value.find(col => col.name === columnName)
    return column ? column.type : ''
  }

  /**
   * Check if a column is a text type
   * @param {string} columnName - Name of the column
   * @returns {boolean} - True if column is text type
   */
  function isTextColumn(columnName) {
    return textColumns.value.includes(columnName)
  }

  /**
   * Get visible columns in the configured order
   * Returns columns that are not hidden, in the order specified by columnOrder
   */
  const visibleColumns = computed(() => {
    if (columnOrder.value.length === 0) {
      // If no custom order, use original order filtered by hidden columns
      return selectedColumns.value.filter(col => !hiddenColumns.value.includes(col))
    } else {
      // Use custom order, filtered by hidden columns
      return columnOrder.value.filter(col =>
        selectedColumns.value.includes(col) && !hiddenColumns.value.includes(col)
      )
    }
  })

  /**
   * Check if at least one column is visible
   */
  const hasVisibleColumns = computed(() => visibleColumns.value.length > 0)

  /**
   * Get count of hidden columns
   */
  const hiddenColumnCount = computed(() => hiddenColumns.value.length)

  // Persistence helpers for column management
  /**
   * Generate localStorage key for table-specific column preferences
   * @param {string} tableName - Name of the table
   * @param {string} type - Type of preference (order, hidden)
   * @returns {string} - localStorage key
   */
  function getColumnStorageKey(tableName, type) {
    return `${SEARCH_CONFIG.STORAGE_KEY_PREFIX}_column_${type}_${tableName}`
  }

  /**
   * Load column order from localStorage
   * @param {string} tableName - Name of the table
   */
  function loadColumnOrder(tableName) {
    if (!tableName) return

    const key = getColumnStorageKey(tableName, 'order')
    const stored = localStorage.getItem(key)

    if (stored) {
      try {
        columnOrder.value = JSON.parse(stored)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse column order:', e)
        columnOrder.value = []
      }
    } else {
      columnOrder.value = []
    }
  }

  /**
   * Save column order to localStorage
   * @param {string} tableName - Name of the table
   */
  function saveColumnOrder(tableName) {
    if (!tableName) return

    const key = getColumnStorageKey(tableName, 'order')
    localStorage.setItem(key, JSON.stringify(columnOrder.value))
  }

  /**
   * Load hidden columns from localStorage
   * @param {string} tableName - Name of the table
   */
  function loadHiddenColumns(tableName) {
    if (!tableName) return

    const key = getColumnStorageKey(tableName, 'hidden')
    const stored = localStorage.getItem(key)

    if (stored) {
      try {
        hiddenColumns.value = JSON.parse(stored)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse hidden columns:', e)
        hiddenColumns.value = []
      }
    } else {
      hiddenColumns.value = []
    }
  }

  /**
   * Save hidden columns to localStorage
   * @param {string} tableName - Name of the table
   */
  function saveHiddenColumns(tableName) {
    if (!tableName) return

    const key = getColumnStorageKey(tableName, 'hidden')
    localStorage.setItem(key, JSON.stringify(hiddenColumns.value))
  }

  // Watch for column management changes and persist
  watch(columnOrder, () => {
    if (selectedTable.value) {
      saveColumnOrder(selectedTable.value)
    }
  }, { deep: true })

  watch(hiddenColumns, () => {
    if (selectedTable.value) {
      saveHiddenColumns(selectedTable.value)
    }
  }, { deep: true })

  // Actions
  /**
   * Set database file path and persist to localStorage
   * @param {string} newPath - Absolute path to SQLite database file
   */
  function setPath(newPath) {
    path.value = newPath
    localStorage.setItem('databasePath', newPath)
  }

  /**
   * Update list of available FTS5 tables
   * @param {string[]} newTables - Array of FTS5 table names
   */
  function setTables(newTables) {
    tables.value = newTables
  }

  /**
   * Select a table and persist to localStorage
   * Automatically resets column selections when table changes
   * @param {string} table - Name of FTS5 table to select
   */
  function selectTable(table) {
    selectedTable.value = table
    localStorage.setItem('selectedTable', table)
    // Reset columns when table changes
    selectedColumns.value = []
    localStorage.removeItem('selectedColumns')
    // Load column preferences for this table
    loadColumnOrder(table)
    loadHiddenColumns(table)
  }

  /**
   * Update list of available columns for selected table
   * @param {Array<{name: string, type: string}>} newColumns - Array of column objects with name and type
   */
  function setColumns(newColumns) {
    columns.value = newColumns
  }

  /**
   * Select columns to search and persist to localStorage
   * Reconciles column order with actual columns to prevent mismatches
   * @param {string[]|null} cols - Array of column names to search within, or null to auto-select text columns
   * @param {boolean} autoSelectTextOnly - If true, auto-select only TEXT columns (default: false)
   */
  function selectColumns(cols, autoSelectTextOnly = false) {
    // Auto-select text columns if requested or cols is null
    let columnsToSelect = cols
    if (cols === null || autoSelectTextOnly) {
      columnsToSelect = textColumns.value
      // eslint-disable-next-line no-console
      console.log('Auto-selected TEXT columns:', columnsToSelect)
    }

    selectedColumns.value = columnsToSelect
    localStorage.setItem('selectedColumns', JSON.stringify(columnsToSelect))

    // Reconcile columnOrder with actual columns
    // This handles cases where table structure changed between sessions
    if (columnOrder.value.length === 0) {
      // First time - use natural order
      columnOrder.value = [...columnsToSelect]
    } else {
      // Reconcile: keep existing order for matching columns, append new ones
      const existingOrder = columnOrder.value.filter(col => columnsToSelect.includes(col))
      const newColumns = columnsToSelect.filter(col => !columnOrder.value.includes(col))
      columnOrder.value = [...existingOrder, ...newColumns]
    }

    // Clean up hidden columns - remove any that no longer exist
    hiddenColumns.value = hiddenColumns.value.filter(col => columnsToSelect.includes(col))

    // Auto-hide non-text columns if auto-select is enabled
    if (autoSelectTextOnly && columns.value.length > 0) {
      const nonTextCols = columnNames.value.filter(col => !textColumns.value.includes(col))
      hiddenColumns.value = [...new Set([...hiddenColumns.value, ...nonTextCols])]
      // eslint-disable-next-line no-console
      console.log('Auto-hidden non-TEXT columns:', nonTextCols)
    } else if (!autoSelectTextOnly) {
      // When auto-select is disabled, show ALL selected columns
      // Clear hidden columns for columns that are now selected
      hiddenColumns.value = hiddenColumns.value.filter(col => !columnsToSelect.includes(col))
      // eslint-disable-next-line no-console
      console.log('Showing all selected columns')
    }
  }

  /**
   * Set custom column order
   * @param {string[]} newOrder - Array of column names in desired order
   */
  function setColumnOrder(newOrder) {
    columnOrder.value = newOrder
  }

  /**
   * Move column up in the order
   * @param {string} columnName - Name of the column to move
   */
  function moveColumnUp(columnName) {
    const index = columnOrder.value.indexOf(columnName)
    if (index > 0) {
      const newOrder = [...columnOrder.value]
      ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
      columnOrder.value = newOrder
    }
  }

  /**
   * Move column down in the order
   * @param {string} columnName - Name of the column to move
   */
  function moveColumnDown(columnName) {
    const index = columnOrder.value.indexOf(columnName)
    if (index >= 0 && index < columnOrder.value.length - 1) {
      const newOrder = [...columnOrder.value]
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
      columnOrder.value = newOrder
    }
  }

  /**
   * Toggle column visibility
   * @param {string} columnName - Name of the column
   */
  function toggleColumnVisibility(columnName) {
    const index = hiddenColumns.value.indexOf(columnName)

    if (index === -1) {
      // Hide column (but ensure at least one column remains visible)
      const wouldBeVisible = visibleColumns.value.length - 1
      if (wouldBeVisible >= SEARCH_CONFIG.COLUMN_MANAGEMENT.MIN_VISIBLE_COLUMNS) {
        hiddenColumns.value = [...hiddenColumns.value, columnName]
      }
    } else {
      // Show column
      hiddenColumns.value = hiddenColumns.value.filter(col => col !== columnName)
    }
  }

  /**
   * Hide a specific column
   * @param {string} columnName - Name of the column to hide
   */
  function hideColumn(columnName) {
    if (!hiddenColumns.value.includes(columnName)) {
      const wouldBeVisible = visibleColumns.value.length - 1
      if (wouldBeVisible >= SEARCH_CONFIG.COLUMN_MANAGEMENT.MIN_VISIBLE_COLUMNS) {
        hiddenColumns.value = [...hiddenColumns.value, columnName]
      }
    }
  }

  /**
   * Show a specific column
   * @param {string} columnName - Name of the column to show
   */
  function showColumn(columnName) {
    hiddenColumns.value = hiddenColumns.value.filter(col => col !== columnName)
  }

  /**
   * Show all columns
   */
  function showAllColumns() {
    hiddenColumns.value = []
  }

  /**
   * Reset column order to default (original order)
   */
  function resetColumnOrder() {
    columnOrder.value = [...selectedColumns.value]
  }

  /**
   * Reset all column preferences and clear localStorage cache
   */
  function resetColumnPreferences() {
    // Reset to defaults
    columnOrder.value = [...selectedColumns.value]
    hiddenColumns.value = []

    // Clear localStorage cache for current table
    if (selectedTable.value) {
      const orderKey = getColumnStorageKey(selectedTable.value, 'order')
      const hiddenKey = getColumnStorageKey(selectedTable.value, 'hidden')
      localStorage.removeItem(orderKey)
      localStorage.removeItem(hiddenKey)
    }
  }

  /**
   * Clear ALL localStorage cache for current table (columns, sort, filters)
   */
  function clearAllTableCache() {
    if (selectedTable.value) {
      // Clear column preferences
      const orderKey = getColumnStorageKey(selectedTable.value, 'order')
      const hiddenKey = getColumnStorageKey(selectedTable.value, 'hidden')
      localStorage.removeItem(orderKey)
      localStorage.removeItem(hiddenKey)

      // Clear sort and filter preferences (from search store)
      const sortKey = `${SEARCH_CONFIG.STORAGE_KEY_PREFIX}_sort_${selectedTable.value}`
      const filtersKey = `${SEARCH_CONFIG.STORAGE_KEY_PREFIX}_filters_${selectedTable.value}`
      localStorage.removeItem(sortKey)
      localStorage.removeItem(filtersKey)

      // Reset local state
      columnOrder.value = [...selectedColumns.value]
      hiddenColumns.value = []
    }
  }

  /**
   * Reset entire database state and clear all localStorage entries
   * Called when user disconnects database or selects new database
   */
  function reset() {
    path.value = ''
    tables.value = []
    selectedTable.value = ''
    columns.value = []
    selectedColumns.value = []
    columnOrder.value = []
    hiddenColumns.value = []
    localStorage.removeItem('databasePath')
    localStorage.removeItem('selectedTable')
    localStorage.removeItem('selectedColumns')
  }

  /**
   * Clear table and column selections while keeping database connection
   * Called when changing to a different database file
   */
  function clearTableSelection() {
    selectedTable.value = ''
    columns.value = []
    selectedColumns.value = []
    columnOrder.value = []
    hiddenColumns.value = []
    localStorage.removeItem('selectedTable')
    localStorage.removeItem('selectedColumns')
  }

  return {
    // State
    path,
    tables,
    selectedTable,
    columns,
    selectedColumns,
    columnOrder,
    hiddenColumns,
    // Getters
    isConnected,
    hasSelectedTable,
    hasColumns,
    fileName,
    columnNames,
    textColumns,
    visibleColumns,
    hasVisibleColumns,
    hiddenColumnCount,
    // Helpers
    getColumnType,
    isTextColumn,
    // Actions
    setPath,
    setTables,
    selectTable,
    setColumns,
    selectColumns,
    setColumnOrder,
    moveColumnUp,
    moveColumnDown,
    toggleColumnVisibility,
    hideColumn,
    showColumn,
    showAllColumns,
    resetColumnOrder,
    resetColumnPreferences,
    clearAllTableCache,
    reset,
    clearTableSelection,
  }
})
