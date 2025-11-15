<template>
  <!-- Modern compact help dialog -->
  <v-dialog v-model="uiStore.helpDialog" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center py-3 px-4">
        <span class="text-h6">{{ faqConfig.title }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="uiStore.closeHelpDialog"
        ></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-4">
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="(section, index) in faqConfig.sections"
            :key="index"
          >
            <v-expansion-panel-title>
              <v-icon start size="small">mdi-help-circle-outline</v-icon>
              {{ section.header }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="mb-3">{{ section.content }}</p>
              <div v-if="section.links && section.links.length">
                <v-btn
                  v-for="link in section.links"
                  :key="link.title"
                  :href="link.url"
                  target="_blank"
                  variant="outlined"
                  size="small"
                  class="mr-2 mb-2"
                  prepend-icon="mdi-open-in-new"
                >
                  {{ link.title }}
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="px-4 py-3">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="uiStore.closeHelpDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useUIStore } from '@/stores/ui.store'
import faqConfig from '@/config/faqPageConfig.json'

const uiStore = useUIStore()
</script>

<style scoped>
/* Compact expansion panels */
:deep(.v-expansion-panel-text__wrapper) {
  padding: 12px 16px !important;
}
</style>
