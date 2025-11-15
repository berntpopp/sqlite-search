<template>
  <!-- Compact modern search input with action button -->
  <v-text-field
    v-if="databaseStore.hasSelectedTable"
    v-model="searchTerm"
    label="Search..."
    variant="outlined"
    density="compact"
    :loading="searchStore.loading"
    :disabled="!databaseStore.selectedColumns.length || searchStore.loading"
    :hint="getHint"
    persistent-hint
    clearable
    @keyup.enter="handleSearch"
    @click:clear="handleClear"
  >
    <template v-slot:prepend-inner>
      <v-icon size="small">mdi-magnify</v-icon>
    </template>

    <template v-slot:append-inner>
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="!canSearch"
        :loading="searchStore.loading"
        @click="handleSearch"
      >
        <v-icon size="small">mdi-arrow-right-circle</v-icon>
        <v-tooltip activator="parent" location="top">
          Execute search (Enter)
        </v-tooltip>
      </v-btn>
    </template>
  </v-text-field>
</template>

<script setup>
import { computed } from 'vue'
import { useSearch } from '@/composables/useSearch'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'

const { performSearch, clearSearch } = useSearch()
const searchStore = useSearchStore()
const databaseStore = useDatabaseStore()

// Two-way binding with store
const searchTerm = computed({
  get: () => searchStore.searchTerm,
  set: (value) => searchStore.setSearchTerm(value || ''),
})

// Computed properties
const canSearch = computed(() => {
  return (
    searchStore.searchTerm.trim().length > 0 &&
    databaseStore.selectedColumns.length > 0 &&
    !searchStore.loading
  )
})

const getHint = computed(() => {
  if (!databaseStore.selectedColumns.length) {
    return 'Select columns to search'
  }
  if (searchStore.hasResults) {
    return `${searchStore.resultCount} result(s) found`
  }
  return 'Enter search term (supports FTS5 syntax: AND, OR, NOT, *, NEAR)'
})

/**
 * Handle search execution
 */
function handleSearch() {
  if (canSearch.value) {
    performSearch()
  }
}

/**
 * Handle clear action
 */
function handleClear() {
  clearSearch()
}
</script>

<style scoped>
/* Compact search input styling */
.v-text-field {
  max-width: 100%;
}
</style>
