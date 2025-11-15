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
    :hint="selectedColumns.length === 0 ? 'Select at least one column' : `${selectedColumns.length} column(s) selected`"
    persistent-hint
    @update:model-value="handleColumnSelect"
  >
    <template v-slot:prepend-inner>
      <v-icon size="small">mdi-table-column</v-icon>
    </template>

    <!-- Compact chip display for selected columns -->
    <template v-slot:selection="{ item, index }">
      <v-chip v-if="index < 2" size="small" closable>
        <span>{{ item.title }}</span>
      </v-chip>
      <span
        v-if="index === 2"
        class="text-medium-emphasis text-caption align-self-center ml-1"
      >
        (+{{ selectedColumns.length - 2 }} more)
      </span>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { computed } from 'vue'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'

const databaseStore = useDatabaseStore()
const searchStore = useSearchStore()

// Two-way binding with store
const selectedColumns = computed({
  get: () => databaseStore.selectedColumns,
  set: (value) => {
    databaseStore.selectColumns(value || [])
  },
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
</script>

<style scoped>
/* Compact autocomplete styling */
.v-autocomplete {
  max-width: 100%;
}
</style>
