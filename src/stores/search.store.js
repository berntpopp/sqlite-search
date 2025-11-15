/**
 * Search Store
 * Manages FTS5 search state including search term, results, loading states, and errors
 * Uses Pinia Composition API pattern
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSearchStore = defineStore('search', () => {
  // State
  const searchTerm = ref('')
  const searchResults = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedItem = ref(null)

  // Getters
  const hasResults = computed(() => searchResults.value.length > 0)
  const resultCount = computed(() => searchResults.value.length)
  const hasError = computed(() => !!error.value)
  const isSearching = computed(() => loading.value)

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
   * Reset all search state to initial values
   * Called when changing database or table
   */
  function reset() {
    searchTerm.value = ''
    searchResults.value = []
    loading.value = false
    error.value = null
    selectedItem.value = null
  }

  return {
    // State
    searchTerm,
    searchResults,
    loading,
    error,
    selectedItem,
    // Getters
    hasResults,
    resultCount,
    hasError,
    isSearching,
    // Actions
    setSearchTerm,
    setResults,
    setLoading,
    setError,
    clearError,
    setSelectedItem,
    clearSelectedItem,
    clearResults,
    reset,
  }
})
