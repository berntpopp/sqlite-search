// src/services/electron.service.js
/**
 * Electron IPC Service Layer
 * Implements Dependency Inversion Principle by abstracting window.electronAPI calls
 * Converts callback-based IPC to Promise-based API for better async handling
 */

class ElectronService {
  /**
   * Open file dialog to select database
   * @returns {Promise<string|undefined>} Selected file path or undefined
   */
  async openFileDialog() {
    try {
      return await window.electronAPI.openFileDialog()
    } catch (error) {
      console.error('Error opening file dialog:', error)
      throw new Error('Failed to open file dialog')
    }
  }

  /**
   * Change database connection
   * @param {string} filePath - Path to database file
   */
  changeDatabase(filePath) {
    window.electronAPI.changeDatabase(filePath)
  }

  /**
   * Get list of FTS5 tables
   * @returns {Promise<Array<{name: string}>>} List of tables
   */
  getTableList() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('Timeout getting table list'))
      }, 5000)

      const handleTables = (event, tables) => {
        cleanup()
        resolve(tables)
      }

      const handleError = (event, error) => {
        cleanup()
        reject(new Error(error))
      }

      const cleanup = () => {
        clearTimeout(timeout)
        // Note: We keep listeners active as they're needed throughout app lifecycle
      }

      window.electronAPI.getTableList()
      window.electronAPI.onTableList(handleTables)
      window.electronAPI.onDatabaseError(handleError)
    })
  }

  /**
   * Get columns for a specific table
   * @param {string} tableName - Name of the table
   * @returns {Promise<string[]>} List of column names
   */
  getColumns(tableName) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`Timeout getting columns for table: ${tableName}`))
      }, 5000)

      const handleColumns = (event, columns) => {
        cleanup()
        resolve(columns)
      }

      const handleError = (event, error) => {
        cleanup()
        reject(new Error(error))
      }

      const cleanup = () => {
        clearTimeout(timeout)
      }

      window.electronAPI.getColumns(tableName)
      window.electronAPI.onColumnsList(handleColumns)
      window.electronAPI.onDatabaseError(handleError)
    })
  }

  /**
   * Perform FTS5 search
   * @param {string} searchTerm - Search term
   * @param {string} selectedTable - Table to search in
   * @param {string[]} selectedColumns - Columns to search
   * @returns {Promise<Array<Object>>} Search results
   */
  performSearch(searchTerm, selectedTable, selectedColumns) {
    return new Promise((resolve, reject) => {
      if (!searchTerm || !selectedTable || !selectedColumns.length) {
        reject(new Error('Invalid search parameters'))
        return
      }

      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error('Search timeout'))
      }, 30000) // 30 second timeout for large datasets

      const handleResults = (event, results) => {
        cleanup()
        resolve(results)
      }

      const handleError = (event, error) => {
        cleanup()
        reject(new Error(error))
      }

      const cleanup = () => {
        clearTimeout(timeout)
      }

      window.electronAPI.performSearch(searchTerm, selectedTable, selectedColumns)
      window.electronAPI.onSearchResults(handleResults)
      window.electronAPI.onSearchError(handleError)
    })
  }

  /**
   * Setup event listeners for database events
   * Call this once during app initialization
   */
  setupDatabaseListeners(callbacks) {
    if (callbacks.onTableList) {
      window.electronAPI.onTableList(callbacks.onTableList)
    }
    if (callbacks.onColumnsList) {
      window.electronAPI.onColumnsList(callbacks.onColumnsList)
    }
    if (callbacks.onDatabaseError) {
      window.electronAPI.onDatabaseError(callbacks.onDatabaseError)
    }
    if (callbacks.onSearchResults) {
      window.electronAPI.onSearchResults(callbacks.onSearchResults)
    }
    if (callbacks.onSearchError) {
      window.electronAPI.onSearchError(callbacks.onSearchError)
    }
  }
}

// Export singleton instance
export const electronService = new ElectronService()
