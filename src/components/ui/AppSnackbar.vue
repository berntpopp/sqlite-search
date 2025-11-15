<template>
  <!-- Global snackbar for notifications -->
  <v-snackbar
    v-model="uiStore.snackbar"
    :color="uiStore.snackbarColor"
    :timeout="uiStore.snackbarTimeout"
    location="bottom right"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon v-if="snackbarIcon" start size="small">{{ snackbarIcon }}</v-icon>
      <span>{{ uiStore.snackbarText }}</span>
    </div>

    <template v-slot:actions>
      <v-btn
        variant="text"
        size="small"
        @click="uiStore.closeSnackbar"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui.store'

const uiStore = useUIStore()

// Get icon based on snackbar type
const snackbarIcon = computed(() => {
  switch (uiStore.snackbarColor) {
    case 'success':
      return 'mdi-check-circle'
    case 'error':
      return 'mdi-alert-circle'
    case 'warning':
      return 'mdi-alert'
    case 'info':
      return 'mdi-information'
    default:
      return null
  }
})
</script>

<style scoped>
/* Compact snackbar styling */
:deep(.v-snackbar__wrapper) {
  min-width: 300px;
}
</style>
