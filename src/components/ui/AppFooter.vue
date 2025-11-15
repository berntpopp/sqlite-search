<template>
  <!-- Compact modern footer with elevation -->
  <v-footer app class="pa-2" elevation="2" border="t">
    <v-row justify="center" no-gutters dense>
      <v-col v-for="link in links" :key="link.text" cols="auto">
        <v-btn
          :icon="link.icon"
          variant="text"
          size="small"
          density="compact"
          @click="handleAction(link.action)"
        >
          <v-icon size="small">{{ link.icon }}</v-icon>
          <v-tooltip activator="parent" location="top">{{
            link.text
          }}</v-tooltip>
        </v-btn>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup>
import { useUIStore } from '@/stores/ui.store'
import footerConfig from '@/config/footerConfig.json'

const uiStore = useUIStore()
const links = footerConfig.links

/**
 * Handle footer action clicks
 * @param {string} action - Action identifier from config
 */
function handleAction(action) {
  switch (action) {
    case 'help':
    case 'about':
      // Both actions open the help dialog which now contains comprehensive info
      uiStore.openHelpDialog()
      break
    default:
      console.warn(`Unknown footer action: ${action}`)
  }
}
</script>

<style scoped>
/* Compact footer styling */
.v-footer {
  min-height: 48px !important;
}
</style>
