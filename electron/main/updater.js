// electron/main/updater.js
'use strict'

import { app, ipcMain } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg

/**
 * Set up auto-updater with IPC bridge to renderer process
 * @param {import('electron').BrowserWindow} mainWindow - Main application window
 * @param {object} log - Logger instance
 */
export function setupAutoUpdater(mainWindow, log) {
  if (!app.isPackaged) {
    log.info('Auto-updater disabled in development mode')
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
    mainWindow.webContents.send('update-checking')
  })

  autoUpdater.on('update-available', info => {
    log.info('Update available:', info.version)
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('No update available')
    mainWindow.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', progress => {
    log.info(`Download progress: ${progress.percent.toFixed(1)}%`)
    mainWindow.webContents.send('update-download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', info => {
    log.info('Update downloaded:', info.version)
    mainWindow.webContents.send('update-downloaded', {
      version: info.version,
    })
  })

  autoUpdater.on('error', err => {
    log.error('Auto-updater error:', err.message)
    mainWindow.webContents.send('update-error', err.message)
  })

  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return result
    } catch (err) {
      log.error('Check for updates failed:', err.message)
      throw err
    }
  })

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
    } catch (err) {
      log.error('Download update failed:', err.message)
      throw err
    }
  })

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall()
  })

  // Check on startup with delay
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      log.warn('Startup update check failed:', err.message)
    })
  }, 10_000)
}

/**
 * Clean up auto-updater IPC handlers
 */
export function cleanupAutoUpdater() {
  ipcMain.removeHandler('check-for-updates')
  ipcMain.removeHandler('download-update')
  ipcMain.removeHandler('install-update')
}
