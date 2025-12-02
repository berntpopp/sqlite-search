<template>
  <!-- Search input container with mode toggle -->
  <div v-if="databaseStore.hasSelectedTable" class="search-input-container">
    <!-- Mode toggle -->
    <v-btn-toggle
      v-model="currentViewMode"
      mandatory
      density="compact"
      color="primary"
      class="mode-toggle mb-3"
      rounded="lg"
    >
      <v-btn
        :value="VIEW_MODES.SEARCH"
        size="small"
        data-testid="mode-search"
      >
        <v-icon start size="small">mdi-magnify</v-icon>
        Search
      </v-btn>
      <v-btn
        :value="VIEW_MODES.BROWSE"
        size="small"
        data-testid="mode-browse"
      >
        <v-icon start size="small">mdi-table-eye</v-icon>
        Browse
      </v-btn>
    </v-btn-toggle>

    <!-- Search mode: Input field -->
    <v-text-field
      v-if="searchStore.isSearchMode"
      v-model="searchTerm"
      data-testid="search-input"
      label="Search..."
      variant="outlined"
      density="compact"
      :loading="searchStore.loading"
      :disabled="!databaseStore.selectedColumns.length || searchStore.loading"
      :hint="searchHint"
      persistent-hint
      clearable
      @keyup.enter="handleSearch"
      @click:clear="handleClear"
    >
      <template #prepend-inner>
        <v-icon size="small">mdi-magnify</v-icon>
      </template>

      <template #append-inner>
        <v-btn
          icon
          variant="text"
          size="small"
          data-testid="search-button"
          :disabled="!canSearch"
          :loading="searchStore.loading"
          @click="handleSearch"
        >
          <v-icon size="small">mdi-arrow-right-circle</v-icon>
          <v-tooltip activator="parent" location="top"> Execute search (Enter) </v-tooltip>
        </v-btn>
      </template>
    </v-text-field>

    <!-- Browse mode: Info display -->
    <div v-else class="browse-info d-flex align-center justify-center">
      <v-chip
        color="primary"
        variant="tonal"
        size="default"
        class="px-4"
      >
        <v-icon start size="small">mdi-table</v-icon>
        <span v-if="searchStore.browseLoading">
          Loading table data...
        </span>
        <span v-else-if="searchStore.hasBrowseData">
          {{ formatNumber(searchStore.browseData.totalCount) }} rows in
          <strong class="ml-1">{{ databaseStore.selectedTable }}</strong>
        </span>
        <span v-else>
          Click Browse to view all rows
        </span>
      </v-chip>

      <v-btn
        v-if="searchStore.hasBrowseData"
        icon
        variant="text"
        size="small"
        class="ml-2"
        :loading="searchStore.browseLoading"
        @click="handleRefresh"
      >
        <v-icon size="small">mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="top">Refresh data</v-tooltip>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useSearch } from '@/composables/useSearch'
import { useBrowse } from '@/composables/useBrowse'
import { useSearchStore, VIEW_MODES } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'

const { performSearch, clearSearch } = useSearch()
const { enterBrowseMode, enterSearchMode, refresh } = useBrowse()
const searchStore = useSearchStore()
const databaseStore = useDatabaseStore()

// Two-way binding for view mode with auto-fetch on browse
const currentViewMode = computed({
  get: () => searchStore.viewMode,
  set: (value) => {
    if (value === VIEW_MODES.BROWSE) {
      enterBrowseMode()
    } else {
      enterSearchMode()
    }
  }
})

// Two-way binding with store for search term
const searchTerm = computed({
  get: () => searchStore.searchTerm,
  set: value => searchStore.setSearchTerm(value || ''),
})

// Computed properties
const canSearch = computed(() => {
  return (
    searchStore.searchTerm.trim().length > 0 &&
    databaseStore.selectedColumns.length > 0 &&
    !searchStore.loading
  )
})

const searchHint = computed(() => {
  if (!databaseStore.selectedColumns.length) {
    return 'Select columns to search'
  }
  if (searchStore.hasResults) {
    return `${searchStore.resultCount} result(s) found`
  }
  return 'Enter search term (supports FTS5 syntax: AND, OR, NOT, *, NEAR)'
})

/**
 * Format large numbers with locale separators
 */
function formatNumber(num) {
  return num.toLocaleString()
}

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

/**
 * Handle refresh in browse mode
 */
function handleRefresh() {
  refresh()
}

// Watch for table/column changes and refresh browse data if in browse mode
watch(
  () => [databaseStore.selectedTable, databaseStore.selectedColumns.length],
  () => {
    if (searchStore.isBrowseMode && databaseStore.selectedTable && databaseStore.selectedColumns.length > 0) {
      refresh()
    }
  }
)
</script>

<style scoped>
.search-input-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.mode-toggle {
  align-self: center;
}

/* Ensure text field takes full width */
.v-text-field {
  width: 100%;
}

/* Browse info styling */
.browse-info {
  min-height: 40px;
  padding: 8px 0;
}
</style>
