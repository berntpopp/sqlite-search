<template>
  <!-- Column Management Dialog for show/hide and reordering columns -->
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <!-- Header - unified style with other dialogs -->
      <v-card-title class="d-flex align-center justify-space-between py-3 px-4">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-2">mdi-table-cog</v-icon>
          <span class="text-h6">Manage Columns</span>
        </div>
        <v-btn icon variant="text" size="small" @click="$emit('update:modelValue', false)">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Instructions and quick actions -->
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="text-body-2 text-medium-emphasis">Toggle visibility and reorder columns</div>
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
          <v-list ref="columnListEl" density="compact" class="pa-0">
            <v-list-item
              v-for="column in effectiveColumnOrder"
              :key="column"
              class="column-item"
              :class="{ 'column-hidden': isColumnHidden(column) }"
              :data-column="column"
            >
              <!-- Drag handle -->
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
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Summary info -->
        <div class="mt-4 d-flex align-center justify-space-between">
          <div class="text-caption text-medium-emphasis">
            {{ databaseStore.visibleColumns.length }} of {{ effectiveColumnOrder.length }} columns
            visible
          </div>
          <div v-if="databaseStore.hiddenColumnCount > 0" class="text-caption text-warning">
            <v-icon size="small" class="mr-1">mdi-alert-circle-outline</v-icon>
            {{ databaseStore.hiddenColumnCount }} column(s) hidden
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Footer actions - unified style with other dialogs -->
      <v-card-actions class="px-4 py-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, onBeforeUnmount, watch, nextTick } from 'vue'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'
import { SEARCH_CONFIG } from '@/config/search.config'
import Sortable from 'sortablejs'

// Props and emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['update:modelValue'])

const databaseStore = useDatabaseStore()

// Template ref for the sortable list
const columnListEl = ref(null)
let sortableInstance = null

/**
 * Effective column order - uses columnOrder if available, otherwise selectedColumns
 */
const effectiveColumnOrder = computed(() => {
  return databaseStore.columnOrder.length > 0
    ? databaseStore.columnOrder
    : databaseStore.selectedColumns
})

/**
 * Initialize SortableJS on the v-list element
 */
function initSortable() {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }

  const el = columnListEl.value?.$el || columnListEl.value
  if (!el) return

  sortableInstance = Sortable.create(el, {
    handle: '.drag-handle',
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd(evt) {
      const newOrder = [...effectiveColumnOrder.value]
      const [moved] = newOrder.splice(evt.oldIndex, 1)
      newOrder.splice(evt.newIndex, 0, moved)
      databaseStore.setColumnOrder(newOrder)
    },
  })
}

function destroySortable() {
  if (sortableInstance) {
    sortableInstance.destroy()
    sortableInstance = null
  }
}

// Initialize sortable when dialog opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      initSortable()
    } else {
      destroySortable()
    }
  },
)

onBeforeUnmount(() => {
  destroySortable()
})

/**
 * Reset all preferences with confirmation
 */
function resetWithConfirm() {
  if (
    confirm(
      'Reset ALL settings (columns, sort, filters) for this table? This will clear all cached preferences.'
    )
  ) {
    databaseStore.clearAllTableCache()
    const searchStore = useSearchStore()
    searchStore.clearSort()
    searchStore.clearAllFilters()
  }
}

function isColumnHidden(columnName) {
  return databaseStore.hiddenColumns.includes(columnName)
}

function canHideColumn(columnName) {
  if (isColumnHidden(columnName)) return true
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

.drag-handle:active {
  cursor: grabbing;
}

.column-item:hover .drag-handle {
  opacity: 0.7;
}

/* SortableJS drag states */
.sortable-ghost {
  opacity: 0.3;
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.sortable-chosen {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.sortable-drag {
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

/* Checkbox styling override for compact display */
:deep(.v-checkbox) {
  flex: 0 0 auto;
}

:deep(.v-selection-control__wrapper) {
  height: 24px;
}
</style>
