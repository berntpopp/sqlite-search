import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUpdateStore } from '@/stores/update.store'

describe('update.store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useUpdateStore()
  })

  describe('initial state', () => {
    it('should have idle status', () => {
      expect(store.status).toBe('idle')
    })

    it('should have no available version', () => {
      expect(store.availableVersion).toBeNull()
    })

    it('should have no error message', () => {
      expect(store.errorMessage).toBeNull()
    })

    it('should have zero download progress', () => {
      expect(store.downloadProgress).toBe(0)
    })

    it('should not have an update', () => {
      expect(store.hasUpdate).toBe(false)
    })

    it('should not be downloaded', () => {
      expect(store.isDownloaded).toBe(false)
    })

    it('should not be checking', () => {
      expect(store.isChecking).toBe(false)
    })

    it('should not be downloading', () => {
      expect(store.isDownloading).toBe(false)
    })
  })

  describe('setChecking', () => {
    it('should set status to checking', () => {
      store.setChecking()
      expect(store.status).toBe('checking')
      expect(store.isChecking).toBe(true)
    })

    it('should clear previous error', () => {
      store.setError('old error')
      store.setChecking()
      expect(store.errorMessage).toBeNull()
    })
  })

  describe('setAvailable', () => {
    it('should set status and version info', () => {
      store.setAvailable({
        version: '1.2.0',
        releaseNotes: 'Bug fixes',
        releaseDate: '2025-01-01',
      })

      expect(store.status).toBe('available')
      expect(store.availableVersion).toBe('1.2.0')
      expect(store.releaseNotes).toBe('Bug fixes')
      expect(store.releaseDate).toBe('2025-01-01')
      expect(store.hasUpdate).toBe(true)
    })

    it('should handle missing optional fields', () => {
      store.setAvailable({ version: '1.2.0' })

      expect(store.availableVersion).toBe('1.2.0')
      expect(store.releaseNotes).toBeNull()
      expect(store.releaseDate).toBeNull()
    })
  })

  describe('setNotAvailable', () => {
    it('should reset status to idle', () => {
      store.setChecking()
      store.setNotAvailable()
      expect(store.status).toBe('idle')
      expect(store.hasUpdate).toBe(false)
    })
  })

  describe('setDownloading', () => {
    it('should set status to downloading and reset progress', () => {
      store.setDownloading()
      expect(store.status).toBe('downloading')
      expect(store.downloadProgress).toBe(0)
      expect(store.isDownloading).toBe(true)
    })
  })

  describe('setProgress', () => {
    it('should update download progress', () => {
      store.setDownloading()
      store.setProgress(42.5)
      expect(store.downloadProgress).toBe(42.5)
    })
  })

  describe('setDownloaded', () => {
    it('should set status to downloaded', () => {
      store.setDownloaded({ version: '1.2.0' })
      expect(store.status).toBe('downloaded')
      expect(store.isDownloaded).toBe(true)
      expect(store.hasUpdate).toBe(true)
      expect(store.downloadProgress).toBe(100)
      expect(store.availableVersion).toBe('1.2.0')
    })
  })

  describe('setError', () => {
    it('should set error status and message', () => {
      store.setError('Network error')
      expect(store.status).toBe('error')
      expect(store.errorMessage).toBe('Network error')
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      store.setAvailable({ version: '1.2.0', releaseNotes: 'notes', releaseDate: '2025-01-01' })
      store.setDownloading()
      store.setProgress(50)

      store.reset()

      expect(store.status).toBe('idle')
      expect(store.availableVersion).toBeNull()
      expect(store.releaseNotes).toBeNull()
      expect(store.releaseDate).toBeNull()
      expect(store.downloadProgress).toBe(0)
      expect(store.errorMessage).toBeNull()
    })
  })

  describe('state transitions', () => {
    it('should handle full update flow: idle → checking → available → downloading → downloaded', () => {
      expect(store.status).toBe('idle')

      store.setChecking()
      expect(store.status).toBe('checking')

      store.setAvailable({ version: '2.0.0' })
      expect(store.status).toBe('available')
      expect(store.hasUpdate).toBe(true)

      store.setDownloading()
      expect(store.status).toBe('downloading')
      expect(store.isDownloading).toBe(true)

      store.setProgress(50)
      expect(store.downloadProgress).toBe(50)

      store.setProgress(100)
      expect(store.downloadProgress).toBe(100)

      store.setDownloaded({ version: '2.0.0' })
      expect(store.status).toBe('downloaded')
      expect(store.isDownloaded).toBe(true)
    })

    it('should handle check with no update: idle → checking → idle', () => {
      store.setChecking()
      store.setNotAvailable()
      expect(store.status).toBe('idle')
      expect(store.hasUpdate).toBe(false)
    })

    it('should handle error during check: idle → checking → error', () => {
      store.setChecking()
      store.setError('Connection timeout')
      expect(store.status).toBe('error')
      expect(store.errorMessage).toBe('Connection timeout')
    })
  })
})
