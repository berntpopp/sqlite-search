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
  const columns = ref([])
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
   * Get visible columns in the configured order
   * Returns columns that are not hidden, in the order specified by columnOrder
   */
  const visibleColumns = computed(() => {
    let result
    if (columnOrder.value.length === 0) {
      // If no custom order, use original order filtered by hidden columns
      result = selectedColumns.value.filter(col => !hiddenColumns.value.includes(col))
      console.log('🔍 DEBUG visibleColumns (no custom order):', result)
    } else {
      // Use custom order, filtered by hidden columns
      result = columnOrder.value.filter(col =>
        selectedColumns.value.includes(col) && !hiddenColumns.value.includes(col)
      )
      console.log('🔍 DEBUG visibleColumns (custom order):', result)
      console.log('🔍 DEBUG - based on columnOrder:', columnOrder.value)
      console.log('🔍 DEBUG - filtered by selectedColumns:', selectedColumns.value)
      console.log('🔍 DEBUG - filtered by hiddenColumns:', hiddenColumns.value)
    }
    return result
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
   * @param {string[]} newColumns - Array of column names
   */
  function setColumns(newColumns) {
    columns.value = newColumns
  }

  /**
   * Select columns to search and persist to localStorage
   * Reconciles column order with actual columns to prevent mismatches
   * @param {string[]} cols - Array of column names to search within
   */
  function selectColumns(cols) {
    console.log('🔍 DEBUG selectColumns called with:', cols)
    console.log('🔍 DEBUG current columnOrder BEFORE reconcile:', columnOrder.value)
    console.log('🔍 DEBUG current hiddenColumns BEFORE reconcile:', hiddenColumns.value)

    selectedColumns.value = cols
    localStorage.setItem('selectedColumns', JSON.stringify(cols))

    // Reconcile columnOrder with actual columns
    // This handles cases where table structure changed between sessions
    if (columnOrder.value.length === 0) {
      // First time - use natural order
      console.log('🔍 DEBUG First time - initializing columnOrder with natural order')
      columnOrder.value = [...cols]
    } else {
      // Reconcile: keep existing order for matching columns, append new ones
      const existingOrder = columnOrder.value.filter(col => cols.includes(col))
      const newColumns = cols.filter(col => !columnOrder.value.includes(col))
      console.log('🔍 DEBUG Reconciling...')
      console.log('🔍 DEBUG - existingOrder:', existingOrder)
      console.log('🔍 DEBUG - newColumns:', newColumns)
      columnOrder.value = [...existingOrder, ...newColumns]
    }

    // Clean up hidden columns - remove any that no longer exist
    const oldHiddenColumns = [...hiddenColumns.value]
    hiddenColumns.value = hiddenColumns.value.filter(col => cols.includes(col))
    if (oldHiddenColumns.length !== hiddenColumns.value.length) {
      console.log('🔍 DEBUG Cleaned up hiddenColumns:', oldHiddenColumns, '=>', hiddenColumns.value)
    }

    console.log('🔍 DEBUG selectedColumns AFTER:', selectedColumns.value)
    console.log('🔍 DEBUG columnOrder AFTER:', columnOrder.value)
    console.log('🔍 DEBUG hiddenColumns AFTER:', hiddenColumns.value)
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
   * Reset all column preferences
   */
  function resetColumnPreferences() {
    columnOrder.value = [...selectedColumns.value]
    hiddenColumns.value = []
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
    visibleColumns,
    hasVisibleColumns,
    hiddenColumnCount,
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
    reset,
    clearTableSelection,
  }
})
