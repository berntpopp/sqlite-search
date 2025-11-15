// src/composables/useTheme.js
import { useUIStore } from '@/stores/ui.store'
import { useTheme as useVuetifyTheme } from 'vuetify'

/**
 * Composable for theme management
 * Integrates Pinia UI store with Vuetify theme system
 */
export function useTheme() {
  const uiStore = useUIStore()
  const vuetifyTheme = useVuetifyTheme()

  /**
   * Apply theme to Vuetify
   * Call this on app initialization
   */
  function applyTheme() {
    const themeName = uiStore.currentTheme
    vuetifyTheme.global.name = themeName
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
    return uiStore.isDarkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny'
  }

  /**
   * Get tooltip text for theme toggle
   */
  function getThemeTooltip() {
    return `Switch to ${uiStore.isDarkTheme ? 'light' : 'dark'} theme`
  }

  return {
    // State
    isDarkTheme: uiStore.isDarkTheme,
    currentTheme: uiStore.currentTheme,

    // Actions
    applyTheme,
    toggleTheme,
    setTheme,
    getThemeIcon,
    getThemeTooltip,
  }
}
