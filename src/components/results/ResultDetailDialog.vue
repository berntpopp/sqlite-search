<template>
  <!-- Modern details dialog with compact layout -->
  <v-dialog v-model="uiStore.detailsDialog" max-width="1200" scrollable>
    <v-card v-if="searchStore.selectedItem">
      <!-- Header with close button -->
      <v-card-title class="d-flex justify-space-between align-center py-3 px-4">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-2">mdi-file-document-outline</v-icon>
          <span class="text-h6">Result Details</span>
        </div>
        <v-btn icon variant="text" size="small" @click="uiStore.closeDetailsDialog">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Content with field-value pairs (only selected columns) -->
      <v-card-text class="pa-4">
        <v-list lines="two" class="pa-0">
          <template v-for="column in visibleFields" :key="column.key">
            <v-list-item class="px-0 py-2">
              <!-- Field name -->
              <template #prepend>
                <div class="field-name">
                  <v-icon size="small" class="mr-2">mdi-tag-outline</v-icon>
                  <strong>{{ column.key }}</strong>
                </div>
              </template>

              <!-- Field value -->
              <v-list-item-title class="text-wrap">
                <v-textarea
                  :model-value="String(column.value || '')"
                  variant="outlined"
                  density="compact"
                  auto-grow
                  readonly
                  rows="1"
                  class="mt-2"
                ></v-textarea>
              </v-list-item-title>

              <!-- Copy button -->
              <template #append>
                <v-btn icon variant="text" size="small" @click="copyField(column.key, column.value)">
                  <v-icon size="small">mdi-content-copy</v-icon>
                  <v-tooltip activator="parent" location="top"> Copy {{ column.key }} </v-tooltip>
                </v-btn>
              </template>
            </v-list-item>

            <v-divider class="my-1"></v-divider>
          </template>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Footer actions -->
      <v-card-actions class="px-4 py-3">
        <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="copyAll">
          Copy All as JSON
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="uiStore.closeDetailsDialog"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui.store'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearch } from '@/composables/useSearch'

const uiStore = useUIStore()
const searchStore = useSearchStore()
const databaseStore = useDatabaseStore()
const { copyToClipboard } = useSearch()

/**
 * Get only visible fields (respecting selected columns)
 * Returns array of { key, value } objects
 */
const visibleFields = computed(() => {
  if (!searchStore.selectedItem) return []

  // Filter to only show selected columns in their display order
  return databaseStore.selectedColumns.map(column => ({
    key: column,
    value: searchStore.selectedItem[column]
  }))
})

/**
 * Copy specific field value
 */
function copyField(fieldName, value) {
  copyToClipboard(String(value || ''))
}

/**
 * Copy entire item as formatted JSON (only visible fields)
 */
function copyAll() {
  if (searchStore.selectedItem && visibleFields.value.length > 0) {
    const filteredItem = {}
    visibleFields.value.forEach(field => {
      filteredItem[field.key] = field.value
    })
    const json = JSON.stringify(filteredItem, null, 2)
    copyToClipboard(json)
  }
}
</script>

<style scoped>
/* Compact dialog styling */
.field-name {
  display: flex;
  align-items: center;
  min-width: 150px;
  max-width: 200px;
  margin-right: 16px;
}

/* Ensure text wraps properly */
.text-wrap {
  white-space: normal;
  word-break: break-word;
}

/* Compact textarea */
:deep(.v-textarea) {
  font-size: 0.875rem;
}

:deep(.v-textarea .v-field__input) {
  padding: 8px 12px;
}

/* List item spacing */
:deep(.v-list-item__prepend) {
  align-self: flex-start;
}

:deep(.v-list-item__append) {
  align-self: flex-start;
  margin-top: 8px;
}
</style>
