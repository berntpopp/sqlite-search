<!-- src/App.vue -->
<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>sqlite-search</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text @click="selectDatabase">Select Database</v-btn>
    </v-app-bar>

    <v-main>
      <!-- Search Field -->
        <v-row justify="center" class="mb-3 mt-3">
          <v-col cols="12" sm="8" md="6">
            <v-text-field
              label="Search..."
              outlined
              hide-details
              v-model="searchTerm"
              append-inner-icon="mdi-magnify"
              @keyup.enter="performSearch"
              @click:append-inner="performSearch"
            ></v-text-field>
          </v-col>
        </v-row>
      <v-divider></v-divider>

      <!-- Results Table -->
      <v-data-table
        :headers="headers"
        :items="searchResults"
        class="elevation-1"
      >
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
              <!-- Your action buttons -->
              <v-btn icon @click="showDetails(item)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>

      <!-- Details Modal -->
      <v-dialog v-model="detailsDialog" persistent max-width="1800px">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Details
            <v-btn icon @click="detailsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
            <v-card-text>
              <v-container>
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
      window.electronAPI.performSearch(this.searchTerm);
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
  },
  created() {
    window.electronAPI.onSearchResults((event, searchResults) => {
      this.searchResults = searchResults;
    });
  },
};
</script>
