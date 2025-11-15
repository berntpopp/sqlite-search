// tests/unit/stores/ui.store.spec.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from '@/stores/ui.store'

describe('UI Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Theme Management', () => {
    it('should initialize with default light theme', () => {
      const store = useUIStore()
      expect(store.currentTheme).toBe('light')
      expect(store.isDarkTheme).toBe(false)
    })

    it('should toggle theme from light to dark', () => {
      const store = useUIStore()
      store.toggleTheme()
      expect(store.currentTheme).toBe('dark')
      expect(store.isDarkTheme).toBe(true)
    })

    it('should toggle theme from dark to light', () => {
      const store = useUIStore()
      store.setTheme('dark')
      store.toggleTheme()
      expect(store.currentTheme).toBe('light')
      expect(store.isDarkTheme).toBe(false)
    })

    it('should set specific theme', () => {
      const store = useUIStore()
      store.setTheme('dark')
      expect(store.currentTheme).toBe('dark')
      expect(store.isDarkTheme).toBe(true)

      store.setTheme('light')
      expect(store.currentTheme).toBe('light')
      expect(store.isDarkTheme).toBe(false)
    })

    it('should persist theme to localStorage', () => {
      const store = useUIStore()
      store.setTheme('dark')
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('should restore theme from localStorage', () => {
      localStorage.getItem.mockReturnValueOnce('dark')
      const store = useUIStore()
      expect(store.currentTheme).toBe('dark')
      expect(store.isDarkTheme).toBe(true)
    })
  })

  describe('Database State', () => {
    it('should initialize with null database path', () => {
      const store = useUIStore()
      expect(store.databasePath).toBeNull()
    })

    it('should set database path', () => {
      const store = useUIStore()
      const path = '/path/to/database.sqlite'
      store.setDatabasePath(path)
      expect(store.databasePath).toBe(path)
    })

    it('should persist database path to localStorage', () => {
      const store = useUIStore()
      const path = '/path/to/database.sqlite'
      store.setDatabasePath(path)
      expect(localStorage.setItem).toHaveBeenCalledWith('databasePath', path)
    })
  })

  describe('Loading State', () => {
    it('should initialize with loading false', () => {
      const store = useUIStore()
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state', () => {
      const store = useUIStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)

      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })
})
