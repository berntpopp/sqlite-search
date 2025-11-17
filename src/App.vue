<template>
  <!-- Modern application container with compact design -->
  <v-app>
    <!-- Modern header component -->
    <AppHeader @toggle-history="showHistoryDrawer = !showHistoryDrawer" />

    <!-- Main content area -->
    <v-main>
      <!-- Welcome screen when no database is selected -->
      <v-container v-if="!databaseStore.isConnected" class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="12" class="text-center">
            <v-img
              src="./logo.webp"
              alt="SQLite Search Logo"
              max-width="120"
              class="mx-auto mb-4"
            ></v-img>
            <h2 class="text-h5 text-medium-emphasis mb-2">Welcome to SQLite Search</h2>
            <p class="text-body-1 text-medium-emphasis">
              Please select a database to begin searching
            </p>
            <v-btn
              color="primary"
              size="large"
              variant="elevated"
              class="mt-4"
              prepend-icon="mdi-database"
              @click="selectDatabase"
            >
              Select Database
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <!-- Main search interface -->
      <v-container v-else fluid class="pa-4">
        <!-- Database selector row -->
        <v-row justify="center" align="center" class="mb-4">
          <v-col cols="12" sm="6" md="4">
            <TableSelector />
          </v-col>

          <v-col cols="12" sm="auto" class="text-center">
            <v-icon v-if="databaseStore.hasSelectedTable" color="primary" size="large">
              mdi-arrow-right
            </v-icon>
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <ColumnSelector />
          </v-col>
        </v-row>

        <!-- Divider -->
        <v-divider v-if="databaseStore.hasSelectedTable" class="mb-4"></v-divider>

        <!-- Search input row -->
        <v-row v-if="databaseStore.hasSelectedTable" justify="center" class="mb-4">
          <v-col cols="12" md="8" lg="6">
            <SearchInput />
          </v-col>
        </v-row>

        <!-- Results table -->
        <ResultsTable />
      </v-container>
    </v-main>

    <!-- Global components -->
    <HelpDialog />
    <ResultDetailDialog />
    <AppSnackbar />
    <HistoryDrawer v-model="showHistoryDrawer" />
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useDatabaseStore } from '@/stores/database.store'
import { useSearchStore } from '@/stores/search.store'
import { useUIStore } from '@/stores/ui.store'
import { useHistoryStore } from '@/stores/history.store'
import { useDatabase } from '@/composables/useDatabase'
import { useTheme } from '@/composables/useTheme'

// Components
import AppHeader from '@/components/ui/AppHeader.vue'
import HelpDialog from '@/components/ui/HelpDialog.vue'
import AppSnackbar from '@/components/ui/AppSnackbar.vue'
import TableSelector from '@/components/database/TableSelector.vue'
import ColumnSelector from '@/components/database/ColumnSelector.vue'
import SearchInput from '@/components/search/SearchInput.vue'
import ResultsTable from '@/components/results/ResultsTable.vue'
import ResultDetailDialog from '@/components/results/ResultDetailDialog.vue'
import HistoryDrawer from '@/components/HistoryDrawer.vue'

// Stores and composables
const databaseStore = useDatabaseStore()
const searchStore = useSearchStore()
const uiStore = useUIStore()
const historyStore = useHistoryStore()
const { selectDatabase } = useDatabase()
const { applyTheme } = useTheme()

// Component state
const showHistoryDrawer = ref(false)

// Store event listener cleanup functions
let cleanupFunctions = []

/**
 * Set up Electron IPC event listeners
 * These listeners bridge the Electron IPC system with Pinia stores
 */
function setupIPCListeners() {
  // Listener for table list updates
  const onTableListHandler = (event, tables) => {
    databaseStore.setTables(tables.map(t => (typeof t === 'string' ? t : t.name)))
  }
  window.electronAPI.onTableList(onTableListHandler)
  cleanupFunctions.push(() => {
    // Note: Electron IPC doesn't provide direct removeListener on contextBridge
    // This is a limitation of the current setup
  })

  // Listener for column list updates
  const onColumnsListHandler = (event, columns) => {
    if (columns && columns.length > 0) {
      databaseStore.setColumns(columns)

      // Check if auto-select TEXT columns is enabled
      const autoSelectText = uiStore.autoSelectTextColumns

      if (autoSelectText) {
        // Auto-select TEXT columns only
        databaseStore.selectColumns(null, true)
      } else {
        // Select all columns
        databaseStore.selectColumns(databaseStore.columnNames)
      }

      // Set current table for search store (enables sort/filter persistence)
      searchStore.setCurrentTable(databaseStore.selectedTable)

      const textColCount = databaseStore.textColumns.length
      const totalColCount = columns.length

      if (autoSelectText) {
        if (textColCount < totalColCount) {
          uiStore.showSuccess(
            `${textColCount} TEXT column(s) auto-selected (${totalColCount - textColCount} non-text hidden)`
          )
        } else {
          uiStore.showSuccess(`All ${textColCount} column(s) selected (all are TEXT)`)
        }
      } else {
        uiStore.showSuccess(`All ${totalColCount} column(s) selected`)
      }
    } else {
      uiStore.showError('The selected table has no columns or is not searchable')
    }
  }
  window.electronAPI.onColumnsList(onColumnsListHandler)

  // Listener for search results
  const onSearchResultsHandler = (event, results) => {
    searchStore.setResults(results || [])
    searchStore.setLoading(false)

    if (!results || results.length === 0) {
      uiStore.showInfo('No results found')
    } else {
      uiStore.showSuccess(`Found ${results.length} result(s)`)
    }

    // Track search in history
    if (searchStore.searchTerm && databaseStore.path) {
      historyStore.addSearch({
        searchTerm: searchStore.searchTerm,
        databasePath: databaseStore.path,
        table: databaseStore.selectedTable,
        columns: databaseStore.selectedColumns,
        resultCount: results?.length || 0,
      })
    }
  }
  window.electronAPI.onSearchResults(onSearchResultsHandler)

  // Listener for search errors
  const onSearchErrorHandler = (event, errorMessage) => {
    searchStore.setError(errorMessage)
    searchStore.setLoading(false)
    uiStore.showError(`Search failed: ${errorMessage}`)
  }
  window.electronAPI.onSearchError(onSearchErrorHandler)

  // Listener for database errors
  const onDatabaseErrorHandler = (event, errorMessage) => {
    uiStore.showError(`Database error: ${errorMessage}`)
  }
  window.electronAPI.onDatabaseError(onDatabaseErrorHandler)
}

/**
 * Initialize application on mount
 */
onMounted(() => {
  // Apply saved theme
  applyTheme()

  // Set up IPC event listeners
  setupIPCListeners()

  // Load tables if database path exists in localStorage
  if (databaseStore.isConnected) {
    window.electronAPI.getTableList()
  }
})

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  // Run cleanup functions
  cleanupFunctions.forEach(fn => fn())
  cleanupFunctions = []
})
</script>

<style scoped>
/* Modern compact layout styles */
.fill-height {
  height: 100%;
  min-height: 400px;
}

/* Responsive spacing */
@media (max-width: 600px) {
  .v-container {
    padding: 8px !important;
  }
}
</style>
