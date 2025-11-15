<template>
  <!-- Compact table selector with modern design -->
  <v-select
    v-if="databaseStore.isConnected"
    v-model="selectedTable"
    :items="databaseStore.tables"
    label="Select Table"
    variant="outlined"
    density="compact"
    :disabled="!databaseStore.tables.length"
    :hint="databaseStore.tables.length === 0 ? 'No FTS5 tables found in database' : ''"
    persistent-hint
    @update:model-value="handleTableSelect"
  >
    <template #prepend-inner>
      <v-icon size="small">mdi-table</v-icon>
    </template>
  </v-select>
</template>

<script setup>
import { computed } from 'vue'
import { useDatabaseStore } from '@/stores/database.store'
import { useDatabase } from '@/composables/useDatabase'
import { useSearchStore } from '@/stores/search.store'

const databaseStore = useDatabaseStore()
const { selectTable } = useDatabase()
const searchStore = useSearchStore()

// Two-way binding with store
const selectedTable = computed({
  get: () => databaseStore.selectedTable,
  set: value => {
    if (value) {
      selectTable(value)
    }
  },
})

/**
 * Handle table selection
 * Clears search results when changing tables
 */
function handleTableSelect(tableName) {
  if (tableName) {
    searchStore.clearResults()
  }
}
</script>

<style scoped>
/* Compact selector styling */
.v-select {
  max-width: 100%;
}
</style>
