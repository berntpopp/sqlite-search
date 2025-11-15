// src/composables/useDatabase.js
import { electronService } from '@/services/electron.service'
import { useDatabaseStore } from '@/stores/database.store'
import { useUIStore } from '@/stores/ui.store'

/**
 * Composable for database operations
 * Implements business logic for database selection and management
 */
export function useDatabase() {
  const databaseStore = useDatabaseStore()
  const uiStore = useUIStore()

  /**
   * Select a new database file
   */
  async function selectDatabase() {
    try {
      const filePath = await electronService.openFileDialog()

      if (filePath) {
        // Update store
        databaseStore.setPath(filePath)

        // Reset table/column selections
        databaseStore.clearTableSelection()

        // Change database in backend
        electronService.changeDatabase(filePath)

        // Load tables
        await loadTables()

        uiStore.showSuccess(`Database loaded: ${databaseStore.fileName}`)
      }
    } catch (error) {
      console.error('Error selecting database:', error)
      uiStore.showError('Failed to select database')
    }
  }

  /**
   * Load list of FTS5 tables from current database
   */
  async function loadTables() {
    try {
      const tables = await electronService.getTableList()
      databaseStore.setTables(tables.map(t => t.name))
    } catch (error) {
      console.error('Error loading tables:', error)
      uiStore.showError('Failed to load tables')
    }
  }

  /**
   * Select a table and load its columns
   */
  async function selectTable(tableName) {
    try {
      databaseStore.selectTable(tableName)
      await loadColumns(tableName)
    } catch (error) {
      console.error('Error selecting table:', error)
      uiStore.showError('Failed to select table')
    }
  }

  /**
   * Load columns for a specific table
   */
  async function loadColumns(tableName) {
    try {
      const columns = await electronService.getColumns(tableName)
      databaseStore.setColumns(columns)

      // Auto-select all columns by default
      databaseStore.selectColumns(columns)
    } catch (error) {
      console.error('Error loading columns:', error)
      uiStore.showError('Failed to load columns')
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
    loadColumns,
    resetDatabase,
    selectColumns: databaseStore.selectColumns,
  }
}
