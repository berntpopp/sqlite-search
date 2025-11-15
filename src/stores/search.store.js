// src/stores/search.store.js
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
  function setSearchTerm(term) {
    searchTerm.value = term
  }

  function setResults(results) {
    searchResults.value = results
    error.value = null
  }

  function setLoading(isLoading) {
    loading.value = isLoading
  }

  function setError(errorMessage) {
    error.value = errorMessage
    loading.value = false
  }

  function clearError() {
    error.value = null
  }

  function setSelectedItem(item) {
    selectedItem.value = item
  }

  function clearSelectedItem() {
    selectedItem.value = null
  }

  function clearResults() {
    searchResults.value = []
    error.value = null
  }

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
