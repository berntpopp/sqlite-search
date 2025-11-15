// src/composables/useTheme.js
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui.store'
import { useTheme as useVuetifyTheme } from 'vuetify'

/**
 * Composable for theme management
 * Integrates Pinia UI store with Vuetify theme system
 */
export function useTheme() {
  const uiStore = useUIStore()
  const vuetifyTheme = useVuetifyTheme()
  const { isDarkTheme, currentTheme } = storeToRefs(uiStore)

  /**
   * Apply theme to Vuetify
   * Call this on app initialization
   */
  function applyTheme() {
    const themeName = currentTheme.value
    vuetifyTheme.global.name.value = themeName
  }

  /**
   * Toggle between dark and light theme
   */
  function toggleTheme() {
    uiStore.toggleTheme()
    applyTheme()
  }

  /**
   * Set specific theme
   * @param {'dark'|'light'} theme - Theme name
   */
  function setTheme(theme) {
    uiStore.setTheme(theme)
    applyTheme()
  }

  /**
   * Get icon for current theme
   */
  function getThemeIcon() {
    return isDarkTheme.value ? 'mdi-weather-night' : 'mdi-white-balance-sunny'
  }

  /**
   * Get tooltip text for theme toggle
   */
  function getThemeTooltip() {
    return `Switch to ${isDarkTheme.value ? 'light' : 'dark'} theme`
  }

  return {
    // State (reactive refs from store)
    isDarkTheme,
    currentTheme,

    // Actions
    applyTheme,
    toggleTheme,
    setTheme,
    getThemeIcon,
    getThemeTooltip,
  }
}
