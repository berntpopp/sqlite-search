<!-- src/App.vue -->
<template>
  <!-- Main application container -->
  <v-app>
    <!-- Application bar with title and database selection -->
    <v-app-bar app>
      <v-toolbar-title>sqlite-search</v-toolbar-title>
      <v-spacer></v-spacer>
      <!-- Button to trigger database file selection -->
      <v-btn text @click="selectDatabase">Select Database</v-btn>
    </v-app-bar>

    <!-- Main content area -->
    <v-main>
      <!-- Container for search functionality -->
      <v-container>
        <!-- Row for table selection dropdown -->
        <v-row justify="center" class="mb-2">
          <v-col cols="12" md="4">
            <!-- Dropdown for selecting tables -->
            <v-select
              :items="tables"
              label="Select Table"
              v-model="selectedTable"
              @change="onTableSelect"
              solo
              dense
            ></v-select>
          </v-col>
        </v-row>
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
              dense
            ></v-text-field>
          </v-col>
        </v-row>
        <v-divider></v-divider>
      </v-container>

      <!-- Divider line -->
      <v-divider></v-divider>

      <!-- Table displaying search results -->
      <v-data-table
        :headers="headers"
        :items="searchResults"
        class="elevation-1"
      >
        <!-- Custom slot for rendering items -->
        <template v-slot:item="{ item }">
          <tr>
            <td>{{ truncateText(item.Diagnose) }}</td>
            <td>{{ truncateText(item.Anamnese) }}</td>
            <td>{{ truncateText(item.FamAnamnese) }}</td>
            <td>{{ truncateText(item.Befund) }}</td>
            <td>{{ truncateText(item.Diagnostik) }}</td>
            <td>{{ truncateText(item.Beurteilung) }}</td>
            <td>{{ truncateText(item.Procedere) }}</td>
            <td>
              <!-- Action buttons for each row -->
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

    <!-- Optional Footer -->
    <v-footer fixed padless>
      <!-- Footer content -->
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      searchTerm: '',
      searchResults: [],
      selectedItem: {},
      detailsDialog: false,
      tables: [],
      selectedTable: '',
      snackbar: false,
      snackbarText: '',
      headers: [
        { title: 'Diagnose', value: 'Diagnose', sortable: true },
        { title: 'Anamnese', value: 'Anamnese', sortable: true },
        { title: 'FamAnamnese', value: 'FamAnamnese', sortable: true },
        { title: 'Befund', value: 'Befund', sortable: true },
        { title: 'Diagnostik', value: 'Diagnostik', sortable: true },
        { title: 'Beurteilung', value: 'Beurteilung', sortable: true },
        { title: 'Procedere', value: 'Procedere', sortable: true },
        { title: 'Actions', value: 'action', sortable: false },
        // Add other headers here
      ],
    };
  },
  methods: {
    selectDatabase() {
      // Logic for opening a file dialog and selecting a database will go here
    },
    performSearch() {
      if (this.selectedTable) {
        window.electronAPI.performSearch(this.searchTerm, this.selectedTable);
      } else {
        this.snackbarText = 'Please select a table to search in.';
        this.snackbar = true; // Show the snackbar
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
      // this.searchTerm = ''; // Uncomment this if you want to clear the search term as well

      if (this.selectedTable) {
        // Fetch columns (headers) for the new table
        window.electronAPI.getColumns(this.selectedTable);
        window.electronAPI.onColumnsList((event, columns) => {
          if (columns.length > 0) {
            // Update headers for the data table
            this.headers = columns.map(column => ({
              text: column,
              value: column,
              sortable: true
            }));
          } else {
            // If no columns found, show feedback
            this.snackbarText = 'The selected table has no columns or is not searchable.';
            this.snackbar = true;
          }
        });
      } else {
        // Provide feedback if no table is selected (should not occur as this method is triggered on selection)
        this.snackbarText = 'No table selected.';
        this.snackbar = true;
      }
    },
  },
  created() {
    window.electronAPI.onSearchResults((event, searchResults) => {
      this.searchResults = searchResults;
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
