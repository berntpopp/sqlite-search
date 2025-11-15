/**
 * History Store
 * Manages search history with localStorage persistence
 * Tracks searches for easy reactivation and browsing
 * Uses Pinia Composition API pattern
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useHistoryStore = defineStore('history', () => {
  // Constants
  const MAX_HISTORY_ENTRIES = 100 // Keep last 100 searches

  // State - load from localStorage or initialize as empty
  const entries = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))

  // Getters
  const hasHistory = computed(() => entries.value.length > 0)
  const historyCount = computed(() => entries.value.length)
  const recentSearches = computed(() => entries.value.slice(0, 10))
  const favoriteSearches = computed(() => entries.value.filter(entry => entry.favorite))

  // Actions
  /**
   * Add a new search to history
   * @param {Object} searchData - Search information
   * @param {string} searchData.searchTerm - The search query
   * @param {string} searchData.databasePath - Database file path
   * @param {string} searchData.table - Selected FTS5 table
   * @param {string[]} searchData.columns - Selected columns
   * @param {number} searchData.resultCount - Number of results found
   */
  function addSearch({ searchTerm, databasePath, table, columns, resultCount }) {
    // Skip empty searches
    if (!searchTerm || !searchTerm.trim()) {
      return
    }

    const entry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      searchTerm: searchTerm.trim(),
      databasePath,
      table,
      columns: [...columns], // Clone array
      resultCount,
      favorite: false,
    }

    // Add to beginning of array (most recent first)
    entries.value.unshift(entry)

    // Limit history size (keep favorites even if over limit)
    const favorites = entries.value.filter(e => e.favorite)
    const nonFavorites = entries.value.filter(e => !e.favorite)

    if (nonFavorites.length > MAX_HISTORY_ENTRIES) {
      const trimmedNonFavorites = nonFavorites.slice(0, MAX_HISTORY_ENTRIES)
      entries.value = [...favorites, ...trimmedNonFavorites].sort(
        (a, b) => b.timestamp - a.timestamp
      )
    }

    // Persist to localStorage
    persistToStorage()
  }

  /**
   * Toggle favorite status of a search entry
   * @param {string} id - Entry ID to toggle
   */
  function toggleFavorite(id) {
    const entry = entries.value.find(e => e.id === id)
    if (entry) {
      entry.favorite = !entry.favorite
      persistToStorage()
    }
  }

  /**
   * Remove a specific search entry
   * @param {string} id - Entry ID to remove
   */
  function removeEntry(id) {
    entries.value = entries.value.filter(e => e.id !== id)
    persistToStorage()
  }

  /**
   * Clear all non-favorite history entries
   */
  function clearHistory() {
    entries.value = entries.value.filter(e => e.favorite)
    persistToStorage()
  }

  /**
   * Clear ALL history including favorites
   */
  function clearAll() {
    entries.value = []
    persistToStorage()
  }

  /**
   * Get a specific entry by ID
   * @param {string} id - Entry ID
   * @returns {Object|null} History entry or null if not found
   */
  function getEntry(id) {
    return entries.value.find(e => e.id === id) || null
  }

  /**
   * Persist current state to localStorage
   * @private
   */
  function persistToStorage() {
    localStorage.setItem('searchHistory', JSON.stringify(entries.value))
  }

  /**
   * Reset store to initial state
   */
  function reset() {
    clearAll()
  }

  return {
    // State
    entries,
    // Getters
    hasHistory,
    historyCount,
    recentSearches,
    favoriteSearches,
    // Actions
    addSearch,
    toggleFavorite,
    removeEntry,
    clearHistory,
    clearAll,
    getEntry,
    reset,
  }
})
