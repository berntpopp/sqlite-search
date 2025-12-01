/**
 * Electron Test Fixtures for Playwright
 *
 * Provides reusable fixtures for testing the Electron app:
 * - electronApp: The launched Electron application
 * - window: The main browser window
 *
 * @module e2e/fixtures/electron
 */
import { test as base, _electron } from '@playwright/test'
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')

/**
 * Extended Playwright test with Electron fixtures
 */
export const test = base.extend({
  /**
   * Electron application fixture
   * Launches the app and provides access to the ElectronApplication object
   */
  electronApp: async ({}, use) => {
    // Determine if we're testing built app or dev mode
    const useBuiltApp = process.env.TEST_BUILT_APP === 'true'

    let electronApp

    if (useBuiltApp) {
      // Test the packaged application (recommended for CI)
      const latestBuild = findLatestBuild('release')
      const appInfo = parseElectronApp(latestBuild)

      electronApp = await _electron.launch({
        executablePath: appInfo.executable,
        args: appInfo.main ? [appInfo.main] : [],
        recordVideo: {
          dir: path.join(ROOT_DIR, 'e2e-results', 'videos'),
        },
      })
    } else {
      // Test from source (faster for development)
      const mainPath = path.join(ROOT_DIR, 'dist-electron', 'main', 'index.js')

      electronApp = await _electron.launch({
        args: [mainPath],
        recordVideo: {
          dir: path.join(ROOT_DIR, 'e2e-results', 'videos'),
        },
      })
    }

    // Use the app in tests
    await use(electronApp)

    // Cleanup: close the app after tests
    await electronApp.close()
  },

  /**
   * Main window fixture
   * Waits for and provides access to the first browser window
   */
  window: async ({ electronApp }, use) => {
    // Wait for the first window to open
    const window = await electronApp.firstWindow()

    // Set a consistent viewport size for screenshots
    await window.setViewportSize({ width: 1280, height: 800 })

    // Wait for the app to be ready (Vuetify loads)
    await window.waitForLoadState('domcontentloaded')

    // Give Vue/Vuetify time to hydrate
    await window.waitForTimeout(1000)

    await use(window)
  },

  /**
   * Screenshot helper fixture
   * Provides a helper function to take screenshots with consistent naming
   */
  takeScreenshot: async ({ window }, use) => {
    const screenshots = []

    const takeScreenshot = async (name) => {
      const screenshotPath = path.join(ROOT_DIR, 'e2e-results', 'screenshots', `${name}.png`)
      await window.screenshot({ path: screenshotPath })
      screenshots.push(screenshotPath)
      return screenshotPath
    }

    await use(takeScreenshot)
  },
})

export { expect } from '@playwright/test'
