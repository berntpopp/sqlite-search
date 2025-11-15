// src/composables/useSearch.js
import { electronService } from '@/services/electron.service'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useUIStore } from '@/stores/ui.store'

/**
 * Composable for search operations
 * Implements business logic for FTS5 search
 */
export function useSearch() {
  const searchStore = useSearchStore()
  const databaseStore = useDatabaseStore()
  const uiStore = useUIStore()

  /**
   * Perform FTS5 search
   */
  async function performSearch() {
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

    // Perform search
    try {
      searchStore.setLoading(true)
      searchStore.clearError()

      const results = await electronService.performSearch(
        searchStore.searchTerm,
        databaseStore.selectedTable,
        databaseStore.selectedColumns
      )

      searchStore.setResults(results)

      if (results.length === 0) {
        uiStore.showInfo('No results found')
      } else {
        uiStore.showSuccess(`Found ${results.length} result(s)`)
      }
    } catch (error) {
      console.error('Search error:', error)
      searchStore.setError(error.message)
      uiStore.showError(`Search failed: ${error.message}`)
    } finally {
      searchStore.setLoading(false)
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
    } catch (error) {
      console.error('Copy error:', error)
      uiStore.showError('Failed to copy to clipboard')
    }
  }

  /**
   * Truncate text for display
   */
  function truncateText(text, maxLength = 50) {
    if (!text) return ''
    const str = String(text)
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
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
