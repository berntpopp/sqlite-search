<!-- src/App.vue -->
<template>
  <!-- Main application container -->
  <v-app>
    <!-- Application bar with title and database selection -->
    <v-app-bar app>
      <v-img 
        src="logo.webp"
        class="mr-3 app-logo"
        contain
        max-height="48"
        max-width="48"
      ></v-img>

      <!-- Application title -->
      <v-toolbar-title>
        <span>
          sqlite-search
        </span>
        <span class="version-info">
          v{{ version }}
        </span>
      </v-toolbar-title>

      <!-- Spacer to push the database selection button to the right -->
      <v-spacer></v-spacer>

      <!-- Button to trigger database file selection -->
      <v-btn text @click="selectDatabase">{{ selectDatabaseButtonText }}</v-btn>

      <!-- Switch for toggling between light and dark themes -->
    <v-btn icon @click="toggleTheme">
      <v-icon>
        {{ isDarkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
      </v-icon>
    </v-btn>
    </v-app-bar>

    <!-- Main content area -->
    <v-main>
      <!-- Container for search functionality -->
      <v-container>
        <v-row justify="center" class="mb-2 align-center">
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
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6" md="1">
            <!-- Arrow or visual cue between selects, shown only when a table is selected -->
            <v-icon>mdi-arrow-right</v-icon>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <!-- Dropdown for selecting columns, shown only when a table is selected -->
            <v-select
              :items="columns"
              label="Select Columns"
              v-model="selectedColumns"
              multiple
              chips
              variant="outlined"
              dense
            >
            </v-select>
          </v-col>

        </v-row>

        <!-- Divider with padding for visual separation -->
        <div class="my-4">
          <v-divider></v-divider>
        </div>

        <!-- Row for search input field -->
        <v-row justify="center" class="mb-3">
          <v-col cols="12" sm="8" md="6">
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
      </v-container>

      <!-- Divider line -->
      <v-divider></v-divider>

      <!-- Table displaying search results -->
      <v-data-table
        :headers="headers"
        :items="searchResults"
        class="elevation-1"
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
      <v-snackbar
        v-model="snackbar"
        bottom
        right
        :timeout="3000"
      >
        {{ snackbarText }}
        <v-btn
          color="red"
          text
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </v-snackbar>

    </v-main>

    <!-- Footer with contact information and copyright notice -->
    <v-footer app padless class="elevation-3">
      <v-container>
        <v-row justify="center">
          <!-- Example link -->
          <v-btn text :href="'https://example.com'" target="_blank">
            Contact Us
          </v-btn>
          <!-- Additional links or content here -->
        </v-row>
        <v-row justify="center">
          <span>&copy; 2024 sqlite-search. All rights reserved.</span>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script>
import packageInfo from '../package.json';

export default {
  data() {
    return {
      version: packageInfo.version,
      databasePath: '', // Store the selected database file path here
      searchTerm: '',
      searchResults: [],
      selectedItem: {},
      detailsDialog: false,
      tables: [],
      selectedTable: '',
      columns: [],
      selectedColumns: [],
      snackbar: false,
      snackbarText: '',
      isDarkTheme: false,
      headers: [
        { title: 'Column 1', value: 'column_1', sortable: true },
        { title: 'Column 2', value: 'column_2', sortable: true },
        { title: 'Column 3', value: 'column_3', sortable: true },
        { title: 'Column 4', value: 'column_4', sortable: true },
        { title: 'Column 5', value: 'column_5', sortable: true },
        // Add other headers here
      ],
    };
  },
  computed: {
    selectDatabaseButtonText() {
      if (this.databasePath) {
        const pathParts = this.databasePath.split(/[/\\]/); // Split the path
        const fileName = pathParts.pop(); // Get the file name
        return `Selected DB: ${fileName}`; // Prepend with 'Selected DB: '
      }
      return 'Select Database'; // Default text when no database is selected
    }
  },
  methods: {
    selectDatabase() {
      window.electronAPI.openFileDialog().then((filePath) => {
        if (filePath) {
          this.databasePath = filePath;

          window.electronAPI.changeDatabase(filePath);
          
          // Reset tables and selected columns as the database has changed
          this.tables = [];
          this.selectedColumns = [];

          // Fetch the tables from the new database
          window.electronAPI.getTableList();
        }
      }).catch(err => {
        console.error('File selection error:', err);
        this.snackbarText = 'Failed to select database.';
        this.snackbar = true;
      });
    },
    performSearch() {
      // Check if both a table and search term are selected
      if (this.selectedTable && this.searchTerm) {
        // Construct an object to send to the backend
        const searchParams = {
          searchTerm: this.searchTerm,
          selectedTable: this.selectedTable,
          selectedColumns: Array.from(this.selectedColumns)
        };

        // Send the search request to the backend
        window.electronAPI.performSearch(searchParams.searchTerm, searchParams.selectedTable, searchParams.selectedColumns);

        // Handle the search results
        window.electronAPI.onSearchResults((event, searchResults) => {
          this.searchResults = searchResults;
        });

        // Handle any search error
        window.electronAPI.onSearchError((event, errorMessage) => {
          this.snackbarText = errorMessage;
          this.snackbar = true;
        });
      } else {
        // Show a notification if the table or search term is missing
        this.snackbarText = 'Please select a table and enter a search term.';
        this.snackbar = true;
      }
    },
    showDetails(item) {
      this.selectedItem = item;
      this.detailsDialog = true;
    },
    truncateText(text) {
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    },
    copyToClipboard(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          // Possibly show a notification that the text was copied
        }, (err) => {
          console.error('Could not copy text: ', err);
        });
      } else {
        // Clipboard API not available, use a fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    },
    onTableSelect() {
      // Clear previous search results and possibly the search term
      this.searchResults = [];
      // this.searchTerm = ''; // Uncomment if you want to clear the search term as well

      if (this.selectedTable) {
        // Fetch columns (headers) for the new table
        window.electronAPI.getColumns(this.selectedTable);

        window.electronAPI.onColumnsList((event, columns) => {
          if (columns && columns.length > 0) {
            this.columns = columns; // Update columns data property
            this.headers = columns.map(column => ({
              title: column,
              text: column,
              value: column,
              sortable: true
            }));

            // Optionally set selectedColumns to all columns by default
            this.selectedColumns = columns; // Or use columns.slice(0, 5) for the first 5
          } else {
            // If no columns found, show feedback
            this.snackbarText = 'The selected table has no columns or is not searchable.';
            this.snackbar = true;
          }
        });
      } else {
        // Provide feedback if no table is selected
        this.snackbarText = 'No table selected.';
        this.snackbar = true;
      }
    },
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
      this.applyTheme();
    },
    applyTheme() {
      const theme = localStorage.getItem('theme') || 'light';
      this.isDarkTheme = theme === 'dark';
      this.$vuetify.theme.global.name = this.isDarkTheme ? 'dark' : 'light';
    },
  },
  created() {
    this.applyTheme();
    window.electronAPI.onSearchResults((event, searchResults) => {
      this.searchResults = searchResults;
    });
    window.electronAPI.onTableList((event, tables) => {
      this.tables = tables.map(t => t.name);
    });
    window.electronAPI.onColumnsList((event, columns) => {
      this.columns = columns;
    });
    window.electronAPI.onDatabaseError((event, errorMessage) => {
      console.error('Database connection error:', errorMessage);
      this.snackbarText = errorMessage;
      this.snackbar = true;
    });
  },
  mounted() {
    // Call this when the database is selected and you want to fetch the table list
    window.electronAPI.getTableList();
    window.electronAPI.onTableList((event, tables) => {
      this.tables = tables;
    });
  },
};
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
</style>
