/**
 * Comprehensive Screenshot Generator for UI Review
 *
 * This script captures screenshots of all UI states for:
 * - Visual debugging
 * - UI review
 * - Documentation
 * - Regression testing
 *
 * Usage (PowerShell):
 *   pnpm run test:e2e:setup          # Generate test database first
 *   pnpm run test:e2e:screenshots    # Run this script
 *
 * Screenshots are saved to: e2e-results/screenshots/
 *
 * @module e2e/screenshots.spec
 */
import { test as base, _electron } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '../..')
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'e2e-results', 'screenshots')
const TEST_DB_PATH = path.join(__dirname, 'test-data', 'test.db')

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

/**
 * Check if renderer build exists
 */
function checkBuildExists() {
  const rendererHtml = path.join(ROOT_DIR, 'dist-electron', 'renderer', 'index.html')
  const mainJs = path.join(ROOT_DIR, 'dist-electron', 'main', 'index.js')

  console.log('🔍 Checking build files...')
  console.log(`   Main JS: ${mainJs} - ${fs.existsSync(mainJs) ? '✅' : '❌'}`)
  console.log(`   Renderer: ${rendererHtml} - ${fs.existsSync(rendererHtml) ? '✅' : '❌'}`)

  if (!fs.existsSync(mainJs) || !fs.existsSync(rendererHtml)) {
    console.error('')
    console.error('❌ Build files not found!')
    console.error('   Run: pnpm run build')
    console.error('')
    return false
  }
  return true
}

/**
 * Custom test fixture for screenshot generation
 */
const test = base.extend({
  electronApp: async ({}, use) => {
    // Check build exists
    if (!checkBuildExists()) {
      throw new Error('Build files not found. Run: pnpm run build')
    }

    const mainPath = path.join(ROOT_DIR, 'dist-electron', 'main', 'index.js')

    console.log('🚀 Launching Electron app...')
    console.log(`   Main: ${mainPath}`)
    console.log(`   Test DB: ${TEST_DB_PATH}`)

    // Important: Set NODE_ENV to production so the app loads built files correctly
    const electronApp = await _electron.launch({
      args: [mainPath],
      env: {
        ...process.env,
        NODE_ENV: 'production',
        // Set test database path
        SQLITE_SEARCH_TEST_DB: TEST_DB_PATH,
      },
    })

    await use(electronApp)
    await electronApp.close()
  },

  window: async ({ electronApp }, use) => {
    console.log('⏳ Waiting for window...')
    const window = await electronApp.firstWindow()

    // Set viewport size (larger for better screenshots)
    await window.setViewportSize({ width: 1400, height: 900 })

    // Wait for various load states
    console.log('⏳ Waiting for DOM content...')
    await window.waitForLoadState('domcontentloaded')

    console.log('⏳ Waiting for network idle...')
    await window.waitForLoadState('networkidle').catch(() => {
      console.log('   Network idle timeout (continuing anyway)')
    })

    // Wait for Vuetify to render - look for the app container
    console.log('⏳ Waiting for Vuetify app...')
    await window.waitForSelector('.v-application', { timeout: 30000 }).catch(() => {
      console.log('   Warning: .v-application not found')
    })

    // Additional wait for Vue hydration
    console.log('⏳ Waiting for Vue hydration...')
    await window.waitForTimeout(2000)

    // Wait for database to be loaded (indicated by table selector being visible)
    console.log('⏳ Waiting for database to load...')
    const tableSelector = window.locator('[data-testid="table-selector"]')
    const welcomeScreen = window.locator('text=Welcome to SQLite Search')

    // Wait up to 10 seconds for either table selector (db loaded) or welcome screen (no db)
    await Promise.race([
      tableSelector.waitFor({ state: 'visible', timeout: 10000 }).then(() => {
        console.log('✅ Database loaded - Table selector visible')
      }),
      welcomeScreen.waitFor({ state: 'visible', timeout: 10000 }).then(() => {
        console.log('⚠️ Welcome screen shown - Database may not have loaded')
      }),
    ]).catch(() => {
      console.log('⚠️ Timeout waiting for UI state')
    })

    // Log page content for debugging
    const title = await window.title()
    console.log(`✅ Window ready - Title: "${title}"`)

    await use(window)
  },
})

/**
 * Helper to save screenshot with consistent naming
 */
async function screenshot(window, name, description = '') {
  // Small wait to ensure rendering is complete
  await window.waitForTimeout(500)

  const filename = `${name}.png`
  const filepath = path.join(SCREENSHOTS_DIR, filename)

  // Take screenshot
  await window.screenshot({ path: filepath, fullPage: false })
  console.log(`📸 ${name}: ${description || filename}`)

  return filepath
}

/**
 * Helper to wait and take screenshot
 */
async function waitAndScreenshot(window, name, description, waitMs = 500) {
  await window.waitForTimeout(waitMs)
  return screenshot(window, name, description)
}

// ============================================================================
// SCREENSHOT TESTS
// ============================================================================

test.describe('UI Screenshots - Complete Application Tour', () => {
  test.describe.configure({ mode: 'serial' })

  test('00 - Debug Window State', async ({ window }) => {
    // Debug: check what's actually rendered
    const html = await window.content()
    console.log('📄 Page HTML length:', html.length)
    console.log('📄 First 500 chars:', html.substring(0, 500))

    // Check if body has content
    const bodyContent = await window.locator('body').innerHTML()
    console.log('📄 Body content length:', bodyContent.length)

    // Check for common elements
    const hasVApp = await window.locator('.v-application').count()
    console.log('🔍 .v-application count:', hasVApp)

    const hasVAppBar = await window.locator('.v-app-bar').count()
    console.log('🔍 .v-app-bar count:', hasVAppBar)

    // Wait more if needed
    if (hasVApp === 0) {
      console.log('⏳ Waiting additional 5 seconds for app to load...')
      await window.waitForTimeout(5000)
    }
  })

  test('01 - Initial Launch State', async ({ window }) => {
    await screenshot(window, '01-initial-launch', 'Application just launched')
  })

  test('02 - App Header and Navigation', async ({ window }) => {
    // Capture header area
    await screenshot(window, '02-app-header', 'Application header with title and controls')

    // Click theme toggle if visible
    const themeToggle = window.locator('[data-testid="theme-toggle"], .mdi-weather-night, .mdi-weather-sunny').first()
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click()
      await waitAndScreenshot(window, '02b-theme-dark', 'Dark theme enabled')

      await themeToggle.click()
      await waitAndScreenshot(window, '02c-theme-light', 'Light theme restored')
    }
  })

  test('03 - Help/FAQ Dialog', async ({ window }) => {
    // Find and click help button
    const helpButton = window.locator('[data-testid="help-button"], .mdi-help-circle, button:has-text("Help")').first()

    if (await helpButton.isVisible().catch(() => false)) {
      await helpButton.click()
      await waitAndScreenshot(window, '03-help-dialog-open', 'Help dialog opened', 1000)

      // Try to expand FAQ sections
      const faqItems = window.locator('.v-expansion-panel')
      const faqCount = await faqItems.count()

      for (let i = 0; i < Math.min(faqCount, 5); i++) {
        const panel = faqItems.nth(i)
        const header = panel.locator('.v-expansion-panel-title')

        if (await header.isVisible().catch(() => false)) {
          await header.click()
          await waitAndScreenshot(window, `03-faq-item-${i + 1}`, `FAQ item ${i + 1} expanded`, 300)
        }
      }

      // Close help dialog
      const closeButton = window.locator('.v-dialog button:has-text("Close"), .v-dialog .mdi-close').first()
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click()
        await window.waitForTimeout(500)
      } else {
        // Press Escape to close
        await window.keyboard.press('Escape')
        await window.waitForTimeout(500)
      }
    }
  })

  test('04 - Database Selection', async ({ window }) => {
    // Look for file dialog button or database selector
    const selectDbButton = window.locator('[data-testid="select-database-btn"], button:has-text("Select Database"), button:has-text("Open"), .mdi-folder-open').first()

    if (await selectDbButton.isVisible().catch(() => false)) {
      await screenshot(window, '04-database-selector', 'Database selection button visible')
    }

    // Check if database path is shown
    const dbPath = window.locator('[data-testid="database-path"], .database-path')
    if (await dbPath.isVisible().catch(() => false)) {
      await screenshot(window, '04b-database-path', 'Current database path displayed')
    }
  })

  test('05 - Table Selector', async ({ window }) => {
    const tableSelector = window.locator('[data-testid="table-selector"]')

    if (await tableSelector.isVisible().catch(() => false)) {
      await screenshot(window, '05-table-selector-closed', 'Table selector (closed)')

      // Click to open dropdown
      await tableSelector.click()
      await waitAndScreenshot(window, '05b-table-selector-open', 'Table selector dropdown open', 500)

      // Select first table if available
      const firstOption = window.locator('.v-list-item').first()
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click()
        await waitAndScreenshot(window, '05c-table-selected', 'Table selected', 1000)
      }
    }
  })

  test('06 - Column Selector', async ({ window }) => {
    const columnSelector = window.locator('[data-testid="column-selector"]')

    if (await columnSelector.isVisible().catch(() => false)) {
      await screenshot(window, '06-column-selector-closed', 'Column selector (closed)')

      // Click to open
      await columnSelector.click()
      await waitAndScreenshot(window, '06b-column-selector-open', 'Column selector dropdown open', 500)

      // Look for quick action buttons
      const textOnlyBtn = window.locator('button:has-text("TEXT Only")')
      if (await textOnlyBtn.isVisible().catch(() => false)) {
        await screenshot(window, '06c-column-quick-actions', 'Column quick action buttons')
      }

      // Select columns
      const columnItems = window.locator('.v-list-item')
      const colCount = await columnItems.count()
      for (let i = 0; i < Math.min(colCount, 3); i++) {
        const item = columnItems.nth(i)
        if (await item.isVisible().catch(() => false)) {
          await item.click()
          await window.waitForTimeout(200)
        }
      }

      // Click outside to close
      await window.keyboard.press('Escape')
      await waitAndScreenshot(window, '06d-columns-selected', 'Columns selected', 500)
    }
  })

  test('07 - Search Input States', async ({ window }) => {
    const searchInput = window.locator('[data-testid="search-input"]')

    if (await searchInput.isVisible().catch(() => false)) {
      await screenshot(window, '07-search-input-empty', 'Empty search input with hint')

      // Type a search term
      await searchInput.fill('BRCA1')
      await screenshot(window, '07b-search-input-filled', 'Search input with text')

      // Clear and show different queries
      await searchInput.fill('BRCA1 AND NM_007294.4')
      await screenshot(window, '07c-search-boolean-and', 'Boolean AND query')

      await searchInput.fill('TP53 OR EGFR')
      await screenshot(window, '07d-search-boolean-or', 'Boolean OR query')

      await searchInput.fill('cancer NOT benign')
      await screenshot(window, '07e-search-boolean-not', 'Boolean NOT query')

      await searchInput.fill('BRCA*')
      await screenshot(window, '07f-search-prefix', 'Prefix wildcard query')
    }
  })

  test('08 - Search Execution and Results', async ({ window }) => {
    const searchInput = window.locator('[data-testid="search-input"]')
    const searchButton = window.locator('[data-testid="search-button"]')

    if (await searchInput.isVisible().catch(() => false)) {
      // Perform a search that should return results
      await searchInput.fill('BRCA')
      await searchButton.click()
      await waitAndScreenshot(window, '08-search-loading', 'Search in progress', 500)

      // Wait for results
      await window.waitForTimeout(2000)
      await screenshot(window, '08b-search-results', 'Search results displayed')

      // Check results table
      const resultsTable = window.locator('[data-testid="results-table"]')
      if (await resultsTable.isVisible().catch(() => false)) {
        await screenshot(window, '08c-results-table', 'Results table with data')
      }

      // Check results count
      const resultsCount = window.locator('[data-testid="results-count"]')
      if (await resultsCount.isVisible().catch(() => false)) {
        await screenshot(window, '08d-results-count', 'Results count indicator')
      }
    }
  })

  test('09 - Results Table Interactions', async ({ window }) => {
    const resultsCard = window.locator('[data-testid="results-card"]')

    if (await resultsCard.isVisible().catch(() => false)) {
      // Column sorting
      const sortableHeader = window.locator('.v-data-table th').first()
      if (await sortableHeader.isVisible().catch(() => false)) {
        await sortableHeader.click()
        await waitAndScreenshot(window, '09-results-sorted', 'Results sorted by column')
      }

      // Column filtering
      const filterButton = window.locator('.v-data-table th .mdi-filter, .v-data-table th .mdi-filter-outline').first()
      if (await filterButton.isVisible().catch(() => false)) {
        await filterButton.click()
        await waitAndScreenshot(window, '09b-column-filter-menu', 'Column filter menu open', 500)

        // Type in filter
        const filterInput = window.locator('.v-menu .v-text-field input').first()
        if (await filterInput.isVisible().catch(() => false)) {
          await filterInput.fill('pathogenic')
          await waitAndScreenshot(window, '09c-column-filter-active', 'Column filter active', 500)
        }

        await window.keyboard.press('Escape')
      }

      // Pagination
      const pagination = window.locator('.v-data-table-footer')
      if (await pagination.isVisible().catch(() => false)) {
        await screenshot(window, '09d-pagination', 'Results pagination controls')
      }
    }
  })

  test('10 - Row Detail Dialog', async ({ window }) => {
    // Click view details button on first row
    const viewDetailsBtn = window.locator('[data-testid="results-table"] .mdi-eye, button:has(.mdi-eye)').first()

    if (await viewDetailsBtn.isVisible().catch(() => false)) {
      await viewDetailsBtn.click()
      await waitAndScreenshot(window, '10-row-detail-dialog', 'Row detail dialog open', 1000)

      // Close dialog
      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)
    }
  })

  test('11 - Copy Row Action', async ({ window }) => {
    // Click copy button on first row
    const copyBtn = window.locator('[data-testid="results-table"] .mdi-content-copy, button:has(.mdi-content-copy)').first()

    if (await copyBtn.isVisible().catch(() => false)) {
      await copyBtn.click()
      await waitAndScreenshot(window, '11-copy-action', 'Copy row action (snackbar may appear)', 500)
    }
  })

  test('12 - Clear Results', async ({ window }) => {
    const clearBtn = window.locator('[data-testid="results-card"] button:has-text("Clear")')

    if (await clearBtn.isVisible().catch(() => false)) {
      await screenshot(window, '12-before-clear', 'Before clearing results')
      await clearBtn.click()
      await waitAndScreenshot(window, '12b-after-clear', 'After clearing results', 500)
    }
  })

  test('13 - Error States', async ({ window }) => {
    const searchInput = window.locator('[data-testid="search-input"]')

    if (await searchInput.isVisible().catch(() => false)) {
      // Try to trigger an error with invalid syntax (if possible)
      await searchInput.fill('((invalid syntax')
      await window.locator('[data-testid="search-button"]').click()
      await waitAndScreenshot(window, '13-error-state', 'Error state (if any)', 2000)
    }
  })

  test('14 - Column Management', async ({ window }) => {
    // Look for column management button
    const colMgmtBtn = window.locator('button:has-text("Columns"), button:has(.mdi-table-cog)')

    if (await colMgmtBtn.isVisible().catch(() => false)) {
      await colMgmtBtn.click()
      await waitAndScreenshot(window, '14-column-management', 'Column management dialog', 1000)

      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)
    }
  })

  test('15 - Empty State', async ({ window }) => {
    // Make sure results are cleared and show empty state
    const searchInput = window.locator('[data-testid="search-input"]')

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('xyznonexistent123456')
      await window.locator('[data-testid="search-button"]').click()
      await waitAndScreenshot(window, '15-no-results', 'No results found state', 2000)
    }
  })

  test('16 - Final Overview', async ({ window }) => {
    // Reset to clean state and take final overview
    await window.reload()
    await window.waitForTimeout(3000)
    await screenshot(window, '16-final-overview', 'Final application overview')
  })
})

test.afterAll(async () => {
  console.log('')
  console.log('=' .repeat(60))
  console.log('📸 Screenshot generation complete!')
  console.log(`   Location: ${SCREENSHOTS_DIR}`)
  console.log('=' .repeat(60))
})
