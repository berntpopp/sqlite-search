<template>
  <!-- Compact details dialog with dense table layout -->
  <v-dialog v-model="uiStore.detailsDialog" max-width="1100" scrollable>
    <v-card v-if="searchStore.selectedItem">
      <!-- Header with navigation and close button -->
      <v-card-title class="d-flex justify-space-between align-center py-3 px-4">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-2">mdi-file-document-outline</v-icon>
          <span class="text-h6">Result Details</span>
          <span class="text-caption text-medium-emphasis ml-2">
            ({{ displayFields.length }} fields<span v-if="emptyFieldCount > 0"
              >, {{ emptyFieldCount }} empty hidden</span
            >)
          </span>
          <v-btn
            v-if="emptyFieldCount > 0"
            variant="text"
            size="x-small"
            class="ml-1"
            @click="hideEmpty = !hideEmpty"
          >
            {{ hideEmpty ? 'Show empty' : 'Hide empty' }}
          </v-btn>
          <v-btn
            v-if="hasLongFields"
            variant="text"
            size="x-small"
            class="ml-1"
            @click="toggleAllExpanded"
          >
            {{ allExpanded ? 'Collapse All' : 'Expand All' }}
          </v-btn>
        </div>
        <div class="d-flex align-center ga-1">
          <!-- Navigation controls -->
          <v-btn
            icon
            variant="text"
            size="small"
            :disabled="!searchStore.canNavigatePrevious"
            @click="navigatePrevious"
          >
            <v-icon size="small">mdi-chevron-left</v-icon>
            <v-tooltip activator="parent" location="top">Previous result</v-tooltip>
          </v-btn>
          <span
            v-if="searchStore.navigationPosition"
            class="text-caption text-medium-emphasis mx-1"
          >
            {{ searchStore.navigationPosition }}
          </span>
          <v-btn
            icon
            variant="text"
            size="small"
            :disabled="!searchStore.canNavigateNext"
            @click="navigateNext"
          >
            <v-icon size="small">mdi-chevron-right</v-icon>
            <v-tooltip activator="parent" location="top">Next result</v-tooltip>
          </v-btn>
          <!-- Close button -->
          <v-btn icon variant="text" size="small" @click="uiStore.closeDetailsDialog">
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Dense table layout for field-value pairs -->
      <v-card-text class="pa-0">
        <v-table density="compact" class="detail-table">
          <tbody>
            <tr v-for="column in displayFields" :key="column.key" class="detail-row">
              <!-- Field name -->
              <td class="field-cell">
                <strong class="text-body-2">{{ column.key }}</strong>
              </td>
              <!-- Field value -->
              <td class="value-cell">
                <div class="value-content">
                  <ExpandableText
                    v-if="isLongValue(column.value)"
                    :key="`${column.key}-${allExpanded}`"
                    :html="highlightedValue(column.value)"
                    :raw-length="String(column.value || '').length"
                  />
                  <!-- eslint-disable vue/no-v-html -->
                  <div
                    v-else
                    class="text-body-2 value-text"
                    v-html="highlightedValue(column.value)"
                  ></div>
                  <!-- eslint-enable vue/no-v-html -->
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
        <v-btn variant="text" size="small" prepend-icon="mdi-code-json" @click="copyAllJson">
          Copy as JSON
        </v-btn>
        <v-btn variant="text" size="small" prepend-icon="mdi-text-long" @click="copyAllText">
          Copy as Text
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="uiStore.closeDetailsDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui.store'
import { useSearchStore } from '@/stores/search.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearch } from '@/composables/useSearch'
import { highlightSearchTerms } from '@/utils/highlight.utils'
import { extractSearchWords, stripMarkupTags } from '@/utils/text.utils'
import ExpandableText from './ExpandableText.vue'

const uiStore = useUIStore()
const searchStore = useSearchStore()
const databaseStore = useDatabaseStore()
const { copyToClipboard } = useSearch()

const LONG_VALUE_THRESHOLD = 200
const hideEmpty = ref(true)
const allExpanded = ref(false)

const searchWords = computed(() => extractSearchWords(searchStore.searchTerm))

/**
 * Get only visible fields (respecting selected columns)
 * Returns array of { key, value } objects
 */
const visibleFields = computed(() => {
  if (!searchStore.selectedItem) return []

  // Filter to only show selected columns in their display order
  return databaseStore.selectedColumns.map(column => ({
    key: column,
    value: searchStore.selectedItem[column],
  }))
})

const displayFields = computed(() => {
  if (!hideEmpty.value) return visibleFields.value
  return visibleFields.value.filter(f => {
    const val = f.value
    return val !== null && val !== undefined && val !== ''
  })
})

const emptyFieldCount = computed(() => visibleFields.value.length - displayFields.value.length)

const hasLongFields = computed(() =>
  visibleFields.value.some(f => String(f.value || '').length > LONG_VALUE_THRESHOLD)
)

/**
 * Check if value is long enough to need expandable text
 */
function isLongValue(value) {
  const str = String(value || '')
  return str.length > LONG_VALUE_THRESHOLD
}

/**
 * Process a field value: strip markup tags and highlight search terms.
 * Returns HTML string safe for v-html.
 */
function highlightedValue(value) {
  if (value === null || value === undefined) return '&mdash;'
  if (value === '') return '<span class="text-medium-emphasis">(empty)</span>'
  const cleaned = stripMarkupTags(String(value))
  return highlightSearchTerms(cleaned, searchWords.value)
}

function toggleAllExpanded() {
  allExpanded.value = !allExpanded.value
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
function copyAllJson() {
  if (searchStore.selectedItem && visibleFields.value.length > 0) {
    const filteredItem = {}
    visibleFields.value.forEach(field => {
      filteredItem[field.key] = field.value
    })
    const json = JSON.stringify(filteredItem, null, 2)
    copyToClipboard(json)
  }
}

/**
 * Copy entire item as plain text (field: value pairs)
 */
function copyAllText() {
  if (searchStore.selectedItem && visibleFields.value.length > 0) {
    const text = visibleFields.value.map(field => `${field.key}: ${field.value ?? ''}`).join('\n')
    copyToClipboard(text)
  }
}

// Navigation
function navigateNext() {
  searchStore.navigateNext()
  allExpanded.value = false
}

function navigatePrevious() {
  searchStore.navigatePrevious()
  allExpanded.value = false
}

function handleKeydown(event) {
  if (!uiStore.detailsDialog) return

  if (event.key === 'ArrowLeft' && searchStore.canNavigatePrevious) {
    event.preventDefault()
    navigatePrevious()
  } else if (event.key === 'ArrowRight' && searchStore.canNavigateNext) {
    event.preventDefault()
    navigateNext()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
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
  width: 170px;
  min-width: 140px;
  max-width: 200px;
  padding: 8px 12px !important;
  vertical-align: top;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  word-break: break-word;
  hyphens: auto;
}

.value-cell {
  padding: 8px 12px !important;
  vertical-align: top;
  word-break: break-word;
  line-height: 1.5;
}

.value-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.value-content {
  max-width: 100%;
}

.action-cell {
  width: 36px;
  padding: 6px 4px !important;
  vertical-align: top;
  text-align: center;
}

:deep(mark) {
  background-color: rgba(255, 213, 0, 0.4);
  border-radius: 2px;
  padding: 0 1px;
}

/* Handle table width */
:deep(.v-table > .v-table__wrapper > table) {
  table-layout: fixed;
  width: 100%;
}
</style>
