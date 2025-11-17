<template>
  <!-- Column Management Dialog for show/hide and reordering columns -->
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between py-3 px-4 bg-primary">
        <div class="d-flex align-center">
          <v-icon start>mdi-table-cog</v-icon>
          <span>Manage Columns</span>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Instructions and quick actions -->
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="text-body-2 text-medium-emphasis">
            Toggle visibility and reorder columns
          </div>
          <div class="d-flex ga-2">
            <v-btn
              size="small"
              variant="outlined"
              prepend-icon="mdi-eye"
              @click="databaseStore.showAllColumns()"
            >
              Show All
            </v-btn>
            <v-btn
              size="small"
              variant="outlined"
              prepend-icon="mdi-restore"
              @click="resetWithConfirm"
            >
              Reset All
            </v-btn>
          </div>
        </div>

        <!-- Column list -->
        <v-card variant="outlined" class="column-list">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="(column, index) in databaseStore.columnOrder"
              :key="column"
              class="column-item"
              :class="{ 'column-hidden': isColumnHidden(column) }"
            >
              <!-- Drag handle visual (decorative only - using buttons for reordering) -->
              <template #prepend>
                <v-icon size="small" class="drag-handle mr-2">mdi-drag-vertical</v-icon>
              </template>

              <!-- Column visibility checkbox and name -->
              <v-list-item-title class="d-flex align-center">
                <v-checkbox
                  :model-value="!isColumnHidden(column)"
                  density="compact"
                  hide-details
                  :disabled="!canHideColumn(column)"
                  class="mr-2"
                  @update:model-value="() => databaseStore.toggleColumnVisibility(column)"
                ></v-checkbox>
                <span :class="{ 'text-medium-emphasis': isColumnHidden(column) }">
                  {{ column }}
                </span>
              </v-list-item-title>

              <!-- Reorder buttons -->
              <template #append>
                <div class="d-flex ga-1">
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    :disabled="index === 0"
                    @click="databaseStore.moveColumnUp(column)"
                  >
                    <v-icon size="small">mdi-chevron-up</v-icon>
                    <v-tooltip activator="parent" location="top">Move up</v-tooltip>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    :disabled="index === databaseStore.columnOrder.length - 1"
                    @click="databaseStore.moveColumnDown(column)"
                  >
                    <v-icon size="small">mdi-chevron-down</v-icon>
                    <v-tooltip activator="parent" location="top">Move down</v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Summary info -->
        <div class="mt-4 d-flex align-center justify-space-between">
          <div class="text-caption text-medium-emphasis">
            {{ databaseStore.visibleColumns.length }} of {{ databaseStore.columnOrder.length }} columns visible
          </div>
          <div v-if="databaseStore.hiddenColumnCount > 0" class="text-caption text-warning">
            <v-icon size="small" class="mr-1">mdi-alert-circle-outline</v-icon>
            {{ databaseStore.hiddenColumnCount }} column(s) hidden
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Footer actions -->
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="elevated"
          @click="$emit('update:modelValue', false)"
        >
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'
import { SEARCH_CONFIG } from '@/config/search.config'

// Props and emits
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['update:modelValue'])

const databaseStore = useDatabaseStore()

/**
 * Reset all preferences with confirmation
 * Clears ALL cache including sort, filters, and column preferences
 */
function resetWithConfirm() {
  if (confirm('Reset ALL settings (columns, sort, filters) for this table? This will clear all cached preferences.')) {
    databaseStore.clearAllTableCache()

    // Also clear sort and filters from search store
    const searchStore = useSearchStore()
    searchStore.clearSort()
    searchStore.clearAllFilters()
  }
}

/**
 * Check if a column is currently hidden
 * @param {string} columnName - Name of the column
 * @returns {boolean} - True if column is hidden
 */
function isColumnHidden(columnName) {
  return databaseStore.hiddenColumns.includes(columnName)
}

/**
 * Check if a column can be hidden (must maintain minimum visible columns)
 * @param {string} columnName - Name of the column
 * @returns {boolean} - True if column can be hidden
 */
function canHideColumn(columnName) {
  // If column is already hidden, it can be shown
  if (isColumnHidden(columnName)) {
    return true
  }

  // Check if hiding this column would violate minimum visible columns
  const wouldBeVisible = databaseStore.visibleColumns.length - 1
  return wouldBeVisible >= SEARCH_CONFIG.COLUMN_MANAGEMENT.MIN_VISIBLE_COLUMNS
}
</script>

<style scoped>
/* Column list styling */
.column-list {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: background-color 0.2s;
}

.column-item:last-child {
  border-bottom: none;
}

.column-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.column-hidden {
  opacity: 0.6;
}

.drag-handle {
  cursor: grab;
  opacity: 0.4;
  transition: opacity 0.2s;
}

.column-item:hover .drag-handle {
  opacity: 0.7;
}

/* Checkbox styling override for compact display */
:deep(.v-checkbox) {
  flex: 0 0 auto;
}

:deep(.v-selection-control__wrapper) {
  height: 24px;
}
</style>
