// tests/unit/composables/useTheme.spec.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTheme } from '@/composables/useTheme'

// Mock Vuetify theme
const mockTheme = {
  global: {
    current: {
      value: { dark: false },
    },
  },
  change: vi.fn(),
  toggle: vi.fn(),
}

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme,
}))

describe('useTheme Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Theme State', () => {
    it('should provide reactive theme state from store', () => {
      const { isDarkTheme, currentTheme } = useTheme()

      expect(isDarkTheme.value).toBe(false)
      expect(currentTheme.value).toBe('light')
    })
  })

  describe('applyTheme', () => {
    it('should call Vuetify theme.change with current theme', () => {
      const { applyTheme, currentTheme } = useTheme()

      applyTheme()

      expect(mockTheme.change).toHaveBeenCalledWith(currentTheme.value)
    })
  })

  describe('toggleTheme', () => {
    it('should call Vuetify theme.toggle with light and dark options', () => {
      const { toggleTheme } = useTheme()

      toggleTheme()

      expect(mockTheme.toggle).toHaveBeenCalledWith(['light', 'dark'])
    })

    it('should update store based on Vuetify theme state', () => {
      const { toggleTheme, currentTheme } = useTheme()

      // Simulate Vuetify switching to dark
      mockTheme.global.current.value.dark = true

      toggleTheme()

      expect(currentTheme.value).toBe('dark')
    })
  })

  describe('setTheme', () => {
    it('should call Vuetify theme.change with specified theme', () => {
      const { setTheme } = useTheme()

      setTheme('dark')

      expect(mockTheme.change).toHaveBeenCalledWith('dark')
    })

    it('should update store with new theme', () => {
      const { setTheme, currentTheme } = useTheme()

      setTheme('dark')

      expect(currentTheme.value).toBe('dark')
    })
  })

  describe('getThemeIcon', () => {
    it('should return night icon for dark theme', () => {
      const { setTheme, getThemeIcon } = useTheme()

      setTheme('dark')

      expect(getThemeIcon()).toBe('mdi-weather-night')
    })

    it('should return sunny icon for light theme', () => {
      const { setTheme, getThemeIcon } = useTheme()

      setTheme('light')

      expect(getThemeIcon()).toBe('mdi-white-balance-sunny')
    })
  })

  describe('getThemeTooltip', () => {
    it('should return "Switch to light theme" for dark theme', () => {
      const { setTheme, getThemeTooltip } = useTheme()

      setTheme('dark')

      expect(getThemeTooltip()).toBe('Switch to light theme')
    })

    it('should return "Switch to dark theme" for light theme', () => {
      const { setTheme, getThemeTooltip } = useTheme()

      setTheme('light')

      expect(getThemeTooltip()).toBe('Switch to dark theme')
    })
  })
})
