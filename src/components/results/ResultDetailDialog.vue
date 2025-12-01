<template>
  <!-- Compact details dialog with dense table layout -->
  <v-dialog v-model="uiStore.detailsDialog" max-width="900" scrollable>
    <v-card v-if="searchStore.selectedItem">
      <!-- Header with close button -->
      <v-card-title class="d-flex justify-space-between align-center py-3 px-4">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-2">mdi-file-document-outline</v-icon>
          <span class="text-h6">Result Details</span>
          <span class="text-caption text-medium-emphasis ml-2">({{ visibleFields.length }} fields)</span>
        </div>
        <v-btn icon variant="text" size="small" @click="uiStore.closeDetailsDialog">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Dense table layout for field-value pairs -->
      <v-card-text class="pa-0">
        <v-table density="compact" class="detail-table">
          <tbody>
            <tr v-for="column in visibleFields" :key="column.key" class="detail-row">
              <!-- Field name -->
              <td class="field-cell">
                <strong class="text-body-2">{{ column.key }}</strong>
              </td>
              <!-- Field value -->
              <td class="value-cell">
                <div class="value-content">
                  <span
                    v-if="!isLongValue(column.value)"
                    class="text-body-2"
                  >
                    {{ formatValue(column.value) }}
                  </span>
                  <v-textarea
                    v-else
                    :model-value="String(column.value || '')"
                    variant="plain"
                    density="compact"
                    auto-grow
                    readonly
                    rows="1"
                    max-rows="3"
                    hide-details
                    class="dense-textarea"
                  ></v-textarea>
                </div>
              </td>
              <!-- Copy button -->
              <td class="action-cell">
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  density="compact"
                  @click="copyField(column.key, column.value)"
                >
                  <v-icon size="small">mdi-content-copy</v-icon>
                  <v-tooltip activator="parent" location="top">Copy</v-tooltip>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Footer actions -->
      <v-card-actions class="px-4 py-2">
        <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="copyAll">
          Copy All as JSON
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="uiStore.closeDetailsDialog">Close</v-btn>
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

// Threshold for showing textarea vs plain text
const LONG_VALUE_THRESHOLD = 80

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
 * Check if value is long enough to need textarea
 */
function isLongValue(value) {
  const str = String(value || '')
  return str.length > LONG_VALUE_THRESHOLD || str.includes('\n')
}

/**
 * Format value for display (handle null/undefined)
 */
function formatValue(value) {
  if (value === null || value === undefined) return '—'
  if (value === '') return '(empty)'
  return String(value)
}

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
/* Dense table styling */
.detail-table {
  font-size: 0.875rem;
}

.detail-row {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.detail-row:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.field-cell {
  width: 140px;
  min-width: 140px;
  max-width: 180px;
  padding: 6px 12px !important;
  vertical-align: top;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.value-cell {
  padding: 6px 12px !important;
  vertical-align: top;
  word-break: break-word;
}

.value-content {
  max-width: 100%;
  overflow: hidden;
}

.action-cell {
  width: 40px;
  padding: 4px 8px !important;
  vertical-align: top;
  text-align: center;
}

/* Dense textarea for long values */
.dense-textarea {
  font-size: 0.875rem;
}

:deep(.dense-textarea .v-field__input) {
  padding: 0 !important;
  min-height: unset !important;
}

:deep(.dense-textarea .v-field) {
  padding: 0 !important;
}

:deep(.dense-textarea textarea) {
  line-height: 1.4;
}
</style>
