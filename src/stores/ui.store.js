/**
 * UI Store
 * Manages UI state including theme, dialogs, and snackbar notifications
 * Uses Pinia Composition API pattern with localStorage persistence for theme
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const isDarkTheme = ref(localStorage.getItem('theme') === 'dark')
  const autoSelectTextColumns = ref(localStorage.getItem('autoSelectTextColumns') !== 'false') // Default true
  const detailsDialog = ref(false)
  const helpDialog = ref(false)
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('info')
  const snackbarTimeout = ref(3000)

  // Getters
  const currentTheme = computed(() => (isDarkTheme.value ? 'dark' : 'light'))

  // Actions
  /**
   * Toggle between light and dark theme and persist to localStorage
   */
  function toggleTheme() {
    isDarkTheme.value = !isDarkTheme.value
    localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
  }

  /**
   * Set specific theme and persist to localStorage
   * @param {string} theme - Theme name ('dark' or 'light')
   */
  function setTheme(theme) {
    isDarkTheme.value = theme === 'dark'
    localStorage.setItem('theme', theme)
  }

  /**
   * Toggle auto-select TEXT columns and persist to localStorage
   */
  function toggleAutoSelectTextColumns() {
    autoSelectTextColumns.value = !autoSelectTextColumns.value
    localStorage.setItem('autoSelectTextColumns', String(autoSelectTextColumns.value))
  }

  /**
   * Open result detail dialog
   */
  function openDetailsDialog() {
    detailsDialog.value = true
  }

  /**
   * Close result detail dialog
   */
  function closeDetailsDialog() {
    detailsDialog.value = false
  }

  /**
   * Open help/documentation dialog
   */
  function openHelpDialog() {
    helpDialog.value = true
  }

  /**
   * Close help/documentation dialog
   */
  function closeHelpDialog() {
    helpDialog.value = false
  }

  /**
   * Show snackbar notification with custom message, color, and timeout
   * @param {string} message - Message to display
   * @param {string} color - Vuetify color (e.g., 'info', 'success', 'error', 'warning')
   * @param {number} timeout - Duration in milliseconds before auto-hide
   */
  function showSnackbar(message, color = 'info', timeout = 3000) {
    snackbarText.value = message
    snackbarColor.value = color
    snackbarTimeout.value = timeout
    snackbar.value = true
  }

  /**
   * Show error snackbar (red, 5 second timeout)
   * @param {string} message - Error message to display
   */
  function showError(message) {
    showSnackbar(message, 'error', 5000)
  }

  /**
   * Show success snackbar (green, 3 second timeout)
   * @param {string} message - Success message to display
   */
  function showSuccess(message) {
    showSnackbar(message, 'success', 3000)
  }

  /**
   * Show info snackbar (blue, 3 second timeout)
   * @param {string} message - Info message to display
   */
  function showInfo(message) {
    showSnackbar(message, 'info', 3000)
  }

  /**
   * Close snackbar notification
   */
  function closeSnackbar() {
    snackbar.value = false
  }

  /**
   * Reset all UI state to initial values (except theme)
   */
  function reset() {
    detailsDialog.value = false
    helpDialog.value = false
    snackbar.value = false
    snackbarText.value = ''
  }

  return {
    // State
    isDarkTheme,
    autoSelectTextColumns,
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
    toggleAutoSelectTextColumns,
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
