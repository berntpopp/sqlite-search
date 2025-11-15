// src/composables/useDatabase.js
import { useDatabaseStore } from '@/stores/database.store'
import { useUIStore } from '@/stores/ui.store'

/**
 * Composable for database operations
 * Implements business logic for database selection and management
 * Note: Uses direct Electron IPC calls, not promises
 */
export function useDatabase() {
  const databaseStore = useDatabaseStore()
  const uiStore = useUIStore()

  /**
   * Select a new database file
   * Uses Electron IPC directly - response comes via onTableList event
   */
  async function selectDatabase() {
    try {
      const filePath = await window.electronAPI.openFileDialog()

      if (filePath) {
        // Update store
        databaseStore.setPath(filePath)

        // Reset table/column selections
        databaseStore.clearTableSelection()

        // Change database in backend (no response expected)
        window.electronAPI.changeDatabase(filePath)

        // Request tables list (response comes via onTableList event in App.vue)
        window.electronAPI.getTableList()

        uiStore.showSuccess(`Database loaded: ${databaseStore.fileName}`)
      }
    } catch (error) {
      console.error('Error selecting database:', error)
      uiStore.showError('Failed to select database')
    }
  }

  /**
   * Load list of FTS5 tables from current database
   * Response comes via onTableList event listener in App.vue
   */
  function loadTables() {
    try {
      window.electronAPI.getTableList()
    } catch (error) {
      console.error('Error loading tables:', error)
      uiStore.showError('Failed to load tables')
    }
  }

  /**
   * Select a table and load its columns
   * Column response comes via onColumnsList event listener in App.vue
   */
  function selectTable(tableName) {
    try {
      databaseStore.selectTable(tableName)
      window.electronAPI.getColumns(tableName)
    } catch (error) {
      console.error('Error selecting table:', error)
      uiStore.showError('Failed to select table')
    }
  }

  /**
   * Reset database connection and state
   */
  function resetDatabase() {
    databaseStore.reset()
    uiStore.showInfo('Database connection reset')
  }

  return {
    // State (from store)
    path: databaseStore.path,
    tables: databaseStore.tables,
    selectedTable: databaseStore.selectedTable,
    columns: databaseStore.columns,
    selectedColumns: databaseStore.selectedColumns,
    isConnected: databaseStore.isConnected,
    hasSelectedTable: databaseStore.hasSelectedTable,
    hasColumns: databaseStore.hasColumns,
    fileName: databaseStore.fileName,

    // Actions
    selectDatabase,
    loadTables,
    selectTable,
    resetDatabase,
    selectColumns: databaseStore.selectColumns,
  }
}
