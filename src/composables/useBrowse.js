// src/composables/useBrowse.js
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore, VIEW_MODES } from '@/stores/search.store'
import { useUIStore } from '@/stores/ui.store'

/**
 * Composable for browse mode operations
 * Implements business logic for table browsing with server-side pagination
 * Note: Uses direct Electron IPC calls - responses come via event listeners in App.vue
 */
export function useBrowse() {
  const databaseStore = useDatabaseStore()
  const searchStore = useSearchStore()
  const uiStore = useUIStore()

  /**
   * Fetch a page of browse data from the database
   * Response comes via onBrowseResults event listener in App.vue
   * @param {number} page - Page number (1-indexed)
   * @param {number} itemsPerPage - Number of items per page
   */
  function fetchBrowsePage(page = 1, itemsPerPage = 25) {
    if (!databaseStore.selectedTable) {
      uiStore.showError('No table selected')
      return
    }

    if (databaseStore.selectedColumns.length === 0) {
      uiStore.showError('No columns selected')
      return
    }

    searchStore.setBrowseLoading(true)

    // Convert reactive array to plain array for IPC transfer
    const columns = Array.from(databaseStore.selectedColumns)
    const sort = searchStore.browseSort.column
      ? { column: searchStore.browseSort.column, direction: searchStore.browseSort.direction }
      : null

    window.electronAPI.browseTable(
      databaseStore.selectedTable,
      columns,
      page,
      itemsPerPage,
      sort
    )
  }

  /**
   * Navigate to a specific page
   * @param {number} page - Page number (1-indexed)
   */
  function goToPage(page) {
    const { itemsPerPage } = searchStore.browseData
    searchStore.setBrowsePagination(page, itemsPerPage)
    fetchBrowsePage(page, itemsPerPage)
  }

  /**
   * Change the number of items per page
   * Resets to page 1 when items per page changes
   * @param {number} itemsPerPage - New items per page value
   */
  function setItemsPerPage(itemsPerPage) {
    searchStore.setBrowsePagination(1, itemsPerPage)
    fetchBrowsePage(1, itemsPerPage)
  }

  /**
   * Sort by a specific column
   * Resets to page 1 when sort changes
   * @param {string} column - Column name to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc')
   */
  function sortBy(column, direction = 'asc') {
    searchStore.setBrowseSort(column, direction)
    fetchBrowsePage(1, searchStore.browseData.itemsPerPage)
  }

  /**
   * Toggle sort direction for a column
   * @param {string} column - Column name to sort by
   */
  function toggleSort(column) {
    const currentSort = searchStore.browseSort
    let newDirection = 'asc'

    if (currentSort.column === column) {
      // Toggle direction
      newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc'
    }

    sortBy(column, newDirection)
  }

  /**
   * Clear current sort
   */
  function clearSort() {
    searchStore.setBrowseSort(null, 'asc')
    fetchBrowsePage(1, searchStore.browseData.itemsPerPage)
  }

  /**
   * Switch to browse mode and load first page
   */
  function enterBrowseMode() {
    searchStore.setViewMode(VIEW_MODES.BROWSE)
    fetchBrowsePage(1, searchStore.browseData.itemsPerPage)
  }

  /**
   * Switch to search mode
   */
  function enterSearchMode() {
    searchStore.setViewMode(VIEW_MODES.SEARCH)
  }

  /**
   * Toggle between search and browse modes
   */
  function toggleViewMode() {
    if (searchStore.isBrowseMode) {
      enterSearchMode()
    } else {
      enterBrowseMode()
    }
  }

  /**
   * Refresh current browse page
   */
  function refresh() {
    const { page, itemsPerPage } = searchStore.browseData
    fetchBrowsePage(page, itemsPerPage)
  }

  return {
    // State (from store - reactive)
    browseData: searchStore.browseData,
    browseLoading: searchStore.browseLoading,
    browseError: searchStore.browseError,
    browseSort: searchStore.browseSort,
    isBrowseMode: searchStore.isBrowseMode,
    isSearchMode: searchStore.isSearchMode,
    browseTotalPages: searchStore.browseTotalPages,
    browsePaginationInfo: searchStore.browsePaginationInfo,
    hasBrowseData: searchStore.hasBrowseData,
    viewMode: searchStore.viewMode,

    // Actions
    fetchBrowsePage,
    goToPage,
    setItemsPerPage,
    sortBy,
    toggleSort,
    clearSort,
    enterBrowseMode,
    enterSearchMode,
    toggleViewMode,
    refresh,
  }
}
