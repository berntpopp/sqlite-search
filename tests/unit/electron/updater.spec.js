import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock electron modules before importing
const mockAutoUpdater = {
  autoDownload: true,
  autoInstallOnAppQuit: false,
  on: vi.fn(),
  checkForUpdates: vi.fn().mockResolvedValue({}),
  downloadUpdate: vi.fn().mockResolvedValue(undefined),
  quitAndInstall: vi.fn(),
}

vi.mock('electron-updater', () => ({
  default: { autoUpdater: mockAutoUpdater },
}))

const mockIpcMain = {
  handle: vi.fn(),
  removeHandler: vi.fn(),
}

vi.mock('electron', () => ({
  app: { isPackaged: true },
  ipcMain: mockIpcMain,
}))

// Import after mocks are set up
const { setupAutoUpdater, cleanupAutoUpdater } = await import('../../../electron/main/updater.js')

describe('updater', () => {
  let mockMainWindow
  let mockLog

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockMainWindow = {
      webContents: {
        send: vi.fn(),
      },
    }

    mockLog = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('setupAutoUpdater', () => {
    it('should configure autoUpdater settings', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      expect(mockAutoUpdater.autoDownload).toBe(false)
      expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(true)
    })

    it('should register all event listeners', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const registeredEvents = mockAutoUpdater.on.mock.calls.map(call => call[0])
      expect(registeredEvents).toContain('checking-for-update')
      expect(registeredEvents).toContain('update-available')
      expect(registeredEvents).toContain('update-not-available')
      expect(registeredEvents).toContain('download-progress')
      expect(registeredEvents).toContain('update-downloaded')
      expect(registeredEvents).toContain('error')
    })

    it('should register IPC handlers', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const registeredChannels = mockIpcMain.handle.mock.calls.map(call => call[0])
      expect(registeredChannels).toContain('check-for-updates')
      expect(registeredChannels).toContain('download-update')
      expect(registeredChannels).toContain('install-update')
    })

    it('should check for updates after 10 second delay', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      expect(mockAutoUpdater.checkForUpdates).not.toHaveBeenCalled()

      vi.advanceTimersByTime(10_000)

      expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalledOnce()
    })

    it('should forward update-available event to renderer', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const updateAvailableHandler = mockAutoUpdater.on.mock.calls.find(
        call => call[0] === 'update-available'
      )[1]

      updateAvailableHandler({
        version: '1.2.0',
        releaseDate: '2025-01-01',
        releaseNotes: 'Bug fixes',
      })

      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('update-available', {
        version: '1.2.0',
        releaseDate: '2025-01-01',
        releaseNotes: 'Bug fixes',
      })
    })

    it('should forward download-progress event to renderer', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const progressHandler = mockAutoUpdater.on.mock.calls.find(
        call => call[0] === 'download-progress'
      )[1]

      progressHandler({ percent: 42.5, transferred: 1000, total: 2353 })

      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('update-download-progress', {
        percent: 42.5,
        transferred: 1000,
        total: 2353,
      })
    })

    it('should forward update-downloaded event to renderer', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const downloadedHandler = mockAutoUpdater.on.mock.calls.find(
        call => call[0] === 'update-downloaded'
      )[1]

      downloadedHandler({ version: '1.2.0' })

      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('update-downloaded', {
        version: '1.2.0',
      })
    })

    it('should forward error event to renderer', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const errorHandler = mockAutoUpdater.on.mock.calls.find(call => call[0] === 'error')[1]

      errorHandler(new Error('Network error'))

      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith('update-error', 'Network error')
    })
  })

  describe('IPC handlers', () => {
    it('check-for-updates handler should call autoUpdater.checkForUpdates', async () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const checkHandler = mockIpcMain.handle.mock.calls.find(
        call => call[0] === 'check-for-updates'
      )[1]

      await checkHandler()
      expect(mockAutoUpdater.checkForUpdates).toHaveBeenCalled()
    })

    it('download-update handler should call autoUpdater.downloadUpdate', async () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const downloadHandler = mockIpcMain.handle.mock.calls.find(
        call => call[0] === 'download-update'
      )[1]

      await downloadHandler()
      expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalled()
    })

    it('install-update handler should call autoUpdater.quitAndInstall', () => {
      setupAutoUpdater(mockMainWindow, mockLog)

      const installHandler = mockIpcMain.handle.mock.calls.find(
        call => call[0] === 'install-update'
      )[1]

      installHandler()
      expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalled()
    })
  })

  describe('cleanupAutoUpdater', () => {
    it('should remove all IPC handlers', () => {
      cleanupAutoUpdater()

      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('check-for-updates')
      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('download-update')
      expect(mockIpcMain.removeHandler).toHaveBeenCalledWith('install-update')
    })
  })
})
