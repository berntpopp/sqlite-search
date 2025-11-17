/**
 * Search Store
 * Manages FTS5 search state including search term, results, loading states, and errors
 * Enhanced with sorting, filtering, and column management capabilities
 * Uses Pinia Composition API pattern
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { SEARCH_CONFIG } from '@/config/search.config'

export const useSearchStore = defineStore('search', () => {
  // State
  const searchTerm = ref('')
  const searchResults = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedItem = ref(null)

  // Advanced features state
  const sortBy = ref([]) // Array of { key: string, order: 'asc' | 'desc' }
  const columnFilters = ref({}) // { columnName: filterValue }
  const currentTableName = ref('') // Track current table for persistence

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

  /**
   * Reset all search state to initial values
   * Called when changing database or table
   */
  function reset() {
    searchTerm.value = ''
    searchResults.value = []
    loading.value = false
    error.value = null
    selectedItem.value = null
    sortBy.value = []
    columnFilters.value = {}
    currentTableName.value = ''
  }

  return {
    // State
    searchTerm,
    searchResults,
    loading,
    error,
    selectedItem,
    sortBy,
    columnFilters,
    currentTableName,
    // Getters
    hasResults,
    resultCount,
    hasError,
    isSearching,
    hasActiveFilters,
    activeFilterCount,
    filteredResults,
    filteredResultCount,
    // Actions
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
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    reset,
  }
})
