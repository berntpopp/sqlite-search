<template>
  <!-- Compact results table with dense rows -->
  <v-card v-if="searchStore.hasResults" elevation="1" class="results-card">
    <!-- Results count header -->
    <v-card-title class="py-2 px-4 d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <v-icon size="small" class="mr-2">mdi-table-search</v-icon>
        <span class="text-subtitle-1">
          Search Results
          <span class="text-caption text-medium-emphasis ml-1">
            ({{ searchStore.resultCount }} found)
          </span>
        </span>
      </div>
      <v-btn
        variant="text"
        size="small"
        @click="searchStore.clearResults"
      >
        <v-icon start size="small">mdi-close</v-icon>
        Clear
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Data table with compact density -->
    <v-data-table
      :headers="tableHeaders"
      :items="searchStore.searchResults"
      density="compact"
      :items-per-page="25"
      :items-per-page-options="[10, 25, 50, 100]"
      class="results-table"
    >
      <!-- Custom cell rendering with truncation -->
      <template v-for="column in databaseStore.selectedColumns" :key="column" v-slot:[`item.${column}`]="{ value }">
        <span class="text-truncate-cell">{{ truncateText(value, 60) }}</span>
      </template>

      <!-- Actions column -->
      <template v-slot:item.actions="{ item }">
        <div class="d-flex ga-1">
          <v-btn
            icon
            variant="text"
            size="x-small"
            @click="viewDetails(item)"
          >
            <v-icon size="small">mdi-eye</v-icon>
            <v-tooltip activator="parent" location="top">
              View full details
            </v-tooltip>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="x-small"
            @click="copyRow(item)"
          >
            <v-icon size="small">mdi-content-copy</v-icon>
            <v-tooltip activator="parent" location="top">
              Copy entire row
            </v-tooltip>
          </v-btn>
        </div>
      </template>

      <!-- Empty state -->
      <template v-slot:no-data>
        <div class="text-center pa-4">
          <v-icon size="large" color="grey">mdi-magnify-close</v-icon>
          <p class="text-medium-emphasis mt-2">No results found</p>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearch } from '@/composables/useSearch'

const searchStore = useSearchStore()
const databaseStore = useDatabaseStore()
const { viewDetails, truncateText, copyToClipboard } = useSearch()

// Generate table headers from selected columns
const tableHeaders = computed(() => {
  const headers = databaseStore.selectedColumns.map((column) => ({
    title: column,
    value: column,
    key: column,
    sortable: true,
  }))

  // Add actions column
  headers.push({
    title: 'Actions',
    value: 'actions',
    key: 'actions',
    sortable: false,
    width: '100px',
    align: 'center',
  })

  return headers
})

/**
 * Copy entire row as JSON
 */
function copyRow(item) {
  const rowData = JSON.stringify(item, null, 2)
  copyToClipboard(rowData)
}
</script>

<style scoped>
/* Compact table styling */
.results-card {
  margin-top: 16px;
}

.results-table {
  font-size: 0.875rem;
}

/* Truncate long cell content */
.text-truncate-cell {
  display: block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dense table rows */
:deep(.v-data-table__td) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  font-size: 0.875rem;
}

:deep(.v-data-table__th) {
  font-size: 0.875rem !important;
  font-weight: 600;
}

/* Compact pagination */
:deep(.v-data-table-footer) {
  padding: 8px 16px;
}
</style>
