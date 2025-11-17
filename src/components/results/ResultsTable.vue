<template>
  <!-- DEBUG PANEL (TEMPORARY) -->
  <v-card v-if="searchStore.hasResults" class="mb-4" color="warning" variant="tonal">
    <v-card-title class="text-subtitle-2">
      🐛 DEBUG INFO (Remove after fixing)
    </v-card-title>
    <v-card-text class="text-caption">
      <div><strong>selectedColumns:</strong> {{ JSON.stringify(databaseStore.selectedColumns) }}</div>
      <div><strong>columnOrder:</strong> {{ JSON.stringify(databaseStore.columnOrder) }}</div>
      <div><strong>hiddenColumns:</strong> {{ JSON.stringify(databaseStore.hiddenColumns) }}</div>
      <div><strong>visibleColumns:</strong> {{ JSON.stringify(databaseStore.visibleColumns) }}</div>
      <div v-if="searchStore.filteredResults.length > 0">
        <strong>First result keys:</strong> {{ JSON.stringify(Object.keys(searchStore.filteredResults[0])) }}
      </div>
      <div v-if="searchStore.filteredResults.length > 0">
        <strong>First result values:</strong> {{ JSON.stringify(searchStore.filteredResults[0]) }}
      </div>
      <div>
        <strong>Generated headers (value prop):</strong> {{ JSON.stringify(tableHeaders.map(h => h.value)) }}
      </div>
    </v-card-text>
  </v-card>

  <!-- Enhanced results table with sorting, filtering, and column management -->
  <v-card v-if="searchStore.hasResults" elevation="1" class="results-card">
    <!-- Results count header with filter info -->
    <v-card-title class="py-2 px-4 d-flex justify-space-between align-center">
      <div class="d-flex align-center">
        <v-icon size="small" class="mr-2">mdi-table-search</v-icon>
        <span class="text-subtitle-1">
          Search Results
          <span class="text-caption text-medium-emphasis ml-1">
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
      v-model:sort-by="sortBy"
      :headers="tableHeaders"
      :items="searchStore.filteredResults"
      density="compact"
      :items-per-page="25"
      :items-per-page-options="[10, 25, 50, 100]"
      :multi-sort="true"
      class="results-table"
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
      <template
        v-for="column in databaseStore.visibleColumns"
        :key="`item-${column}`"
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

      <!-- Empty state -->
      <template #no-data>
        <div class="text-center pa-4">
          <v-icon size="large" color="grey">mdi-magnify-close</v-icon>
          <p class="text-medium-emphasis mt-2">
            {{ searchStore.hasActiveFilters ? 'No results match your filters' : 'No results found' }}
          </p>
        </div>
      </template>
    </v-data-table>

    <!-- Column Management Dialog -->
    <ColumnManagementDialog v-model="showColumnManagement" />
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearch } from '@/composables/useSearch'
import { SEARCH_CONFIG } from '@/config/search.config'
import ColumnManagementDialog from './ColumnManagementDialog.vue'

const searchStore = useSearchStore()
const databaseStore = useDatabaseStore()
const { viewDetails, truncateText, copyToClipboard } = useSearch()

// Component state
const showColumnManagement = ref(false)

// DEBUG: Watch for changes and log state
import { watch } from 'vue'
watch(
  () => databaseStore.visibleColumns,
  (newVal) => {
    console.log('🔍 DEBUG visibleColumns changed:', newVal)
  },
  { immediate: true }
)

watch(
  () => searchStore.filteredResults,
  (newVal) => {
    if (newVal.length > 0) {
      console.log('🔍 DEBUG first result keys:', Object.keys(newVal[0]))
      console.log('🔍 DEBUG first result data:', newVal[0])
    }
  },
  { immediate: true }
)

// Two-way binding for sortBy with store
const sortBy = computed({
  get() {
    return searchStore.sortBy
  },
  set(value) {
    searchStore.setSortBy(value)
  },
})

/**
 * Generate table headers from visible columns (respecting order and visibility)
 * Headers include sorting configuration and keys for filtering
 */
const tableHeaders = computed(() => {
  console.log('🔍 DEBUG tableHeaders computing...')
  console.log('🔍 DEBUG databaseStore.selectedColumns:', databaseStore.selectedColumns)
  console.log('🔍 DEBUG databaseStore.columnOrder:', databaseStore.columnOrder)
  console.log('🔍 DEBUG databaseStore.hiddenColumns:', databaseStore.hiddenColumns)
  console.log('🔍 DEBUG databaseStore.visibleColumns:', databaseStore.visibleColumns)

  const headers = databaseStore.visibleColumns.map(column => ({
    title: column,
    value: column,
    key: column,
    sortable: true,
    align: 'start',
  }))

  console.log('🔍 DEBUG generated headers:', headers.map(h => h.value))

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
</style>
