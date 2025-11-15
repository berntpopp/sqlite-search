// src/composables/useTheme.js
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui.store'
import { useTheme as useVuetifyTheme } from 'vuetify'

/**
 * Composable for theme management
 * Integrates Pinia UI store with Vuetify theme system
 * Uses modern Vuetify 3.9+ theme API
 */
export function useTheme() {
  const uiStore = useUIStore()
  const vuetifyTheme = useVuetifyTheme()
  const { isDarkTheme, currentTheme } = storeToRefs(uiStore)

  /**
   * Apply theme to Vuetify using modern API
   * Call this on app initialization to sync stored theme with Vuetify
   */
  function applyTheme() {
    const themeName = currentTheme.value
    // Use modern Vuetify API (available in 3.7+)
    if (typeof vuetifyTheme.global.change === 'function') {
      vuetifyTheme.global.change(themeName)
    } else {
      // Fallback for older versions
      vuetifyTheme.global.name.value = themeName
    }
  }

  /**
   * Toggle between dark and light theme
   * Uses Vuetify's native API for better performance
   */
  function toggleTheme() {
    const newTheme = vuetifyTheme.global.current.value.dark ? 'light' : 'dark'

    // Use modern Vuetify API
    if (typeof vuetifyTheme.global.change === 'function') {
      vuetifyTheme.global.change(newTheme)
    } else {
      // Fallback for older versions
      vuetifyTheme.global.name.value = newTheme
    }

    // Update Pinia store to stay in sync
    uiStore.setTheme(newTheme)
  }

  /**
   * Set specific theme
   * @param {'dark'|'light'} theme - Theme name
   */
  function setTheme(theme) {
    // Use modern Vuetify API
    if (typeof vuetifyTheme.global.change === 'function') {
      vuetifyTheme.global.change(theme)
    } else {
      // Fallback for older versions
      vuetifyTheme.global.name.value = theme
    }

    // Update Pinia store
    uiStore.setTheme(theme)
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
