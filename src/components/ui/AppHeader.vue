<template>
  <!-- Compact modern app header -->
  <v-app-bar app elevation="1" density="compact">
    <!-- App logo -->
    <v-img src="./logo.webp" class="mx-2" contain max-height="40" max-width="40"></v-img>

    <!-- Application title with version -->
    <v-toolbar-title class="text-h6">
      <span class="font-weight-medium">sqlite-search</span>
      <span class="text-caption text-medium-emphasis ml-1">v{{ version }}</span>
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <!-- Database selection button -->
    <v-btn
      :variant="databaseStore.isConnected ? 'tonal' : 'elevated'"
      :color="databaseStore.isConnected ? 'primary' : 'default'"
      size="small"
      class="mx-1"
      @click="selectDatabase"
    >
      <v-icon start size="small">mdi-database</v-icon>
      {{ databaseStore.isConnected ? databaseStore.fileName : 'Select Database' }}
      <v-tooltip activator="parent" location="bottom">
        {{ databaseStore.isConnected ? 'Change database' : 'Select a database file' }}
      </v-tooltip>
    </v-btn>

    <!-- History button -->
    <v-btn
      icon
      variant="text"
      size="small"
      class="mx-1"
      :disabled="!historyStore.hasHistory"
      @click="emit('toggle-history')"
    >
      <v-badge
        v-if="historyStore.historyCount > 0"
        :content="historyStore.historyCount"
        color="primary"
        inline
      >
        <v-icon size="small">mdi-history</v-icon>
      </v-badge>
      <v-icon v-else size="small">mdi-history</v-icon>
      <v-tooltip activator="parent" location="bottom">
        Search history ({{ historyStore.historyCount }})
      </v-tooltip>
    </v-btn>

    <!-- Theme toggle button -->
    <v-btn icon variant="text" size="small" class="mx-1" @click="toggleTheme">
      <v-icon size="small">{{ themeIcon }}</v-icon>
      <v-tooltip activator="parent" location="bottom">
        {{ themeTooltip }}
      </v-tooltip>
    </v-btn>

    <!-- Reset state button -->
    <v-btn icon variant="text" size="small" class="mx-1" @click="handleReset">
      <v-icon size="small">mdi-refresh</v-icon>
      <v-tooltip activator="parent" location="bottom"> Reset application state </v-tooltip>
    </v-btn>

    <!-- Help/FAQ button -->
    <v-btn variant="text" size="small" class="mx-1" @click="uiStore.openHelpDialog">
      <v-icon start size="small">mdi-help-circle-outline</v-icon>
      Help
      <v-tooltip activator="parent" location="bottom"> Open help & documentation </v-tooltip>
    </v-btn>
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue'
import { useDatabase } from '@/composables/useDatabase'
import { useTheme } from '@/composables/useTheme'
import { useUIStore } from '@/stores/ui.store'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'
import { useHistoryStore } from '@/stores/history.store'
import packageJson from '../../../package.json'

// Emits
const emit = defineEmits(['toggle-history'])

// Composables
const { selectDatabase, resetDatabase } = useDatabase()
const { toggleTheme, getThemeIcon, getThemeTooltip } = useTheme()

// Stores
const uiStore = useUIStore()
const databaseStore = useDatabaseStore()
const searchStore = useSearchStore()
const historyStore = useHistoryStore()

// App version from package.json
const version = packageJson.version

// Computed properties for theme
const themeIcon = computed(() => getThemeIcon())
const themeTooltip = computed(() => getThemeTooltip())

/**
 * Handle reset action
 * Resets database, search state, and clears history
 */
function handleReset() {
  resetDatabase()
  searchStore.reset()
  historyStore.clearHistory()
  uiStore.showSuccess('Application state reset')
}
</script>

<style scoped>
/* Compact header styling */
.v-app-bar {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.v-toolbar-title {
  font-size: 1.125rem !important;
}
</style>
