<!-- App.vue -->
<template>
  <v-app>
    <v-app-bar app>
      <!-- Search Field and Button -->
      <v-text-field label="Search..." outlined dense hide-details></v-text-field>
      <v-btn icon><v-icon>mdi-magnify</v-icon></v-btn>
    </v-app-bar>

    <v-main>
      <!-- Results Table -->
      <v-data-table :headers="headers" :items="searchResults" class="elevation-1">
        <template v-slot:item:action-slot="{ item }">
          <v-btn icon @click="showDetails(item)">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <!-- Details Modal -->
      <v-dialog v-model="detailsDialog" persistent max-width="600px">
        <v-card>
          <v-card-title>
            Details
          </v-card-title>
          <v-card-text>
            <!-- Display detailed information here -->
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
      searchResults: [],
      detailsDialog: false,
      headers: [
        { text: 'Diagnose', value: 'Diagnose' },
        { text: 'Anamnese', value: 'Anamnese' },
        { text: 'FamAnamnese', value: 'FamAnamnese' },
        { text: 'Befund', value: 'Befund' },
        { text: 'Diagnostik', value: 'Diagnostik' },
        { text: 'Beurteilung', value: 'Beurteilung' },
        { text: 'Procedere', value: 'Procedere' },
        { text: 'Actions', value: 'action', sortable: false },
        // Add other headers here
      ],
      // Other necessary data properties
    };
  },
  methods: {
    showDetails(item) {
      console.log(item);
      // Logic to show details in the modal
      this.detailsDialog = true;
      // Populate modal with item details
    },
    // Other methods like search
  },
};
</script>