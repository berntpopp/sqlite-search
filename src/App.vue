<!-- src/App.vue -->
<template>
  <!-- Main application container -->
  <v-app>
    <!-- Application bar with title and database selection -->
    <v-app-bar app>
      <v-img src="/logo.webp" class="mr-3 app-logo" contain max-height="48" max-width="48"></v-img>

      <!-- Application title -->
      <v-toolbar-title>
        <span> sqlite-search </span>
        <span class="version-info"> v{{ version }} </span>
      </v-toolbar-title>

      <!-- Spacer to push the database selection button to the right -->
      <v-spacer></v-spacer>

      <!-- Button to trigger database file selection -->
      <v-btn :class="{ 'highlighted-button': databasePath }" text @click="selectDatabase">
        {{ selectDatabaseButtonText }}
        <v-tooltip activator="parent" location="end"> Select database </v-tooltip>
      </v-btn>

      <!-- Switch for toggling between light and dark themes -->
      <v-btn icon @click="toggleTheme">
        <v-icon>
          {{ isDarkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
        </v-icon>
        <v-tooltip activator="parent" location="end"> Toggle theme </v-tooltip>
      </v-btn>

      <!-- Reset Button -->
      <v-btn icon @click="resetAppState">
        <v-icon>mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="end"> Reset app state </v-tooltip>
      </v-btn>

      <!-- Help/FAQ Button -->
      <v-btn text @click="showFaqModal = true">
        Help/FAQ
        <v-tooltip activator="parent" location="end"> Show help </v-tooltip>
      </v-btn>
    </v-app-bar>

    <!-- Main content area -->
    <v-main>
      <!-- Show message if no database is loaded -->
      <div v-if="!databasePath" class="no-database-loaded">
        <img src="/logo.webp" alt="App Logo" class="app-logo" />
        <p>Please first select your database</p>
      </div>

      <!-- Container for search functionality -->
      <v-container>
        <v-row justify="center" class="my-1 align-center">
          <!-- Combined row for table and column selection dropdowns -->
          <v-col cols="12" sm="6" md="3">
            <!-- Dropdown for selecting tables -->
            <v-select
              :items="tables"
              label="Select Table"
              v-model="selectedTable"
              @update:modelValue="onTableSelect"
              variant="outlined"
              dense
              v-if="databasePath"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6" md="1" class="centered-arrow">
            <!-- Arrow or visual cue between selects, shown only when a table is selected -->
            <v-icon v-if="selectedTable">mdi-arrow-right</v-icon>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <!-- Dropdown for selecting columns, shown only when a table is selected -->
            <v-autocomplete
              v-model="selectedColumns"
              :items="columns"
              label="Select Columns"
              multiple
              clearable
              variant="outlined"
              dense
              @update:modelValue="onColumnSelect"
              v-if="selectedTable"
            >
              <template v-slot:selection="{ item, index }">
                <v-chip v-if="index < 2" size="small">
                  <span>{{ item.title }}</span>
                </v-chip>
                <span v-if="index === 2" class="text-grey text-caption align-self-center">
                  (+{{ selectedColumns.length - 2 }} others)
                </span>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>

        <!-- Divider with padding for visual separation -->
        <div class="my-1" v-if="selectedTable">
          <v-divider></v-divider>
        </div>

        <!-- Row for search input field -->
        <v-row justify="center" class="my-1">
          <v-col cols="12" sm="8" md="6" v-if="selectedTable">
            <!-- Text field for entering search terms -->
            <v-text-field
              label="Search..."
              outlined
              hide-details
              v-model="searchTerm"
              append-inner-icon="mdi-magnify"
              @keyup.enter="performSearch"
              @click:append-inner="performSearch"
              solo
              variant="outlined"
              dense
            ></v-text-field>
          </v-col>
        </v-row>

        <!-- Divider with padding for visual separation -->
        <div class="my-1" v-if="searchResults.length > 0">
          <v-divider></v-divider>
        </div>
      </v-container>

      <!-- Table displaying search results -->
      <v-data-table
        :headers="headers"
        :items="searchResults"
        class="elevation-1"
        v-if="searchResults.length > 0"
      >
        <!-- Custom slot for rendering items dynamically based on selectedColumns -->
        <template v-slot:item="{ item }">
          <tr>
            <!-- Loop over each column and create a cell for it -->
            <template v-for="header in selectedColumns" :key="header">
              <td>{{ truncateText(item[header]) }}</td>
            </template>
            <!-- Action buttons for each row -->
            <td>
              <v-btn icon @click="showDetails(item)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>

      <!-- Modal dialog for showing item details -->
      <v-dialog v-model="detailsDialog" persistent max-width="1800px">
        <v-card>
          <!-- Card title with close button -->
          <v-card-title class="d-flex justify-space-between align-center">
            Details
            <v-btn icon @click="detailsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <!-- Card text container for detailed view -->
          <v-card-text>
            <!-- Container for each detail row -->
            <v-container>
              <!-- Row for each field-value pair -->
              <v-row v-for="(value, key) in selectedItem" :key="key">
                <v-col cols="12" md="3" class="py-0">
                  <strong>{{ headers.find(h => h.value === key)?.title }}</strong>
                </v-col>
                <v-col cols="12" md="8" class="py-0">
                  <v-textarea
                    v-model="selectedItem[key]"
                    auto-grow
                    readonly
                    single-line
                    :style="{ width: '100%' }"
                  ></v-textarea>
                </v-col>
                <v-col cols="12" md="1" class="py-0">
                  <v-btn icon @click="copyToClipboard(value)">
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="detailsDialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar for user notifications -->
      <v-snackbar v-model="snackbar" bottom right :timeout="3000">
        {{ snackbarText }}
        <v-btn color="red" text @click="snackbar = false"> Close </v-btn>
      </v-snackbar>

      <!-- FAQ Modal -->
      <v-dialog v-model="showFaqModal" max-width="600px">
        <v-card>
          <v-card-title>{{ faqConfig.title }}</v-card-title>
          <v-card-text>
            <v-container>
              <v-row v-for="(section, index) in faqConfig.sections" :key="index">
                <v-col>
                  <h3>{{ section.header }}</h3>
                  <p>{{ section.content }}</p>
                  <v-btn
                    v-for="link in section.links"
                    :key="link.title"
                    :href="link.url"
                    text
                    target="_blank"
                    >{{ link.title }}</v-btn
                  >
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="showFaqModal = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>

    <!-- Footer with contact information and copyright notice -->
    <v-footer app padless class="elevation-3">
      <v-row justify="center" no-gutters>
        <v-col cols="auto" v-for="link in footerLinks" :key="link.text">
          <v-btn icon :href="link.href" target="_blank" text>
            <v-icon>{{ link.icon }}</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
import packageInfo from '../package.json'
import faqConfig from './config/faqPageConfig.json'
import footerConfig from './config/footerConfig.json'

export default {
  data() {
    return {
      version: packageInfo.version,
      databasePath: localStorage.getItem('databasePath') || '', // Load from local storage
      searchTerm: '',
      searchResults: [],
      selectedItem: {},
      detailsDialog: false,
      tables: [],
      selectedTable: localStorage.getItem('selectedTable') || '', // Load from local storage
      columns: [],
      selectedColumns: JSON.parse(localStorage.getItem('selectedColumns')) || [],
      snackbar: false,
      snackbarText: '',
      isDarkTheme: false,
      showFaqModal: false, // Controls the visibility of the FAQ modal
      faqConfig, // FAQ data loaded from the JSON file
      footerLinks: footerConfig.links,
      headers: [
        { title: 'Column 1', value: 'column_1', sortable: true },
        { title: 'Column 2', value: 'column_2', sortable: true },
        { title: 'Column 3', value: 'column_3', sortable: true },
        { title: 'Column 4', value: 'column_4', sortable: true },
        { title: 'Column 5', value: 'column_5', sortable: true },
        // Add other headers here
      ],
    }
  },
  computed: {
    selectDatabaseButtonText() {
      // Update button text based on databasePath
      return this.databasePath
        ? `Selected DB: ${this.getFileName(this.databasePath)}`
        : 'Select Database'
    },
  },
  methods: {
    selectDatabase() {
      window.electronAPI
        .openFileDialog()
        .then(filePath => {
          if (filePath) {
            this.databasePath = filePath
            localStorage.setItem('databasePath', this.databasePath)

            // Reset tables, selectedTable, and selectedColumns
            this.tables = []
            this.selectedTable = ''
            this.selectedColumns = []

            // Update local storage
            localStorage.removeItem('selectedTable')
            localStorage.removeItem('selectedColumns')

            window.electronAPI.changeDatabase(filePath)
            this.resetDatabaseDependentData()
            window.electronAPI.getTableList()
          }
        })
        .catch(err => {
          console.error('File selection error:', err)
          this.showError('Failed to select database.')
        })
    },
    performSearch() {
      // Check if both a table and search term are selected
      if (this.selectedTable && this.searchTerm) {
        // Construct an object to send to the backend
        const searchParams = {
          searchTerm: this.searchTerm,
          selectedTable: this.selectedTable,
          selectedColumns: Array.from(this.selectedColumns),
        }

        // Send the search request to the backend
        window.electronAPI.performSearch(
          searchParams.searchTerm,
          searchParams.selectedTable,
          searchParams.selectedColumns
        )

        // Handle the search results
        window.electronAPI.onSearchResults((event, searchResults) => {
          this.searchResults = searchResults
        })

        // Handle any search error
        window.electronAPI.onSearchError((event, errorMessage) => {
          this.showError(errorMessage)
        })
      } else {
        // Show a notification if the table or search term is missing
        this.snackbarText = 'Please select a table and enter a search term.'
        this.snackbar = true
      }
    },
    showDetails(item) {
      this.selectedItem = item
      this.detailsDialog = true
    },
    truncateText(text) {
      return text.length > 50 ? text.substring(0, 50) + '...' : text
    },
    copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(
          () => {
            // Possibly show a notification that the text was copied
          },
          err => {
            console.error('Could not copy text: ', err)
          }
        )
      } else {
        // Clipboard API not available, use a fallback
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    },
    onTableSelect() {
      // Clear previous search results and possibly the search term
      this.searchResults = []

      // Save the selected table to local storage
      localStorage.setItem('selectedTable', this.selectedTable)

      if (this.selectedTable) {
        // Fetch columns (headers) for the new table
        window.electronAPI.getColumns(this.selectedTable)

        // Reset selectedColumns
        this.selectedColumns = []
        localStorage.removeItem('selectedColumns')

        // Set up a listener for the columns list
        window.electronAPI.onColumnsList((event, columns) => {
          if (columns && columns.length > 0) {
            this.columns = columns // Update columns data property
            this.headers = columns.map(column => ({
              title: column,
              text: column,
              value: column,
              sortable: true,
            }))

            // Optionally set selectedColumns to all columns by default
            this.selectedColumns = columns // Or use columns.slice(0, 5) for the first 5
          } else {
            // If no columns found, show feedback
            this.snackbarText = 'The selected table has no columns or is not searchable.'
            this.snackbar = true
          }
        })
      } else {
        // Provide feedback if no table is selected
        this.snackbarText = 'No table selected.'
        this.snackbar = true
      }
    },
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme
      localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light')
      this.applyTheme()
    },
    applyTheme() {
      const theme = localStorage.getItem('theme') || 'light'
      this.isDarkTheme = theme === 'dark'
      // Options API: Set theme name directly
      this.$vuetify.theme.global.name = this.isDarkTheme ? 'dark' : 'light'
    },
    resetDatabaseDependentData() {
      this.tables = []
      this.selectedColumns = []
      this.searchResults = []
      // Reset other data that depends on the database
    },
    showError(message) {
      this.snackbarText = message
      this.snackbar = true
    },
    getFileName(filePath) {
      const pathParts = filePath.split(/[/\\]/)
      return pathParts.pop()
    },
    onColumnSelect() {
      // Save the selected columns to local storage
      localStorage.setItem('selectedColumns', JSON.stringify(this.selectedColumns))
    },
    resetAppState() {
      // Clear local storage
      localStorage.clear()
      // Reset application state
      this.databasePath = ''
      this.selectedTable = ''
      this.selectedColumns = []
      this.searchResults = []
      // Reset other necessary states
    },
  },
  created() {
    // Initialize application
    this.applyTheme()

    // Set up listeners for search results
    window.electronAPI.onSearchResults((event, searchResults) => {
      this.searchResults = searchResults
    })

    // Set up listeners for table list
    window.electronAPI.onTableList((event, tables) => {
      this.tables = tables.map(t => t.name)
    })

    // Set up listeners for column list
    window.electronAPI.onColumnsList((event, columns) => {
      this.columns = columns
    })

    // Set up listeners for database errors
    window.electronAPI.onDatabaseError((event, errorMessage) => {
      console.error('Database connection error:', errorMessage)
      this.showError(errorMessage)
    })
  },
  watch: {
    // Watchers to update local storage when selected columns change
    selectedColumns(newVal, oldVal) {
      // Trigger only if there is a real change in selected columns
      if (newVal.length !== oldVal.length || newVal.some((val, index) => val !== oldVal[index])) {
        this.onColumnSelect()
      }
    },
  },
  mounted() {
    // Call this when the database is selected and you want to fetch the table list
    window.electronAPI.getTableList()
    window.electronAPI.onTableList((event, tables) => {
      this.tables = tables
    })
  },
}
</script>

<style scoped>
/* Add custom styles for the arrow icon */
.my-4 {
  padding: 20px 0;
}

/* Style the arrow icon */
.v-icon.mdi-arrow-right {
  vertical-align: middle;
  margin: 0 20px;
}

/**
 * Styles for the application logo.
 * Sets a maximum width, adds right margin, and applies the fadeIn animation.
 */
.app-logo {
  max-width: 92px; /* Fixed maximum width for consistency */
  margin-right: 10px; /* Spacing between logo and title */
  animation: fadeIn 2s ease-out forwards; /* Applies the fadeIn animation */
}

/**
 * Styles for the version info.
 * Adds right padding and decreases the top margin to bring it closer to the app name.
 */
.version-info {
  display: block; /* Ensures the version info is on a new line */
  margin-left: auto;
  padding-right: 16px;
  font-size: 0.8rem;
  margin-top: -10px; /* Decrease the top margin to bring it closer to the app name */
}

/* FAQ Modal Styles */
.faq-section {
  margin-bottom: 20px;
}

.faq-section h3 {
  margin-top: 0;
}

/* Highlighted button style */
.highlighted-button {
  background-color: #ffcc00; /* or any other highlight color */
  color: white;
}

/* Styles for the no-database-loaded message */
.no-database-loaded {
  text-align: center;
  padding-top: 50px; /* Adjust as needed */
}

/* Centering the arrow icon */
.centered-arrow {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
