<template>
  <!-- Enhanced results table with sorting, filtering, and column management -->
  <v-card v-if="searchStore.hasSearched" elevation="1" class="results-card" data-testid="results-card">
    <!-- Results count header with filter info -->
    <v-card-title class="py-2 px-4 d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <v-icon size="small" class="mr-2">mdi-table-search</v-icon>
        <span class="text-subtitle-1">
          Search Results
          <span class="text-caption text-medium-emphasis ml-1" data-testid="results-count">
            <template v-if="searchStore.hasActiveFilters">
              ({{ searchStore.filteredResultCount }} of {{ searchStore.resultCount }} shown)
            </template>
            <template v-else>
              ({{ searchStore.resultCount }} found)
            </template>
          </span>
        </span>
      </div>
      <div class="d-flex ga-2">
        <!-- Clear filters button (if filters active) -->
        <v-btn
          v-if="searchStore.hasActiveFilters"
          variant="text"
          size="small"
          color="warning"
          @click="clearAllFilters"
        >
          <v-icon start size="small">mdi-filter-off</v-icon>
          Clear Filters ({{ searchStore.activeFilterCount }})
        </v-btn>

        <!-- Clear sort button (if sorting active) -->
        <v-btn
          v-if="searchStore.sortBy.length > 0"
          variant="text"
          size="small"
          color="info"
          @click="clearSort"
        >
          <v-icon start size="small">mdi-sort-variant-remove</v-icon>
          Clear Sort
        </v-btn>

        <!-- Column management button -->
        <v-btn
          v-if="SEARCH_CONFIG.COLUMN_MANAGEMENT.SHOW_MANAGEMENT_BUTTON"
          variant="text"
          size="small"
          @click="showColumnManagement = true"
        >
          <v-icon start size="small">mdi-table-cog</v-icon>
          Columns
          <v-badge
            v-if="databaseStore.hiddenColumnCount > 0"
            :content="databaseStore.hiddenColumnCount"
            color="primary"
            inline
          />
        </v-btn>

        <!-- Clear results button -->
        <v-btn variant="text" size="small" @click="searchStore.clearResults">
          <v-icon start size="small">mdi-close</v-icon>
          Clear
        </v-btn>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Enhanced data table with sorting, filtering, and custom column headers -->
    <v-data-table
      v-model:sort-by="searchStore.sortBy"
      :headers="tableHeaders"
      :items="searchStore.filteredResults"
      :loading="searchStore.loading"
      density="compact"
      :items-per-page="25"
      :items-per-page-options="[10, 25, 50, 100]"
      :multi-sort="true"
      hover
      class="results-table"
      data-testid="results-table"
    >
      <!-- Custom header slots with sort indicators and filtering -->
      <template
        v-for="column in databaseStore.visibleColumns"
        :key="`header-${column}`"
        #[`header.${column}`]="{ column: headerColumn, getSortIcon, toggleSort, isSorted }"
      >
        <div class="d-flex align-center justify-space-between header-wrapper">
          <!-- Clickable header text with sort icon -->
          <div class="d-flex align-center flex-grow-1 sortable-header" @click="toggleSort(headerColumn)">
            <span class="header-title">{{ headerColumn.title }}</span>
            <v-icon v-if="isSorted(headerColumn)" size="small" class="ml-1">
              {{ getSortIcon(headerColumn) }}
            </v-icon>
            <v-icon v-else size="small" class="ml-1 sort-icon-inactive">
              mdi-sort
            </v-icon>
          </div>
          <!-- Filter menu -->
          <v-menu :close-on-content-click="false" location="bottom">
            <template #activator="{ props }">
              <v-btn
                icon
                size="x-small"
                variant="text"
                v-bind="props"
                :color="hasFilter(column) ? 'primary' : 'default'"
              >
                <v-icon size="small">
                  {{ hasFilter(column) ? 'mdi-filter' : 'mdi-filter-outline' }}
                </v-icon>
              </v-btn>
            </template>
            <v-card min-width="250" max-width="400">
              <v-card-title class="text-subtitle-2 py-2">
                Filter: {{ headerColumn.title }}
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text class="pa-3">
                <v-text-field
                  :model-value="searchStore.columnFilters[column] || ''"
                  label="Filter value"
                  placeholder="Type to filter..."
                  density="compact"
                  variant="outlined"
                  clearable
                  hide-details
                  autofocus
                  @update:model-value="value => setColumnFilter(column, value)"
                >
                  <template #prepend-inner>
                    <v-icon size="small">mdi-magnify</v-icon>
                  </template>
                </v-text-field>
                <div class="text-caption text-medium-emphasis mt-2">
                  Case-insensitive partial match
                </div>
              </v-card-text>
              <v-divider></v-divider>
              <v-card-actions class="pa-2">
                <v-spacer></v-spacer>
                <v-btn
                  size="small"
                  variant="text"
                  @click="searchStore.clearColumnFilter(column)"
                >
                  Clear
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </div>
      </template>

      <!-- Custom cell rendering with truncation -->
      <!-- IMPORTANT: Use selectedColumns (not visibleColumns) to match ALL data columns -->
      <template
        v-for="column in databaseStore.selectedColumns"
        :key="column"
        #[`item.${column}`]="{ value }"
      >
        <span class="text-truncate-cell" :title="value">
          {{ truncateText(value, 60) }}
        </span>
      </template>

      <!-- Actions column -->
      <template #[`item.actions`]="{ item }">
        <div class="d-flex ga-1">
          <v-btn icon variant="text" size="x-small" @click="viewDetails(item)">
            <v-icon size="small">mdi-eye</v-icon>
            <v-tooltip activator="parent" location="top"> View full details </v-tooltip>
          </v-btn>
          <v-btn icon variant="text" size="x-small" @click="copyRow(item)">
            <v-icon size="small">mdi-content-copy</v-icon>
            <v-tooltip activator="parent" location="top"> Copy entire row </v-tooltip>
          </v-btn>
        </div>
      </template>

      <!-- Empty slot - hidden when using external empty state -->
      <template #no-data>
        <span></span>
      </template>
    </v-data-table>

    <!-- Empty state - OUTSIDE table to avoid horizontal scroll issues -->
    <div v-if="!searchStore.hasResults && !searchStore.loading" class="empty-state-container">
      <EmptyState
        v-if="searchStore.hasActiveFilters"
        variant="no-results"
        icon="mdi-filter-off-outline"
        title="No results match your filters"
        subtitle="Try adjusting or clearing your column filters"
        :compact="true"
        primary-action="Clear Filters"
        primary-action-icon="mdi-filter-remove"
        @primary-action="clearAllFilters"
      />
      <EmptyState
        v-else
        variant="no-results"
        icon="mdi-magnify-close"
        :title="`No results for &quot;${searchStore.searchTerm}&quot;`"
        :suggestions="noResultsSuggestions"
        suggestions-title="Try these:"
        :compact="true"
        primary-action="Clear Search"
        primary-action-icon="mdi-close"
        @primary-action="clearSearch"
      />
    </div>

    <!-- Column Management Dialog -->
    <ColumnManagementDialog v-model="showColumnManagement" />
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearch } from '@/composables/useSearch'
import { SEARCH_CONFIG } from '@/config/search.config'
import ColumnManagementDialog from './ColumnManagementDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const searchStore = useSearchStore()
const databaseStore = useDatabaseStore()
const { viewDetails, truncateText, copyToClipboard } = useSearch()

// Component state
const showColumnManagement = ref(false)

// No results suggestions
const noResultsSuggestions = [
  'Check spelling of your search terms',
  'Try using wildcards (e.g., gene* instead of gene)',
  'Use broader search terms',
  'Search fewer columns'
]

/**
 * Clear search and reset state
 */
function clearSearch() {
  searchStore.setSearchTerm('')
  searchStore.clearResults()
}

// Watch visible columns and cleanup sortBy when columns are hidden
watch(
  () => databaseStore.visibleColumns,
  (newVisibleColumns) => {
    // Clean up sort descriptors to only include visible columns
    searchStore.cleanupSortByColumns(newVisibleColumns)
  },
  { immediate: true }
)

/**
 * Generate table headers from visible columns (respecting order and visibility)
 * Headers include sorting configuration and keys for filtering
 */
const tableHeaders = computed(() => {
  const headers = databaseStore.visibleColumns.map(column => ({
    title: column,
    value: column,
    key: column,
    sortable: true,
    align: 'start',
  }))

  // Add actions column at the beginning
  headers.unshift({
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
 * Check if a column has an active filter
 * @param {string} columnName - Name of the column
 * @returns {boolean} - True if column has a filter
 */
function hasFilter(columnName) {
  const filterValue = searchStore.columnFilters[columnName]
  return !!(filterValue && filterValue.trim() !== '')
}

/**
 * Set filter for a specific column
 * @param {string} columnName - Name of the column
 * @param {string} filterValue - Filter value
 */
function setColumnFilter(columnName, filterValue) {
  searchStore.setColumnFilter(columnName, filterValue)
}

/**
 * Clear all active filters
 */
function clearAllFilters() {
  searchStore.clearAllFilters()
}

/**
 * Clear all sorting
 */
function clearSort() {
  searchStore.clearSort()
}

/**
 * Copy entire row as JSON
 * @param {Object} item - Row data object
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

/* Header styling with filter button */
.header-wrapper {
  width: 100%;
  gap: 4px;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
  min-width: 0;
}

.sortable-header:hover {
  opacity: 0.7;
}

.header-title {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sort-icon-inactive {
  opacity: 0.3;
  transition: opacity 0.2s;
}

.sortable-header:hover .sort-icon-inactive {
  opacity: 0.6;
}

/* Truncate long cell content */
.text-truncate-cell {
  display: block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
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

/* Filter menu card styling */
:deep(.v-menu > .v-overlay__content) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Zebra striping for better row tracking */
:deep(.v-data-table__tr:nth-child(even)) {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

/* Enhanced hover state */
:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

/* Loading overlay */
:deep(.v-data-table__progress) {
  background-color: rgba(var(--v-theme-surface), 0.8);
}

/* Empty state container - outside table to avoid scroll issues */
.empty-state-container {
  padding: 32px 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
