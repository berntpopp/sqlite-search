/**
 * Export Composable
 *
 * Provides export functionality for search results and browse data.
 * Handles validation, data preparation, and IPC communication.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles export operations
 * - Dependency Inversion: Depends on abstractions (stores, config)
 *
 * @module composables/useExport
 */

import { computed } from 'vue'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useUIStore } from '@/stores/ui.store'
import { EXPORT_CONFIG } from '@/config/export.config'

/**
 * Export composable providing export functionality for table data
 *
 * @returns {Object} Export state and actions
 */
export function useExport() {
  const searchStore = useSearchStore()
  const databaseStore = useDatabaseStore()
  const uiStore = useUIStore()

  // =========================================================================
  // Computed Properties
  // =========================================================================

  /**
   * Get current exportable data based on mode (search vs browse)
   * In search mode: returns filtered results
   * In browse mode: returns current page rows
   */
  const exportData = computed(() => {
    if (searchStore.isBrowseMode) {
      return searchStore.browseData.rows
    }
    return searchStore.filteredResults
  })

  /**
   * Get total exportable row count
   * In browse mode, this is the total count (not just current page)
   */
  const exportRowCount = computed(() => {
    if (searchStore.isBrowseMode) {
      // In browse mode, we only have current page loaded locally
      // For now, only export current view (not full table)
      return searchStore.browseData.rows.length
    }
    return searchStore.filteredResultCount
  })

  /**
   * Check if export is allowed (has data and within limits)
   */
  const canExport = computed(() => {
    return exportRowCount.value > 0 && exportRowCount.value <= EXPORT_CONFIG.MAX_EXPORT_ROWS
  })

  /**
   * Check if row count exceeds warning threshold
   */
  const showWarning = computed(() => {
    return (
      exportRowCount.value > EXPORT_CONFIG.WARNING_THRESHOLD &&
      exportRowCount.value <= EXPORT_CONFIG.MAX_EXPORT_ROWS
    )
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

  // =========================================================================
  // Helper Functions
  // =========================================================================

  /**
   * Generate default filename based on context
   *
   * @param {string} extension - File extension (csv or xlsx)
   * @returns {string} Generated filename
   */
  function getDefaultFilename(extension) {
    const table = databaseStore.selectedTable || 'export'
    const mode = searchStore.isBrowseMode ? 'browse' : 'search'
    const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    return `${table}_${mode}_${timestamp}.${extension}`
  }

  // =========================================================================
  // Export Actions
  // =========================================================================

  /**
   * Deep clone data to plain objects for IPC serialization
   * Vue reactive proxies cannot be cloned over IPC
   *
   * @param {Object[]} reactiveData - Reactive data array
   * @returns {Object[]} Plain JavaScript objects
   */
  function toPlainObjects(reactiveData) {
    return JSON.parse(JSON.stringify(reactiveData))
  }

  /**
   * Export current data to CSV file
   * Shows save dialog and writes file via main process IPC
   */
  async function exportToCSV() {
    // Validate export is possible
    if (!canExport.value) {
      const message = exportBlocked.value
        ? `Cannot export: row count (${exportRowCount.value.toLocaleString()}) exceeds limit (${EXPORT_CONFIG.MAX_EXPORT_ROWS.toLocaleString()})`
        : 'No data to export'
      uiStore.showError(message)
      return
    }

    // Prepare data for IPC transfer (deep clone to remove reactive proxies)
    const data = toPlainObjects(exportData.value)
    const columns = Array.from(exportColumns.value)
    const filename = getDefaultFilename('csv')

    try {
      // Call main process via preload bridge
      const result = await window.electronAPI.exportToCSV(data, columns, filename)

      if (result.success) {
        uiStore.showSuccess(`Exported ${result.rowCount.toLocaleString()} rows to CSV`)
      } else if (result.reason !== 'canceled') {
        uiStore.showError(`Export failed: ${result.reason}`)
      }
      // If canceled, show nothing (user action)
    } catch (error) {
      console.error('CSV export error:', error)
      uiStore.showError(`Export failed: ${error.message || 'unexpected error'}`)
    }
  }

  /**
   * Export current data to Excel file
   * Shows save dialog and writes file via main process IPC
   */
  async function exportToExcel() {
    // Validate export is possible
    if (!canExport.value) {
      const message = exportBlocked.value
        ? `Cannot export: row count (${exportRowCount.value.toLocaleString()}) exceeds limit (${EXPORT_CONFIG.MAX_EXPORT_ROWS.toLocaleString()})`
        : 'No data to export'
      uiStore.showError(message)
      return
    }

    // Prepare data for IPC transfer (deep clone to remove reactive proxies)
    const data = toPlainObjects(exportData.value)
    const columns = Array.from(exportColumns.value)
    const filename = getDefaultFilename('xlsx')

    try {
      // Call main process via preload bridge
      const result = await window.electronAPI.exportToExcel(data, columns, filename)

      if (result.success) {
        uiStore.showSuccess(`Exported ${result.rowCount.toLocaleString()} rows to Excel`)
      } else if (result.reason !== 'canceled') {
        uiStore.showError(`Export failed: ${result.reason}`)
      }
      // If canceled, show nothing (user action)
    } catch (error) {
      console.error('Excel export error:', error)
      uiStore.showError(`Export failed: ${error.message || 'unexpected error'}`)
    }
  }

  // =========================================================================
  // Return Public API
  // =========================================================================

  return {
    // Computed State
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

    // Config (exposed for UI display)
    MAX_EXPORT_ROWS: EXPORT_CONFIG.MAX_EXPORT_ROWS,
    WARNING_THRESHOLD: EXPORT_CONFIG.WARNING_THRESHOLD,
    FORMATS: EXPORT_CONFIG.FORMATS,
  }
}
