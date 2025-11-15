// src/composables/useTheme.js
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui.store'
import { useTheme as useVuetifyTheme } from 'vuetify'

/**
 * Composable for theme management
 * Integrates Pinia UI store with Vuetify theme system
 * Uses Vuetify 3.9+ theme API: theme.change(), theme.toggle()
 * @see https://vuetifyjs.com/en/features/theme/
 */
export function useTheme() {
  const uiStore = useUIStore()
  const theme = useVuetifyTheme()
  const { isDarkTheme, currentTheme } = storeToRefs(uiStore)

  /**
   * Apply theme to Vuetify using modern API
   * Call this on app initialization to sync stored theme with Vuetify
   */
  function applyTheme() {
    // Vuetify 3.9+ API: theme.change(name)
    theme.change(currentTheme.value)
  }

  /**
   * Toggle between dark and light theme
   * Uses Vuetify's native toggle() for optimal performance
   */
  function toggleTheme() {
    // Vuetify 3.9+ API: theme.toggle() or theme.toggle([theme1, theme2])
    theme.toggle(['light', 'dark'])

    // Update Pinia store to stay in sync
    const newTheme = theme.global.current.value.dark ? 'dark' : 'light'
    uiStore.setTheme(newTheme)
  }

  /**
   * Set specific theme
   * @param {'dark'|'light'} themeName - Theme name
   */
  function setTheme(themeName) {
    // Vuetify 3.9+ API: theme.change(name)
    theme.change(themeName)

    // Update Pinia store
    uiStore.setTheme(themeName)
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
