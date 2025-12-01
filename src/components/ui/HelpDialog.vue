<template>
  <v-dialog v-model="uiStore.helpDialog" max-width="700" scrollable>
    <v-card>
      <!-- Header - matches ResultDetailDialog style -->
      <v-card-title class="d-flex justify-space-between align-center py-3 px-4">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-2">mdi-help-circle-outline</v-icon>
          <span class="text-h6">{{ faqConfig.title }}</span>
        </div>
        <v-btn icon variant="text" size="small" @click="uiStore.closeHelpDialog">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Content -->
      <v-card-text class="pa-0">
        <v-expansion-panels v-model="expandedPanel" variant="accordion">
          <v-expansion-panel
            v-for="(section, index) in faqConfig.sections"
            :key="section.id"
            :value="index"
          >
            <v-expansion-panel-title class="py-3">
              <v-icon :icon="section.icon" size="small" class="mr-3 text-medium-emphasis"></v-icon>
              <span class="text-body-1">{{ section.header }}</span>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- Intro text -->
              <p v-if="section.content.intro" class="text-body-2 text-medium-emphasis mb-3">
                {{ section.content.intro }}
              </p>

              <!-- Features list (checkmarks) -->
              <ul v-if="section.content.features" class="help-list mb-3">
                <li v-for="(feature, idx) in section.content.features" :key="idx">
                  <v-icon icon="mdi-check" size="x-small" color="success" class="mr-2"></v-icon>
                  <span class="text-body-2">{{ feature }}</span>
                </li>
              </ul>

              <!-- Steps list (numbered) -->
              <ol v-if="section.content.steps" class="help-list help-list--numbered mb-3">
                <li v-for="(step, idx) in section.content.steps" :key="idx">
                  <span class="step-number">{{ idx + 1 }}</span>
                  <span class="text-body-2">{{ step }}</span>
                </li>
              </ol>

              <!-- Requirements list -->
              <ul v-if="section.content.requirements" class="help-list mb-3">
                <li v-for="(req, idx) in section.content.requirements" :key="idx">
                  <v-icon icon="mdi-chevron-right" size="x-small" class="mr-2 text-medium-emphasis"></v-icon>
                  <span class="text-body-2">{{ req }}</span>
                </li>
              </ul>

              <!-- Syntax examples -->
              <div v-if="section.content.examples" class="syntax-examples mb-3">
                <div
                  v-for="(example, idx) in section.content.examples"
                  :key="idx"
                  class="syntax-row"
                >
                  <code class="syntax-code">{{ example.syntax }}</code>
                  <span class="text-body-2 text-medium-emphasis">{{ example.description }}</span>
                </div>
              </div>

              <!-- Options list (settings) -->
              <div v-if="section.content.options" class="options-list mb-3">
                <div
                  v-for="(option, idx) in section.content.options"
                  :key="idx"
                  class="option-item"
                >
                  <v-icon :icon="option.icon" size="small" class="mr-2 text-medium-emphasis"></v-icon>
                  <div>
                    <span class="text-body-2 font-weight-medium">{{ option.name }}</span>
                    <span class="text-body-2 text-medium-emphasis"> — {{ option.description }}</span>
                  </div>
                </div>
              </div>

              <!-- Troubleshooting issues -->
              <div v-if="section.content.issues" class="issues-list mb-3">
                <div
                  v-for="(issue, idx) in section.content.issues"
                  :key="idx"
                  class="issue-item"
                >
                  <div class="text-body-2">
                    <strong>{{ issue.problem }}:</strong>
                    <span class="text-medium-emphasis">{{ issue.solution }}</span>
                  </div>
                </div>
              </div>

              <!-- Tech chip -->
              <div v-if="section.content.tech" class="text-body-2 text-medium-emphasis mb-2">
                <v-icon icon="mdi-code-tags" size="x-small" class="mr-1"></v-icon>
                {{ section.content.tech }}
              </div>

              <!-- Tip -->
              <div v-if="section.content.tip" class="help-note help-note--tip mb-2">
                <v-icon icon="mdi-lightbulb-outline" size="x-small" class="mr-2"></v-icon>
                <span class="text-body-2">{{ section.content.tip }}</span>
              </div>

              <!-- Note -->
              <div v-if="section.content.note" class="help-note mb-2">
                <v-icon icon="mdi-information-outline" size="x-small" class="mr-2"></v-icon>
                <span class="text-body-2">{{ section.content.note }}</span>
              </div>

              <!-- Pagination -->
              <div v-if="section.content.pagination" class="text-body-2 text-medium-emphasis mb-2">
                <v-icon icon="mdi-page-next-outline" size="x-small" class="mr-1"></v-icon>
                {{ section.content.pagination }}
              </div>

              <!-- Persistence -->
              <div v-if="section.content.persistence" class="text-body-2 text-medium-emphasis mb-2">
                <v-icon icon="mdi-content-save-outline" size="x-small" class="mr-1"></v-icon>
                {{ section.content.persistence }}
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Footer - matches ResultDetailDialog -->
      <v-card-actions class="px-4 py-3">
        <span class="text-caption text-medium-emphasis">
          <v-icon icon="mdi-keyboard" size="x-small" class="mr-1"></v-icon>
          Press Escape to close
        </span>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="uiStore.closeHelpDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useUIStore } from '@/stores/ui.store'
import faqConfig from '@/config/faqPageConfig.json'

const uiStore = useUIStore()
const expandedPanel = ref(0)
</script>

<style scoped>
/* Expansion panel adjustments */
:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 16px 16px 40px;
}

/* Lists */
.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-list li {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
}

.help-list li .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* Numbered steps */
.help-list--numbered {
  counter-reset: step;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
  flex-shrink: 0;
}

/* Syntax examples */
.syntax-examples {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.syntax-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.syntax-code {
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 0.8125rem;
  padding: 2px 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 4px;
  white-space: nowrap;
}

/* Options list */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
}

.option-item .v-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

/* Issues list */
.issues-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 4px;
  border-left: 2px solid rgba(var(--v-theme-on-surface), 0.1);
}

.issue-item {
  padding-left: 12px;
}

/* Notes */
.help-note {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 4px;
}

.help-note .v-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.help-note--tip {
  background: rgba(var(--v-theme-info), 0.05);
}

.help-note--tip .v-icon {
  color: rgb(var(--v-theme-info));
}
</style>
