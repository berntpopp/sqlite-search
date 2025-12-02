/**
 * Search Store
 * Manages FTS5 search state including search term, results, loading states, and errors
 * Enhanced with sorting, filtering, column management, and browse mode capabilities
 * Uses Pinia Composition API pattern
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { SEARCH_CONFIG } from '@/config/search.config'

/**
 * View mode constants
 */
export const VIEW_MODES = {
  SEARCH: 'search',
  BROWSE: 'browse'
}

export const useSearchStore = defineStore('search', () => {
  // ===========================================
  // SEARCH MODE STATE
  // ===========================================
  const searchTerm = ref('')
  const searchResults = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedItem = ref(null)

  // Advanced features state
  const sortBy = ref([]) // Array of { key: string, order: 'asc' | 'desc' }
  const columnFilters = ref({}) // { columnName: filterValue }
  const currentTableName = ref('') // Track current table for persistence

  // Track if a search has been performed (for empty state handling)
  const hasSearched = ref(false)

  // ===========================================
  // VIEW MODE STATE (Search vs Browse)
  // ===========================================
  const viewMode = ref(VIEW_MODES.SEARCH)

  // ===========================================
  // BROWSE MODE STATE
  // ===========================================
  const browseData = ref({
    rows: [],
    totalCount: 0,
    page: 1,
    itemsPerPage: 25
  })
  const browseLoading = ref(false)
  const browseError = ref(null)
  const browseSort = ref({ column: null, direction: 'asc' })

  // Getters
  const hasResults = computed(() => searchResults.value.length > 0)
  const resultCount = computed(() => searchResults.value.length)
  const hasError = computed(() => !!error.value)
  const isSearching = computed(() => loading.value)

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed(() => {
    return Object.values(columnFilters.value).some(filter => filter && filter.trim() !== '')
  })

  /**
   * Count of active filters
   */
  const activeFilterCount = computed(() => {
    return Object.values(columnFilters.value).filter(filter => filter && filter.trim() !== '').length
  })

  /**
   * Apply column filters to search results
   * Filters are case-insensitive and support partial matching
   */
  const filteredResults = computed(() => {
    if (!hasActiveFilters.value) {
      return searchResults.value
    }

    return searchResults.value.filter(row => {
      return Object.entries(columnFilters.value).every(([columnName, filterValue]) => {
        // Skip empty filters
        if (!filterValue || filterValue.trim() === '') {
          return true
        }

        // Case-insensitive partial match
        const cellValue = String(row[columnName] || '').toLowerCase()
        const searchValue = filterValue.toLowerCase().trim()

        return cellValue.includes(searchValue)
      })
    })
  })

  /**
   * Get count of filtered results
   */
  const filteredResultCount = computed(() => filteredResults.value.length)

  // ===========================================
  // BROWSE MODE GETTERS
  // ===========================================

  /**
   * Check if currently in browse mode
   */
  const isBrowseMode = computed(() => viewMode.value === VIEW_MODES.BROWSE)

  /**
   * Check if currently in search mode
   */
  const isSearchMode = computed(() => viewMode.value === VIEW_MODES.SEARCH)

  /**
   * Check if browse mode has data
   */
  const hasBrowseData = computed(() => browseData.value.rows.length > 0)

  /**
   * Get total pages for browse pagination
   */
  const browseTotalPages = computed(() => {
    const { totalCount, itemsPerPage } = browseData.value
    return Math.max(1, Math.ceil(totalCount / itemsPerPage))
  })

  /**
   * Get pagination info for browse mode display
   */
  const browsePaginationInfo = computed(() => {
    const { rows, totalCount, page, itemsPerPage } = browseData.value
    if (totalCount === 0) {
      return { start: 0, end: 0, total: 0 }
    }
    const start = (page - 1) * itemsPerPage + 1
    const end = Math.min(page * itemsPerPage, totalCount)
    return { start, end, total: totalCount, currentPageCount: rows.length }
  })

  // Persistence helpers
  /**
   * Generate localStorage key for table-specific preferences
   * @param {string} tableName - Name of the table
   * @param {string} type - Type of preference (sort, filters)
   * @returns {string} - localStorage key
   */
  function getStorageKey(tableName, type) {
    return `${SEARCH_CONFIG.STORAGE_KEY_PREFIX}_${type}_${tableName}`
  }

  /**
   * Load sort preferences from localStorage
   * @param {string} tableName - Name of the table
   */
  function loadSortPreferences(tableName) {
    if (!tableName) return

    const key = getStorageKey(tableName, 'sort')
    const stored = localStorage.getItem(key)

    if (stored) {
      try {
        sortBy.value = JSON.parse(stored)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse sort preferences:', e)
        sortBy.value = []
      }
    } else {
      sortBy.value = []
    }
  }

  /**
   * Save sort preferences to localStorage
   * @param {string} tableName - Name of the table
   */
  function saveSortPreferences(tableName) {
    if (!tableName) return

    const key = getStorageKey(tableName, 'sort')
    localStorage.setItem(key, JSON.stringify(sortBy.value))
  }

  /**
   * Load filter preferences from localStorage
   * @param {string} tableName - Name of the table
   */
  function loadFilterPreferences(tableName) {
    if (!tableName) return

    const key = getStorageKey(tableName, 'filters')
    const stored = localStorage.getItem(key)

    if (stored) {
      try {
        columnFilters.value = JSON.parse(stored)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse filter preferences:', e)
        columnFilters.value = {}
      }
    } else {
      columnFilters.value = {}
    }
  }

  /**
   * Save filter preferences to localStorage
   * @param {string} tableName - Name of the table
   */
  function saveFilterPreferences(tableName) {
    if (!tableName) return

    const key = getStorageKey(tableName, 'filters')
    localStorage.setItem(key, JSON.stringify(columnFilters.value))
  }

  // Watch for sort changes and persist
  watch(sortBy, () => {
    if (currentTableName.value) {
      saveSortPreferences(currentTableName.value)
    }
  }, { deep: true })

  // Watch for filter changes and persist (debounced handled in component)
  watch(columnFilters, () => {
    if (currentTableName.value) {
      saveFilterPreferences(currentTableName.value)
    }
  }, { deep: true })

  // Actions
  /**
   * Update the current search term
   * @param {string} term - FTS5 search query string
   */
  function setSearchTerm(term) {
    searchTerm.value = term
  }

  /**
   * Set search results and clear any previous errors
   * @param {Array<Object>} results - Array of search result objects from FTS5 query
   */
  function setResults(results) {
    searchResults.value = results
    error.value = null
    hasSearched.value = true
  }

  /**
   * Set loading state for search operation
   * @param {boolean} isLoading - True when search is in progress
   */
  function setLoading(isLoading) {
    loading.value = isLoading
  }

  /**
   * Set error message and automatically stop loading
   * @param {string} errorMessage - Error message to display
   */
  function setError(errorMessage) {
    error.value = errorMessage
    loading.value = false
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = null
  }

  /**
   * Set currently selected item for detail view
   * @param {Object|null} item - Search result item to view in detail dialog
   */
  function setSelectedItem(item) {
    selectedItem.value = item
  }

  /**
   * Clear selected item (close detail dialog)
   */
  function clearSelectedItem() {
    selectedItem.value = null
  }

  /**
   * Clear search results and errors (keep search term)
   */
  function clearResults() {
    searchResults.value = []
    error.value = null
    hasSearched.value = false
  }

  /**
   * Set current table name and load preferences
   * @param {string} tableName - Name of the current table
   */
  function setCurrentTable(tableName) {
    currentTableName.value = tableName

    if (tableName) {
      loadSortPreferences(tableName)
      loadFilterPreferences(tableName)
    }
  }

  /**
   * Update sort configuration
   * @param {Array} newSortBy - Array of sort descriptors
   */
  function setSortBy(newSortBy) {
    // Limit to MAX_SORT_COLUMNS
    sortBy.value = newSortBy.slice(0, SEARCH_CONFIG.MAX_SORT_COLUMNS)
  }

  /**
   * Clear all sorting
   */
  function clearSort() {
    sortBy.value = []
  }

  /**
   * Clean up sortBy array to remove columns that are not in the provided list
   * Called when columns are hidden or table changes
   * @param {string[]} validColumns - Array of valid column names
   */
  function cleanupSortByColumns(validColumns) {
    if (sortBy.value.length > 0) {
      const cleaned = sortBy.value.filter(sort => validColumns.includes(sort.key))
      if (cleaned.length !== sortBy.value.length) {
        sortBy.value = cleaned
        // eslint-disable-next-line no-console
        console.log('Cleaned up sortBy - removed hidden columns')
      }
    }
  }

  /**
   * Set filter for a specific column
   * @param {string} columnName - Name of the column
   * @param {string} filterValue - Filter value
   */
  function setColumnFilter(columnName, filterValue) {
    if (filterValue && filterValue.trim() !== '') {
      columnFilters.value[columnName] = filterValue
    } else {
      delete columnFilters.value[columnName]
    }
    // Trigger reactivity
    columnFilters.value = { ...columnFilters.value }
  }

  /**
   * Clear filter for a specific column
   * @param {string} columnName - Name of the column
   */
  function clearColumnFilter(columnName) {
    delete columnFilters.value[columnName]
    columnFilters.value = { ...columnFilters.value }
  }

  /**
   * Clear all column filters
   */
  function clearAllFilters() {
    columnFilters.value = {}
  }

  // ===========================================
  // BROWSE MODE ACTIONS
  // ===========================================

  /**
   * Set the view mode (search or browse)
   * Clears opposite mode's data when switching
   * @param {string} mode - VIEW_MODES.SEARCH or VIEW_MODES.BROWSE
   */
  function setViewMode(mode) {
    if (mode === viewMode.value) return

    viewMode.value = mode

    // Clear data from the mode we're leaving
    if (mode === VIEW_MODES.SEARCH) {
      // Entering search mode - clear browse data
      browseData.value = { rows: [], totalCount: 0, page: 1, itemsPerPage: 25 }
      browseError.value = null
    } else {
      // Entering browse mode - don't clear search results (user might want to go back)
      // Just reset the hasSearched flag so the search results aren't shown
    }
  }

  /**
   * Set browse results from IPC response
   * @param {Object} data - { rows, totalCount, page, itemsPerPage }
   */
  function setBrowseResults(data) {
    browseData.value = {
      rows: data.rows || [],
      totalCount: data.totalCount || 0,
      page: data.page || 1,
      itemsPerPage: data.itemsPerPage || 25
    }
    browseLoading.value = false
    browseError.value = null
  }

  /**
   * Set browse loading state
   * @param {boolean} isLoading - Loading state
   */
  function setBrowseLoading(isLoading) {
    browseLoading.value = isLoading
  }

  /**
   * Set browse error
   * @param {string} errorMessage - Error message
   */
  function setBrowseError(errorMessage) {
    browseError.value = errorMessage
    browseLoading.value = false
  }

  /**
   * Update browse pagination settings
   * @param {number} page - Page number (1-indexed)
   * @param {number} itemsPerPage - Items per page
   */
  function setBrowsePagination(page, itemsPerPage) {
    browseData.value.page = page
    browseData.value.itemsPerPage = itemsPerPage
  }

  /**
   * Set browse sort configuration
   * @param {string} column - Column to sort by
   * @param {string} direction - 'asc' or 'desc'
   */
  function setBrowseSort(column, direction) {
    browseSort.value = { column, direction: direction || 'asc' }
  }

  /**
   * Clear browse data
   */
  function clearBrowseData() {
    browseData.value = { rows: [], totalCount: 0, page: 1, itemsPerPage: 25 }
    browseError.value = null
    browseSort.value = { column: null, direction: 'asc' }
  }

  /**
   * Reset all search state to initial values
   * Called when changing database or table
   */
  function reset() {
    // Search state
    searchTerm.value = ''
    searchResults.value = []
    loading.value = false
    error.value = null
    selectedItem.value = null
    sortBy.value = []
    columnFilters.value = {}
    currentTableName.value = ''
    hasSearched.value = false

    // Browse state
    viewMode.value = VIEW_MODES.SEARCH
    browseData.value = { rows: [], totalCount: 0, page: 1, itemsPerPage: 25 }
    browseLoading.value = false
    browseError.value = null
    browseSort.value = { column: null, direction: 'asc' }
  }

  return {
    // Search State
    searchTerm,
    searchResults,
    loading,
    error,
    selectedItem,
    sortBy,
    columnFilters,
    currentTableName,
    hasSearched,

    // View Mode State
    viewMode,

    // Browse State
    browseData,
    browseLoading,
    browseError,
    browseSort,

    // Search Getters
    hasResults,
    resultCount,
    hasError,
    isSearching,
    hasActiveFilters,
    activeFilterCount,
    filteredResults,
    filteredResultCount,

    // View Mode Getters
    isBrowseMode,
    isSearchMode,

    // Browse Getters
    hasBrowseData,
    browseTotalPages,
    browsePaginationInfo,

    // Search Actions
    setSearchTerm,
    setResults,
    setLoading,
    setError,
    clearError,
    setSelectedItem,
    clearSelectedItem,
    clearResults,
    setCurrentTable,
    setSortBy,
    clearSort,
    cleanupSortByColumns,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,

    // View Mode Actions
    setViewMode,

    // Browse Actions
    setBrowseResults,
    setBrowseLoading,
    setBrowseError,
    setBrowsePagination,
    setBrowseSort,
    clearBrowseData,

    // Global Actions
    reset,
  }
})
