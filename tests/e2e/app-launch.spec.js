/**
 * E2E Tests: Application Launch
 *
 * Tests the basic application launch functionality:
 * - Window opens correctly
 * - Title is displayed
 * - Main UI elements are visible
 *
 * @module e2e/app-launch.spec
 */
import { test, expect } from './fixtures/electron.js'

test.describe('Application Launch', () => {
  test('should launch and display main window', async ({ window, takeScreenshot }) => {
    // Verify the window is visible
    const isVisible = await window.isVisible()
    expect(isVisible).toBe(true)

    // Verify title contains app name
    const title = await window.title()
    expect(title.toLowerCase()).toContain('sqlite')

    // Take a screenshot of the launched app
    await takeScreenshot('app-launch')
  })

  test('should display app header', async ({ window }) => {
    // Wait for the app to be ready
    await window.waitForSelector('.v-app-bar', { timeout: 10000 })

    // Verify header is visible
    const header = await window.locator('.v-app-bar')
    await expect(header).toBeVisible()
  })

  test('should show database selection prompt when no database connected', async ({ window }) => {
    // The app should prompt for database selection
    // Look for either the file dialog button or a connection message
    const fileButton = window.locator('[data-testid="select-database-btn"]')
    const noDbMessage = window.locator('text=No database')

    // Either should be present
    const hasFileButton = await fileButton.isVisible().catch(() => false)
    const hasNoDbMessage = await noDbMessage.isVisible().catch(() => false)

    // At least one indicator should be present
    expect(hasFileButton || hasNoDbMessage).toBe(true)
  })
})

test.describe('Window Controls', () => {
  test('should have correct window dimensions', async ({ window }) => {
    const size = await window.viewportSize()

    // We set 1280x800 in the fixture
    expect(size.width).toBe(1280)
    expect(size.height).toBe(800)
  })

  test('should be resizable', async ({ window, electronApp: _electronApp }) => {
    // Resize window
    await window.setViewportSize({ width: 1024, height: 768 })

    const newSize = await window.viewportSize()
    expect(newSize.width).toBe(1024)
    expect(newSize.height).toBe(768)

    // Restore original size
    await window.setViewportSize({ width: 1280, height: 800 })
  })
})
