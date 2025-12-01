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

  describe('Snackbar Notifications', () => {
    it('should initialize with snackbar hidden', () => {
      const store = useUIStore()
      expect(store.snackbar).toBe(false)
    })

    it('should show snackbar with message', () => {
      const store = useUIStore()
      store.showSnackbar('Test message', 'info', 3000)
      expect(store.snackbar).toBe(true)
      expect(store.snackbarText).toBe('Test message')
      expect(store.snackbarColor).toBe('info')
    })

    it('should show error snackbar', () => {
      const store = useUIStore()
      store.showError('Error message')
      expect(store.snackbar).toBe(true)
      expect(store.snackbarText).toBe('Error message')
      expect(store.snackbarColor).toBe('error')
    })

    it('should show success snackbar', () => {
      const store = useUIStore()
      store.showSuccess('Success message')
      expect(store.snackbar).toBe(true)
      expect(store.snackbarText).toBe('Success message')
      expect(store.snackbarColor).toBe('success')
    })

    it('should close snackbar', () => {
      const store = useUIStore()
      store.showSnackbar('Test', 'info', 3000)
      store.closeSnackbar()
      expect(store.snackbar).toBe(false)
    })
  })

  describe('Dialog State', () => {
    it('should initialize with dialogs closed', () => {
      const store = useUIStore()
      expect(store.detailsDialog).toBe(false)
      expect(store.helpDialog).toBe(false)
    })

    it('should open and close details dialog', () => {
      const store = useUIStore()
      store.openDetailsDialog()
      expect(store.detailsDialog).toBe(true)
      store.closeDetailsDialog()
      expect(store.detailsDialog).toBe(false)
    })

    it('should open and close help dialog', () => {
      const store = useUIStore()
      store.openHelpDialog()
      expect(store.helpDialog).toBe(true)
      store.closeHelpDialog()
      expect(store.helpDialog).toBe(false)
    })
  })
})
