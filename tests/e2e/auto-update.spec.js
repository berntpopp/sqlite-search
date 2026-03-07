/**
 * E2E Tests: Auto-Update Feature
 *
 * Tests the auto-update UI integration:
 * - Update button visibility based on state
 * - Preload API exposure
 *
 * Note: Actual update checks require a packaged app with network access.
 * These tests verify the IPC bridge and UI components are wired correctly.
 *
 * @module e2e/auto-update.spec
 */
import { test, expect } from './fixtures/electron.js'

test.describe('Auto-Update Feature', () => {
  test('should expose update API methods on electronAPI', async ({ window }) => {
    // Verify the preload bridge exposes all update methods
    const hasCheckForUpdates = await window.evaluate(
      () => typeof window.electronAPI.checkForUpdates === 'function'
    )
    expect(hasCheckForUpdates).toBe(true)

    const hasDownloadUpdate = await window.evaluate(
      () => typeof window.electronAPI.downloadUpdate === 'function'
    )
    expect(hasDownloadUpdate).toBe(true)

    const hasInstallUpdate = await window.evaluate(
      () => typeof window.electronAPI.installUpdate === 'function'
    )
    expect(hasInstallUpdate).toBe(true)

    const hasOnUpdateAvailable = await window.evaluate(
      () => typeof window.electronAPI.onUpdateAvailable === 'function'
    )
    expect(hasOnUpdateAvailable).toBe(true)

    const hasOnUpdateDownloaded = await window.evaluate(
      () => typeof window.electronAPI.onUpdateDownloaded === 'function'
    )
    expect(hasOnUpdateDownloaded).toBe(true)

    const hasOnUpdateError = await window.evaluate(
      () => typeof window.electronAPI.onUpdateError === 'function'
    )
    expect(hasOnUpdateError).toBe(true)

    const hasOnUpdateChecking = await window.evaluate(
      () => typeof window.electronAPI.onUpdateChecking === 'function'
    )
    expect(hasOnUpdateChecking).toBe(true)

    const hasOnUpdateNotAvailable = await window.evaluate(
      () => typeof window.electronAPI.onUpdateNotAvailable === 'function'
    )
    expect(hasOnUpdateNotAvailable).toBe(true)

    const hasOnUpdateDownloadProgress = await window.evaluate(
      () => typeof window.electronAPI.onUpdateDownloadProgress === 'function'
    )
    expect(hasOnUpdateDownloadProgress).toBe(true)
  })

  test('should not show update button when no update is available', async ({ window }) => {
    // Wait for app to be ready
    await window.waitForSelector('.v-app-bar', { timeout: 10000 })

    // The update button should not be visible in initial state
    const updateBtn = window.locator('[data-testid="update-btn"]')
    const isVisible = await updateBtn.isVisible().catch(() => false)
    expect(isVisible).toBe(false)
  })

  test('should show update button when update-available event is received', async ({
    window,
    electronApp,
  }) => {
    // Wait for app to be ready
    await window.waitForSelector('.v-app-bar', { timeout: 10000 })

    // Simulate an update-available event from the main process
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.webContents.send('update-available', {
        version: '99.0.0',
        releaseDate: '2026-01-01',
        releaseNotes: 'Test release',
      })
    })

    // Wait for Vue reactivity to update the DOM
    await window.waitForTimeout(500)

    // The update button should now be visible
    const updateBtn = window.locator('[data-testid="update-btn"]')
    await expect(updateBtn).toBeVisible({ timeout: 5000 })
  })

  test('should show restart button when update-downloaded event is received', async ({
    window,
    electronApp,
  }) => {
    await window.waitForSelector('.v-app-bar', { timeout: 10000 })

    // First send update-available, then update-downloaded
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.webContents.send('update-available', {
        version: '99.0.0',
        releaseDate: '2026-01-01',
        releaseNotes: 'Test release',
      })
    })

    await window.waitForTimeout(300)

    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.webContents.send('update-downloaded', {
        version: '99.0.0',
      })
    })

    await window.waitForTimeout(500)

    // The update button should be visible with success color (green)
    const updateBtn = window.locator('[data-testid="update-btn"]')
    await expect(updateBtn).toBeVisible({ timeout: 5000 })

    // Check the button has the success color class (restart state)
    const btnClasses = await updateBtn.getAttribute('class')
    expect(btnClasses).toContain('text-success')
  })
})
