<template>
  <!-- Compact column selector with chip display -->
  <v-autocomplete
    v-if="databaseStore.hasSelectedTable"
    v-model="selectedColumns"
    :items="columnItems"
    item-title="display"
    item-value="name"
    data-testid="column-selector"
    label="Select Columns to Search"
    variant="outlined"
    density="compact"
    multiple
    clearable
    :hint="columnHint"
    persistent-hint
    @update:model-value="handleColumnSelect"
  >
    <template #prepend-inner>
      <v-icon size="small">mdi-table-column</v-icon>
    </template>

    <!-- Quick action buttons for column selection -->
    <template #prepend-item>
      <v-list-item class="px-2">
        <v-btn
          size="small"
          variant="text"
          color="primary"
          @click="selectTextOnly"
        >
          TEXT Only
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          color="primary"
          class="ml-2"
          @click="selectFirstFive"
        >
          First 5
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          color="primary"
          class="ml-2"
          @click="selectAll"
        >
          All
        </v-btn>
      </v-list-item>
      <v-divider class="mb-2" />
    </template>

    <!-- Custom item display with type badge -->
    <template #item="{ props, item }">
      <v-list-item v-bind="props">
        <template #append>
          <v-chip
            size="x-small"
            :color="getTypeColor(item.raw.type)"
            variant="flat"
          >
            {{ item.raw.type || 'TEXT' }}
          </v-chip>
        </template>
      </v-list-item>
    </template>

    <!-- Compact selection display - counter only for clean UI -->
    <template #selection="{ index }">
      <!-- Only render once (index 0) to avoid duplicate content -->
      <span v-if="index === 0" class="text-body-2">
        <strong>{{ selectedColumns.length }}</strong>
        <span class="text-medium-emphasis">
          of {{ databaseStore.columns.length }} columns
        </span>
      </span>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { computed } from 'vue'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'
import { SEARCH_CONFIG } from '@/config/search.config'

const databaseStore = useDatabaseStore()
const searchStore = useSearchStore()

// Two-way binding with store
const selectedColumns = computed({
  get: () => databaseStore.selectedColumns,
  set: value => {
    databaseStore.selectColumns(value || [])
  },
})

/**
 * Transform column data for v-autocomplete
 * Creates items with display name and type badge
 */
const columnItems = computed(() => {
  return databaseStore.columns.map(col => ({
    name: col.name,
    type: col.type,
    display: col.name,
  }))
})

/**
 * Get color for column type badge
 * @param {string} type - Column type (TEXT, INTEGER, REAL, BLOB)
 * @returns {string} - Vuetify color
 */
function getTypeColor(type) {
  const upperType = (type || '').toUpperCase()
  if (!upperType || upperType === 'TEXT' || upperType.startsWith('VARCHAR') || upperType.startsWith('CHAR')) {
    return 'success'
  }
  if (upperType === 'INTEGER' || upperType === 'INT') {
    return 'info'
  }
  if (upperType === 'REAL' || upperType === 'FLOAT' || upperType === 'DOUBLE') {
    return 'warning'
  }
  if (upperType === 'BLOB') {
    return 'error'
  }
  return 'grey'
}

/**
 * Computed hint showing selection status
 * Provides informative feedback about current column selection
 */
const columnHint = computed(() => {
  const selected = selectedColumns.value.length
  const total = databaseStore.columns.length
  const textCount = databaseStore.textColumns.length

  if (selected === 0) {
    return 'Select at least one column'
  }
  if (selected === total) {
    return `All ${total} columns selected`
  }
  if (selected === textCount && textCount < total) {
    return `${selected} TEXT column(s) selected (${total - textCount} non-text available)`
  }
  return `${selected} of ${total} column(s) selected`
})

/**
 * Handle column selection change
 * Clears search results when changing columns
 */
function handleColumnSelect(columns) {
  if (columns && columns.length > 0) {
    searchStore.clearResults()
  }
}

/**
 * Quick action: Select only TEXT columns
 */
function selectTextOnly() {
  databaseStore.selectColumns(null, true)
  searchStore.clearResults()
}

/**
 * Quick action: Select first N columns (from config)
 * Follows DRY principle by using centralized configuration
 */
function selectFirstFive() {
  const limit = SEARCH_CONFIG.DEFAULT_COLUMN_COUNT
  const firstFive = databaseStore.columnNames.slice(0, Math.min(databaseStore.columnNames.length, limit))
  databaseStore.selectColumns(firstFive)
  searchStore.clearResults()
}

/**
 * Quick action: Select all available columns
 */
function selectAll() {
  databaseStore.selectColumns(databaseStore.columnNames)
  searchStore.clearResults()
}
</script>

<style scoped>
/* Compact autocomplete styling */
.v-autocomplete {
  max-width: 100%;
}
</style>
