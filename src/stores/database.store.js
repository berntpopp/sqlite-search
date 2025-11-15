/**
 * Database Store
 * Manages database connection state, table/column selections with localStorage persistence
 * Uses Pinia Composition API pattern
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDatabaseStore = defineStore('database', () => {
  // State - using ref for reactivity
  const path = ref(localStorage.getItem('databasePath') || '')
  const tables = ref([])
  const selectedTable = ref(localStorage.getItem('selectedTable') || '')
  const columns = ref([])
  const selectedColumns = ref(JSON.parse(localStorage.getItem('selectedColumns') || '[]'))

  // Getters - using computed
  const isConnected = computed(() => !!path.value)
  const hasSelectedTable = computed(() => !!selectedTable.value)
  const hasColumns = computed(() => columns.value.length > 0)
  const fileName = computed(() => {
    if (!path.value) return ''
    const pathParts = path.value.split(/[/\\]/)
    return pathParts[pathParts.length - 1]
  })

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
   * @param {string[]} cols - Array of column names to search within
   */
  function selectColumns(cols) {
    selectedColumns.value = cols
    localStorage.setItem('selectedColumns', JSON.stringify(cols))
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
    // Getters
    isConnected,
    hasSelectedTable,
    hasColumns,
    fileName,
    // Actions
    setPath,
    setTables,
    selectTable,
    setColumns,
    selectColumns,
    reset,
    clearTableSelection,
  }
})
