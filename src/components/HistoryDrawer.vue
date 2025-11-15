<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    temporary
    width="400"
    :theme="uiStore.currentTheme"
  >
    <v-card flat class="d-flex flex-column h-100">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-history" class="mr-2" />
        <span>Search History</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-divider />

      <!-- Tabs for All / Favorites -->
      <v-tabs v-model="activeTab" density="compact" class="px-2">
        <v-tab value="all">
          <v-icon icon="mdi-clock-outline" size="small" class="mr-2" />
          All ({{ historyStore.historyCount }})
        </v-tab>
        <v-tab value="favorites">
          <v-icon icon="mdi-star" size="small" class="mr-2" />
          Favorites ({{ historyStore.favoriteSearches.length }})
        </v-tab>
      </v-tabs>

      <v-divider />

      <!-- Action Buttons -->
      <v-card-actions class="px-4 py-2">
        <v-btn
          v-if="activeTab === 'all'"
          variant="text"
          size="small"
          color="error"
          prepend-icon="mdi-delete-sweep"
          :disabled="!historyStore.hasHistory"
          @click="confirmClearHistory"
        >
          Clear History
        </v-btn>
        <v-spacer />
        <span v-if="historyStore.hasHistory" class="text-caption text-medium-emphasis">
          {{ displayedEntries.length }} {{ displayedEntries.length === 1 ? 'entry' : 'entries' }}
        </span>
      </v-card-actions>

      <v-divider />

      <!-- History Timeline -->
      <v-card-text class="flex-grow-1 overflow-y-auto pa-0">
        <v-window v-model="activeTab">
          <!-- All History Tab -->
          <v-window-item value="all">
            <div v-if="!historyStore.hasHistory" class="pa-8 text-center">
              <v-icon icon="mdi-history" size="64" color="grey-lighten-1" class="mb-4" />
              <p class="text-h6 text-medium-emphasis">No search history yet</p>
              <p class="text-caption text-medium-emphasis">Your search history will appear here</p>
            </div>

            <v-timeline v-else side="end" density="compact" class="pa-4">
              <v-timeline-item
                v-for="entry in displayedEntries"
                :key="entry.id"
                dot-color="primary"
                size="small"
              >
                <template #opposite>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(entry.timestamp) }}
                  </div>
                </template>

                <v-card variant="outlined" class="mb-2">
                  <v-card-text class="pa-3">
                    <!-- Search Term -->
                    <div class="d-flex align-start mb-2">
                      <v-icon icon="mdi-magnify" size="small" class="mr-2 mt-1" />
                      <div class="flex-grow-1">
                        <div class="text-subtitle-2 font-weight-bold">
                          {{ entry.searchTerm }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ entry.resultCount }}
                          {{ entry.resultCount === 1 ? 'result' : 'results' }}
                        </div>
                      </div>
                      <v-btn
                        :icon="entry.favorite ? 'mdi-star' : 'mdi-star-outline'"
                        :color="entry.favorite ? 'warning' : 'grey'"
                        variant="text"
                        size="x-small"
                        @click="historyStore.toggleFavorite(entry.id)"
                      />
                    </div>

                    <!-- Database Info -->
                    <div class="text-caption text-medium-emphasis mb-1">
                      <v-icon icon="mdi-database" size="x-small" class="mr-1" />
                      {{ getFileName(entry.databasePath) }}
                    </div>

                    <!-- Table & Columns -->
                    <div class="text-caption text-medium-emphasis mb-2">
                      <v-icon icon="mdi-table" size="x-small" class="mr-1" />
                      {{ entry.table }}
                      <span v-if="entry.columns.length > 0" class="ml-1">
                        ({{ entry.columns.join(', ') }})
                      </span>
                    </div>

                    <!-- Actions -->
                    <div class="d-flex gap-2">
                      <v-btn
                        variant="tonal"
                        size="small"
                        color="primary"
                        prepend-icon="mdi-restore"
                        @click="reactivateSearch(entry)"
                      >
                        Restore
                      </v-btn>
                      <v-btn
                        variant="text"
                        size="small"
                        color="error"
                        icon="mdi-delete"
                        @click="historyStore.removeEntry(entry.id)"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-window-item>

          <!-- Favorites Tab -->
          <v-window-item value="favorites">
            <div v-if="historyStore.favoriteSearches.length === 0" class="pa-8 text-center">
              <v-icon icon="mdi-star-outline" size="64" color="grey-lighten-1" class="mb-4" />
              <p class="text-h6 text-medium-emphasis">No favorite searches</p>
              <p class="text-caption text-medium-emphasis">
                Star searches to save them as favorites
              </p>
            </div>

            <v-timeline v-else side="end" density="compact" class="pa-4">
              <v-timeline-item
                v-for="entry in displayedEntries"
                :key="entry.id"
                dot-color="warning"
                size="small"
              >
                <template #opposite>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(entry.timestamp) }}
                  </div>
                </template>

                <v-card variant="outlined" class="mb-2">
                  <v-card-text class="pa-3">
                    <!-- Search Term -->
                    <div class="d-flex align-start mb-2">
                      <v-icon icon="mdi-magnify" size="small" class="mr-2 mt-1" />
                      <div class="flex-grow-1">
                        <div class="text-subtitle-2 font-weight-bold">
                          {{ entry.searchTerm }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ entry.resultCount }}
                          {{ entry.resultCount === 1 ? 'result' : 'results' }}
                        </div>
                      </div>
                      <v-btn
                        icon="mdi-star"
                        color="warning"
                        variant="text"
                        size="x-small"
                        @click="historyStore.toggleFavorite(entry.id)"
                      />
                    </div>

                    <!-- Database Info -->
                    <div class="text-caption text-medium-emphasis mb-1">
                      <v-icon icon="mdi-database" size="x-small" class="mr-1" />
                      {{ getFileName(entry.databasePath) }}
                    </div>

                    <!-- Table & Columns -->
                    <div class="text-caption text-medium-emphasis mb-2">
                      <v-icon icon="mdi-table" size="x-small" class="mr-1" />
                      {{ entry.table }}
                      <span v-if="entry.columns.length > 0" class="ml-1">
                        ({{ entry.columns.join(', ') }})
                      </span>
                    </div>

                    <!-- Actions -->
                    <div class="d-flex gap-2">
                      <v-btn
                        variant="tonal"
                        size="small"
                        color="primary"
                        prepend-icon="mdi-restore"
                        @click="reactivateSearch(entry)"
                      >
                        Restore
                      </v-btn>
                      <v-btn
                        variant="text"
                        size="small"
                        color="error"
                        icon="mdi-delete"
                        @click="historyStore.removeEntry(entry.id)"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Confirm Clear Dialog -->
    <v-dialog v-model="showClearDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6"> Clear Search History? </v-card-title>
        <v-card-text>
          This will remove all non-favorite search history entries. Favorites will be kept.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showClearDialog = false"> Cancel </v-btn>
          <v-btn variant="text" color="error" @click="clearHistory"> Clear </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHistoryStore } from '@/stores/history.store'
import { useUIStore } from '@/stores/ui.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'

// Stores
const historyStore = useHistoryStore()
const uiStore = useUIStore()
const databaseStore = useDatabaseStore()
const searchStore = useSearchStore()

// Component state
const isOpen = defineModel('modelValue', { type: Boolean, default: false })
const activeTab = ref('all')
const showClearDialog = ref(false)

// Computed
const displayedEntries = computed(() => {
  if (activeTab.value === 'favorites') {
    return historyStore.favoriteSearches
  }
  return historyStore.entries
})

// Methods
/**
 * Format timestamp to relative time
 */
function formatTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  // Format as date for older entries
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}

/**
 * Extract filename from path
 */
function getFileName(path) {
  if (!path) return 'Unknown'
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1]
}

/**
 * Reactivate a search from history
 */
function reactivateSearch(entry) {
  // Check if database path matches current database
  if (entry.databasePath !== databaseStore.path) {
    uiStore.showError('Cannot restore: Database path does not match current database')
    return
  }

  // Check if table exists in current database
  if (!databaseStore.tables.includes(entry.table)) {
    uiStore.showError('Cannot restore: Table not found in current database')
    return
  }

  // Restore table selection
  databaseStore.selectTable(entry.table)

  // Wait a moment for columns to load, then restore column selection
  setTimeout(() => {
    // Validate columns exist
    const validColumns = entry.columns.filter(col => databaseStore.columns.includes(col))

    if (validColumns.length === 0) {
      uiStore.showError('Cannot restore: No matching columns found')
      return
    }

    // Restore column selection
    databaseStore.selectColumns(validColumns)

    // Restore search term
    searchStore.setSearchTerm(entry.searchTerm)

    uiStore.showSuccess('Search restored from history')
    close()
  }, 100)
}

/**
 * Show confirmation dialog for clearing history
 */
function confirmClearHistory() {
  showClearDialog.value = true
}

/**
 * Clear non-favorite history
 */
function clearHistory() {
  historyStore.clearHistory()
  showClearDialog.value = false
  uiStore.showSuccess('History cleared')
}

/**
 * Close drawer
 */
function close() {
  isOpen.value = false
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
