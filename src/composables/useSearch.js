// src/composables/useSearch.js
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useUIStore } from '@/stores/ui.store'

/**
 * Composable for search operations
 * Implements business logic for FTS5 search
 * Note: Uses direct Electron IPC calls, not promises
 */
export function useSearch() {
  const searchStore = useSearchStore()
  const databaseStore = useDatabaseStore()
  const uiStore = useUIStore()

  /**
   * Perform FTS5 search
   * Results come via onSearchResults event listener in App.vue
   */
  function performSearch() {
    // Validation
    if (!searchStore.searchTerm) {
      uiStore.showError('Please enter a search term')
      return
    }

    if (!databaseStore.selectedTable) {
      uiStore.showError('Please select a table')
      return
    }

    if (!databaseStore.selectedColumns.length) {
      uiStore.showError('Please select at least one column to search')
      return
    }

    // Perform search via IPC (response comes via onSearchResults event)
    try {
      searchStore.setLoading(true)
      searchStore.clearError()

      // Convert reactive array to plain array for IPC (avoids cloning error)
      const columnsArray = Array.from(databaseStore.selectedColumns)

      window.electronAPI.performSearch(
        searchStore.searchTerm,
        databaseStore.selectedTable,
        columnsArray
      )
    } catch (error) {
      searchStore.setError(error.message)
      searchStore.setLoading(false)
      uiStore.showError(`Search failed: ${error.message}`)
    }
  }

  /**
   * Clear search results and term
   */
  function clearSearch() {
    searchStore.reset()
  }

  /**
   * Select an item to view details
   */
  function viewDetails(item) {
    searchStore.setSelectedItem(item)
    uiStore.openDetailsDialog()
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        uiStore.showSuccess('Copied to clipboard')
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        uiStore.showSuccess('Copied to clipboard')
      }
    } catch {
      uiStore.showError('Failed to copy to clipboard')
    }
  }

  /**
   * Truncate text for display
   */
  function truncateText(text, maxLength = 50) {
    if (!text) return ''
    const str = String(text)
    return str.length > maxLength ? `${str.substring(0, maxLength)  }...` : str
  }

  return {
    // State (from store)
    searchTerm: searchStore.searchTerm,
    searchResults: searchStore.searchResults,
    loading: searchStore.loading,
    error: searchStore.error,
    selectedItem: searchStore.selectedItem,
    hasResults: searchStore.hasResults,
    resultCount: searchStore.resultCount,
    hasError: searchStore.hasError,
    isSearching: searchStore.isSearching,

    // Actions
    performSearch,
    clearSearch,
    viewDetails,
    copyToClipboard,
    truncateText,
    setSearchTerm: searchStore.setSearchTerm,
    clearResults: searchStore.clearResults,
  }
}
