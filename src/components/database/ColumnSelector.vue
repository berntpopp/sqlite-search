<template>
  <!-- Compact column selector with chip display -->
  <v-autocomplete
    v-if="databaseStore.hasSelectedTable"
    v-model="selectedColumns"
    :items="databaseStore.columns"
    label="Select Columns to Search"
    variant="outlined"
    density="compact"
    multiple
    clearable
    chips
    closable-chips
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
          Select All
        </v-btn>
      </v-list-item>
      <v-divider class="mb-2" />
    </template>

    <!-- Compact chip display for selected columns -->
    <template #selection="{ item, index }">
      <v-chip v-if="index < SEARCH_CONFIG.MAX_CHIP_PREVIEW" size="small" closable>
        <span>{{ item.title }}</span>
      </v-chip>
      <span
        v-if="index === SEARCH_CONFIG.MAX_CHIP_PREVIEW"
        class="text-medium-emphasis text-caption align-self-center ml-1"
      >
        (+{{ selectedColumns.length - SEARCH_CONFIG.MAX_CHIP_PREVIEW }} more)
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
 * Computed hint showing selection status
 * Provides informative feedback about current column selection
 */
const columnHint = computed(() => {
  const selected = selectedColumns.value.length
  const total = databaseStore.columns.length

  if (selected === 0) {
    return 'Select at least one column'
  }
  if (selected === total) {
    return `All ${total} columns selected`
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
 * Quick action: Select first N columns (from config)
 * Follows DRY principle by using centralized configuration
 */
function selectFirstFive() {
  const limit = SEARCH_CONFIG.DEFAULT_COLUMN_COUNT
  const firstFive = databaseStore.columns.slice(0, Math.min(databaseStore.columns.length, limit))
  databaseStore.selectColumns(firstFive)
}

/**
 * Quick action: Select all available columns
 */
function selectAll() {
  databaseStore.selectColumns(databaseStore.columns)
}
</script>

<style scoped>
/* Compact autocomplete styling */
.v-autocomplete {
  max-width: 100%;
}
</style>
