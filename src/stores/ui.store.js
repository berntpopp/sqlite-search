// src/stores/ui.store.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const isDarkTheme = ref(localStorage.getItem('theme') === 'dark')
  const detailsDialog = ref(false)
  const helpDialog = ref(false)
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('info')
  const snackbarTimeout = ref(3000)

  // Getters
  const currentTheme = computed(() => (isDarkTheme.value ? 'dark' : 'light'))

  // Actions
  function toggleTheme() {
    isDarkTheme.value = !isDarkTheme.value
    localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
  }

  function setTheme(theme) {
    isDarkTheme.value = theme === 'dark'
    localStorage.setItem('theme', theme)
  }

  function openDetailsDialog() {
    detailsDialog.value = true
  }

  function closeDetailsDialog() {
    detailsDialog.value = false
  }

  function openHelpDialog() {
    helpDialog.value = true
  }

  function closeHelpDialog() {
    helpDialog.value = false
  }

  function showSnackbar(message, color = 'info', timeout = 3000) {
    snackbarText.value = message
    snackbarColor.value = color
    snackbarTimeout.value = timeout
    snackbar.value = true
  }

  function showError(message) {
    showSnackbar(message, 'error', 5000)
  }

  function showSuccess(message) {
    showSnackbar(message, 'success', 3000)
  }

  function showInfo(message) {
    showSnackbar(message, 'info', 3000)
  }

  function closeSnackbar() {
    snackbar.value = false
  }

  function reset() {
    detailsDialog.value = false
    helpDialog.value = false
    snackbar.value = false
    snackbarText.value = ''
  }

  return {
    // State
    isDarkTheme,
    detailsDialog,
    helpDialog,
    snackbar,
    snackbarText,
    snackbarColor,
    snackbarTimeout,
    // Getters
    currentTheme,
    // Actions
    toggleTheme,
    setTheme,
    openDetailsDialog,
    closeDetailsDialog,
    openHelpDialog,
    closeHelpDialog,
    showSnackbar,
    showError,
    showSuccess,
    showInfo,
    closeSnackbar,
    reset,
  }
})
