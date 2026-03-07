/**
 * Playwright Configuration for Electron E2E Testing
 *
 * IMPORTANT: Run E2E tests in PowerShell on Windows, NOT in WSL2.
 * Electron requires a display server which WSL2 doesn't reliably provide.
 *
 * Usage (PowerShell):
 *   pnpm run test:e2e          # Run all E2E tests
 *   pnpm run test:e2e:headed   # Run with visible window
 *   pnpm run test:e2e:ui       # Interactive UI mode
 *   pnpm run test:e2e:debug    # Debug mode with inspector
 *
 * @see https://playwright.dev/docs/api/class-electron
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Test file pattern
  testMatch: '**/*.spec.js',

  // Timeout for each test (Electron apps can be slow to start)
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests (more retries on CI)
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers (Electron tests should run sequentially)
  workers: 1,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'e2e-results/results.json' }],
  ],

  // Output directory for test artifacts
  outputDir: 'e2e-results/',

  // Global setup/teardown
  use: {
    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Capture trace on failure (for trace.playwright.dev)
    trace: 'retain-on-failure',

    // Action timeout
    actionTimeout: 15000,
  },

  // Projects can be used for different configurations
  projects: [
    {
      name: 'electron',
      testDir: './tests/e2e',
    },
  ],
})
