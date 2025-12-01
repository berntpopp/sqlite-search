/**
 * Comprehensive E2E Screenshot Tests for sqlite-search
 *
 * Generates screenshots of all UI states for documentation and visual regression testing.
 * Tests all menu items, FAQ sections, search features, and UI states.
 *
 * Run in PowerShell (NOT WSL2):
 *   pnpm run build && pnpm run test:e2e:screenshots
 */
import { test as base, _electron } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Paths
const ROOT_DIR = path.resolve(__dirname, '../..')
const TEST_DB_PATH = path.join(__dirname, 'test-data', 'test.db')
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'e2e-results', 'screenshots')

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

/**
 * Check if build files exist
 */
function checkBuildExists() {
  const mainPath = path.join(ROOT_DIR, 'dist-electron', 'main', 'index.js')
  const rendererPath = path.join(ROOT_DIR, 'dist-electron', 'renderer', 'index.html')

  console.log('Checking build files...')
  console.log(`   Main JS: ${mainPath} - ${fs.existsSync(mainPath) ? '✅' : '❌'}`)
  console.log(`   Renderer: ${rendererPath} - ${fs.existsSync(rendererPath) ? '✅' : '❌'}`)

  return fs.existsSync(mainPath) && fs.existsSync(rendererPath)
}

/**
 * Custom test fixture
 */
const test = base.extend({
  electronApp: async ({}, use) => {
    if (!checkBuildExists()) {
      throw new Error('Build files not found. Run: pnpm run build')
    }

    const mainPath = path.join(ROOT_DIR, 'dist-electron', 'main', 'index.js')
    console.log(`🚀 Launching Electron app with test DB: ${TEST_DB_PATH}`)

    const electronApp = await _electron.launch({
      args: [mainPath],
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SQLITE_SEARCH_TEST_DB: TEST_DB_PATH,
      },
    })

    await use(electronApp)
    await electronApp.close()
  },

  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow()

    // Resize to consistent size
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        win.setSize(1400, 900)
        win.center()
      }
    })

    // Wait for app to be ready
    await window.waitForLoadState('domcontentloaded')
    await window.waitForSelector('.v-application', { timeout: 30000 })
    await window.waitForTimeout(2000)

    // Wait for database to load
    const tableSelector = window.locator('[data-testid="table-selector"]')
    await tableSelector.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
      console.log('⚠️ Table selector not visible - database may not have loaded')
    })

    await use(window)
  },
})

// ============================================================================
// HELPERS
// ============================================================================

async function screenshot(window, name, description = '') {
  await window.waitForTimeout(300)
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`)
  await window.screenshot({ path: filepath })
  console.log(`📸 ${name}: ${description}`)
  return filepath
}

async function setupForSearch(window) {
  const tableSelector = window.locator('[data-testid="table-selector"]')
  if (await tableSelector.isVisible().catch(() => false)) {
    await tableSelector.click()
    await window.waitForTimeout(500)
    const firstTable = window.locator('.v-list-item').first()
    if (await firstTable.isVisible().catch(() => false)) {
      await firstTable.click()
      await window.waitForTimeout(1500)
    }
  }
}

async function performSearch(window, term) {
  const searchInput = window.locator('[data-testid="search-input"] input')
  const searchButton = window.locator('[data-testid="search-button"]')
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(term)
    await searchButton.click()
    await window.waitForTimeout(2000)
  }
}

// ============================================================================
// SCREENSHOT TESTS
// ============================================================================

test.describe('Complete UI Screenshot Tour', () => {
  test.describe.configure({ mode: 'serial' })

  // --------------------------------------------------------------------------
  // 1. INITIAL STATE & HEADER
  // --------------------------------------------------------------------------

  test('01 - Initial App State', async ({ window }) => {
    await screenshot(window, '01-app-initial', 'Application initial state with database loaded')
  })

  test('02 - Header Controls', async ({ window }) => {
    // Database button
    await screenshot(window, '02a-header-database-btn', 'Database selection button showing filename')

    // History button (hover)
    const historyBtn = window.locator('button:has(.mdi-history)').first()
    if (await historyBtn.isVisible().catch(() => false)) {
      await historyBtn.hover()
      await window.waitForTimeout(500)
      await screenshot(window, '02b-header-history-btn', 'History button with tooltip')
    }

    // Auto-select TEXT toggle
    const textToggle = window.locator('button:has(.mdi-format-text)').first()
    if (await textToggle.isVisible().catch(() => false)) {
      await textToggle.hover()
      await window.waitForTimeout(500)
      await screenshot(window, '02c-header-text-toggle', 'Auto-select TEXT columns toggle')
    }

    // Theme toggle
    const themeBtn = window.locator('button:has(.mdi-weather-sunny), button:has(.mdi-weather-night)').first()
    if (await themeBtn.isVisible().catch(() => false)) {
      await themeBtn.hover()
      await window.waitForTimeout(500)
      await screenshot(window, '02d-header-theme-btn', 'Theme toggle button')
    }

    // Reset button
    const resetBtn = window.locator('button:has(.mdi-refresh)').first()
    if (await resetBtn.isVisible().catch(() => false)) {
      await resetBtn.hover()
      await window.waitForTimeout(500)
      await screenshot(window, '02e-header-reset-btn', 'Reset application state button')
    }
  })

  // --------------------------------------------------------------------------
  // 2. HELP DIALOG & ALL FAQ ITEMS
  // --------------------------------------------------------------------------

  test('03 - Help Dialog & All FAQ Items', async ({ window }) => {
    // Open help dialog
    const helpBtn = window.locator('button:has-text("Help")')
    await helpBtn.click()
    await window.waitForTimeout(800)
    await screenshot(window, '03a-help-dialog', 'Help dialog opened')

    // Expand and screenshot each FAQ item (8 total)
    const faqItems = [
      'What is SQLite Search?',
      'Getting Started',
      'Database Requirements',
      'Search Syntax (FTS5)',
      'Using Results',
      'Theme & Preferences',
      'Troubleshooting',
      'About & License',
    ]

    for (let i = 0; i < faqItems.length; i++) {
      const itemTitle = faqItems[i]
      const item = window.locator(`.v-expansion-panel:has-text("${itemTitle}")`)
      if (await item.isVisible().catch(() => false)) {
        await item.click()
        await window.waitForTimeout(500)
        await screenshot(window, `03-faq-${i + 1}-${itemTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, `FAQ: ${itemTitle}`)
      }
    }

    // Close dialog
    await window.keyboard.press('Escape')
    await window.waitForTimeout(500)
  })

  // --------------------------------------------------------------------------
  // 3. THEME TOGGLE (DARK MODE)
  // --------------------------------------------------------------------------

  test('04 - Dark Mode Theme', async ({ window }) => {
    // Toggle to dark mode
    const themeBtn = window.locator('button:has(.mdi-weather-sunny), button:has(.mdi-weather-night)').first()
    if (await themeBtn.isVisible().catch(() => false)) {
      await themeBtn.click()
      await window.waitForTimeout(800)
      await screenshot(window, '04a-dark-mode', 'Application in dark mode')

      // Show help dialog in dark mode
      const helpBtn = window.locator('button:has-text("Help")')
      await helpBtn.click()
      await window.waitForTimeout(800)
      await screenshot(window, '04b-dark-mode-help', 'Help dialog in dark mode')
      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)

      // Setup search to capture modals in dark mode
      await setupForSearch(window)
      await performSearch(window, 'BRCA')

      // Row Detail Dialog in dark mode
      const viewBtn = window.locator('[data-testid="results-table"] button:has(.mdi-eye)').first()
      if (await viewBtn.isVisible().catch(() => false)) {
        await viewBtn.click()
        await window.waitForTimeout(800)
        await screenshot(window, '04c-dark-mode-detail-dialog', 'Row detail dialog in dark mode')
        await window.keyboard.press('Escape')
        await window.waitForTimeout(500)
      }

      // Column Management Dialog in dark mode
      const columnsBtn = window.locator('[data-testid="results-card"] button:has-text("Columns")')
      if (await columnsBtn.isVisible().catch(() => false)) {
        await columnsBtn.click()
        await window.waitForTimeout(800)
        await screenshot(window, '04d-dark-mode-column-mgmt', 'Column management dialog in dark mode')
        await window.keyboard.press('Escape')
        await window.waitForTimeout(500)
      }

      // History drawer in dark mode
      const historyBtn = window.locator('button:has(.mdi-history)').first()
      if (await historyBtn.isVisible().catch(() => false)) {
        await historyBtn.click()
        await window.waitForTimeout(800)
        await screenshot(window, '04e-dark-mode-history', 'History drawer in dark mode')
        await window.keyboard.press('Escape')
        await window.waitForTimeout(500)
      }

      // Toggle back to light mode
      await themeBtn.click()
      await window.waitForTimeout(500)
    }
  })

  // --------------------------------------------------------------------------
  // 4. TABLE & COLUMN SELECTORS
  // --------------------------------------------------------------------------

  test('05 - Table Selector', async ({ window }) => {
    await screenshot(window, '05a-table-selector-initial', 'Table selector initial state')

    const tableSelector = window.locator('[data-testid="table-selector"]')
    if (await tableSelector.isVisible().catch(() => false)) {
      await tableSelector.click()
      await window.waitForTimeout(500)
      await screenshot(window, '05b-table-selector-open', 'Table selector dropdown open (genes_fts, variants_fts)')

      // Select genes_fts
      const genesTable = window.locator('.v-list-item:has-text("genes_fts")')
      if (await genesTable.isVisible().catch(() => false)) {
        await genesTable.click()
        await window.waitForTimeout(1500)
        await screenshot(window, '05c-table-genes-selected', 'genes_fts table selected')
      }
    }
  })

  test('06 - Column Selector', async ({ window }) => {
    await setupForSearch(window)

    const columnSelector = window.locator('[data-testid="column-selector"]')
    if (await columnSelector.isVisible().catch(() => false)) {
      await screenshot(window, '06a-column-selector-filled', 'Column selector with columns auto-selected')

      await columnSelector.click()
      await window.waitForTimeout(500)
      await screenshot(window, '06b-column-selector-dropdown', 'Column selector dropdown open')

      // Look for quick action buttons
      const selectAllBtn = window.locator('button:has-text("All"), button:has(.mdi-select-all)')
      if (await selectAllBtn.isVisible().catch(() => false)) {
        await screenshot(window, '06c-column-quick-actions', 'Column quick action buttons')
      }

      await window.keyboard.press('Escape')
      await window.waitForTimeout(300)
    }
  })

  // --------------------------------------------------------------------------
  // 5. SEARCH INPUT & FTS5 SYNTAX
  // --------------------------------------------------------------------------

  test('07 - Search Input & FTS5 Syntax', async ({ window }) => {
    await setupForSearch(window)

    const searchInput = window.locator('[data-testid="search-input"] input')
    if (await searchInput.isVisible().catch(() => false)) {
      await screenshot(window, '07a-search-empty', 'Empty search input with FTS5 syntax hint')

      // Simple search
      await searchInput.fill('BRCA1')
      await screenshot(window, '07b-search-simple', 'Simple search term: BRCA1')

      // Boolean AND
      await searchInput.fill('BRCA1 AND repair')
      await screenshot(window, '07c-search-and', 'Boolean AND: BRCA1 AND repair')

      // Boolean OR
      await searchInput.fill('TP53 OR EGFR')
      await screenshot(window, '07d-search-or', 'Boolean OR: TP53 OR EGFR')

      // Boolean NOT
      await searchInput.fill('cancer NOT benign')
      await screenshot(window, '07e-search-not', 'Boolean NOT: cancer NOT benign')

      // Prefix wildcard
      await searchInput.fill('BRCA*')
      await screenshot(window, '07f-search-wildcard', 'Prefix wildcard: BRCA*')

      // Phrase search
      await searchInput.fill('"tumor suppressor"')
      await screenshot(window, '07g-search-phrase', 'Exact phrase: "tumor suppressor"')
    }
  })

  // --------------------------------------------------------------------------
  // 6. SEARCH RESULTS
  // --------------------------------------------------------------------------

  test('08 - Search Execution & Results', async ({ window }) => {
    await setupForSearch(window)

    // Search for BRCA (should match BRCA1 and BRCA2)
    await performSearch(window, 'BRCA')
    await screenshot(window, '08a-search-results', 'Search results for BRCA (2 genes)')

    // Results table
    const resultsTable = window.locator('[data-testid="results-table"]')
    if (await resultsTable.isVisible().catch(() => false)) {
      await screenshot(window, '08b-results-table', 'Results table with gene data')
    }
  })

  test('09 - Second Table (variants_fts)', async ({ window }) => {
    // Select variants table
    const tableSelector = window.locator('[data-testid="table-selector"]')
    if (await tableSelector.isVisible().catch(() => false)) {
      await tableSelector.click()
      await window.waitForTimeout(500)

      const variantsTable = window.locator('.v-list-item:has-text("variants_fts")')
      if (await variantsTable.isVisible().catch(() => false)) {
        await variantsTable.click()
        await window.waitForTimeout(1500)
        await screenshot(window, '09a-variants-table', 'variants_fts table selected')

        // Search for pathogenic variants
        await performSearch(window, 'Pathogenic')
        await screenshot(window, '09b-variants-results', 'Pathogenic variants search results')
      }
    }
  })

  // --------------------------------------------------------------------------
  // 7. ROW INTERACTIONS & MODALS
  // --------------------------------------------------------------------------

  test('10 - Row Detail Dialog', async ({ window }) => {
    await setupForSearch(window)
    await performSearch(window, 'BRCA1')

    // Click view details on first row
    const viewBtn = window.locator('[data-testid="results-table"] button:has(.mdi-eye)').first()
    if (await viewBtn.isVisible().catch(() => false)) {
      await viewBtn.click()
      await window.waitForTimeout(800)
      await screenshot(window, '10a-row-detail-dialog', 'Row detail dialog showing full record')

      // Scroll down to show more fields if available
      const dialogContent = window.locator('.v-dialog .v-card-text')
      if (await dialogContent.isVisible().catch(() => false)) {
        await dialogContent.evaluate(el => el.scrollTop = 200)
        await window.waitForTimeout(300)
        await screenshot(window, '10b-row-detail-scrolled', 'Row detail dialog scrolled to show more fields')
      }

      // Hover copy field button
      const copyFieldBtn = window.locator('.v-dialog button:has(.mdi-content-copy)').first()
      if (await copyFieldBtn.isVisible().catch(() => false)) {
        await copyFieldBtn.hover()
        await window.waitForTimeout(500)
        await screenshot(window, '10c-row-detail-copy-hover', 'Row detail dialog with copy field tooltip')
      }

      // Show Copy All button
      const copyAllBtn = window.locator('.v-dialog button:has-text("Copy All")')
      if (await copyAllBtn.isVisible().catch(() => false)) {
        await copyAllBtn.hover()
        await window.waitForTimeout(500)
        await screenshot(window, '10d-row-detail-copy-all', 'Row detail dialog Copy All as JSON button')
      }

      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)
    }
  })

  test('11 - Copy Row Action', async ({ window }) => {
    await setupForSearch(window)
    await performSearch(window, 'BRCA1')

    // Click copy on first row
    const copyBtn = window.locator('[data-testid="results-table"] button:has(.mdi-content-copy)').first()
    if (await copyBtn.isVisible().catch(() => false)) {
      await copyBtn.click()
      await window.waitForTimeout(800)
      await screenshot(window, '11a-copy-action', 'Copy action with snackbar notification')
    }
  })

  // --------------------------------------------------------------------------
  // 7b. COLUMN MANAGEMENT DIALOG
  // --------------------------------------------------------------------------

  test('11b - Column Management Dialog', async ({ window }) => {
    await setupForSearch(window)
    await performSearch(window, 'BRCA')

    // Click Columns button in results table header
    const columnsBtn = window.locator('[data-testid="results-card"] button:has-text("Columns")')
    if (await columnsBtn.isVisible().catch(() => false)) {
      await columnsBtn.click()
      await window.waitForTimeout(800)
      await screenshot(window, '11b-column-management-dialog', 'Column management dialog showing all columns')

      // Hover Show All button
      const showAllBtn = window.locator('.v-dialog button:has-text("Show All")')
      if (await showAllBtn.isVisible().catch(() => false)) {
        await showAllBtn.hover()
        await window.waitForTimeout(300)
        await screenshot(window, '11c-column-mgmt-show-all', 'Column management Show All button')
      }

      // Toggle a column visibility (uncheck first column)
      const firstCheckbox = window.locator('.v-dialog .v-checkbox').first()
      if (await firstCheckbox.isVisible().catch(() => false)) {
        await firstCheckbox.click()
        await window.waitForTimeout(500)
        await screenshot(window, '11d-column-mgmt-hidden', 'Column management with one column hidden')

        // Re-enable it
        await firstCheckbox.click()
        await window.waitForTimeout(300)
      }

      // Test reorder buttons
      const moveDownBtn = window.locator('.v-dialog button:has(.mdi-chevron-down)').first()
      if (await moveDownBtn.isVisible().catch(() => false)) {
        await moveDownBtn.hover()
        await window.waitForTimeout(500)
        await screenshot(window, '11e-column-mgmt-reorder', 'Column management reorder buttons with tooltip')
      }

      // Scroll column list if many columns
      const columnList = window.locator('.v-dialog .column-list')
      if (await columnList.isVisible().catch(() => false)) {
        await columnList.evaluate(el => el.scrollTop = 100)
        await window.waitForTimeout(300)
        await screenshot(window, '11f-column-mgmt-scrolled', 'Column management dialog scrolled')
      }

      // Close dialog
      const doneBtn = window.locator('.v-dialog button:has-text("Done")')
      if (await doneBtn.isVisible().catch(() => false)) {
        await doneBtn.click()
        await window.waitForTimeout(500)
      } else {
        await window.keyboard.press('Escape')
        await window.waitForTimeout(500)
      }
    }
  })

  // --------------------------------------------------------------------------
  // 7c. COLUMN FILTER POPUP
  // --------------------------------------------------------------------------

  test('11c - Column Filter Popup', async ({ window }) => {
    await setupForSearch(window)
    await performSearch(window, 'BRCA')

    // Click filter icon on first column header
    const filterBtn = window.locator('[data-testid="results-table"] .v-data-table__th button:has(.mdi-filter-outline)').first()
    if (await filterBtn.isVisible().catch(() => false)) {
      await filterBtn.click()
      await window.waitForTimeout(500)
      await screenshot(window, '11g-column-filter-popup', 'Column filter popup menu')

      // Type in filter input
      const filterInput = window.locator('.v-menu .v-text-field input')
      if (await filterInput.isVisible().catch(() => false)) {
        await filterInput.fill('BRCA1')
        await window.waitForTimeout(500)
        await screenshot(window, '11h-column-filter-active', 'Column filter with active filter value')
      }

      // Close filter popup
      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)

      // Show filtered results
      await screenshot(window, '11i-column-filter-results', 'Results table with active column filter')

      // Clear filter button if visible
      const clearFilterBtn = window.locator('[data-testid="results-card"] button:has-text("Clear Filters")')
      if (await clearFilterBtn.isVisible().catch(() => false)) {
        await screenshot(window, '11j-clear-filter-btn', 'Clear Filters button visible in header')
      }
    }
  })

  // --------------------------------------------------------------------------
  // 8. SEARCH HISTORY
  // --------------------------------------------------------------------------

  test('12 - Search History Drawer', async ({ window }) => {
    await setupForSearch(window)

    // Perform a few searches to populate history
    await performSearch(window, 'BRCA1')
    await performSearch(window, 'TP53')
    await performSearch(window, 'tumor')

    // Open history drawer
    const historyBtn = window.locator('button:has(.mdi-history)').first()
    if (await historyBtn.isVisible().catch(() => false)) {
      await historyBtn.click()
      await window.waitForTimeout(800)
      await screenshot(window, '12a-history-drawer', 'Search history drawer - All tab')

      // Star/favorite a search entry
      const starBtn = window.locator('.v-navigation-drawer button:has(.mdi-star-outline)').first()
      if (await starBtn.isVisible().catch(() => false)) {
        await starBtn.click()
        await window.waitForTimeout(500)
        await screenshot(window, '12b-history-starred', 'History entry starred as favorite')
      }

      // Click Favorites tab
      const favoritesTab = window.locator('.v-navigation-drawer .v-tab:has-text("Favorites")')
      if (await favoritesTab.isVisible().catch(() => false)) {
        await favoritesTab.click()
        await window.waitForTimeout(500)
        await screenshot(window, '12c-history-favorites-tab', 'History drawer - Favorites tab')
      }

      // Back to All tab
      const allTab = window.locator('.v-navigation-drawer .v-tab:has-text("All")')
      if (await allTab.isVisible().catch(() => false)) {
        await allTab.click()
        await window.waitForTimeout(500)
      }

      // Hover restore button
      const restoreBtn = window.locator('.v-navigation-drawer button:has-text("Restore")').first()
      if (await restoreBtn.isVisible().catch(() => false)) {
        await restoreBtn.hover()
        await window.waitForTimeout(500)
        await screenshot(window, '12d-history-restore-hover', 'History entry with Restore button hover')
      }

      // Close drawer
      await window.keyboard.press('Escape')
      await window.waitForTimeout(500)
    }
  })

  // --------------------------------------------------------------------------
  // 9. SPECIAL STATES
  // --------------------------------------------------------------------------

  test('13 - No Results State', async ({ window }) => {
    await setupForSearch(window)
    await performSearch(window, 'xyznonexistent12345')
    await screenshot(window, '13a-no-results', 'No results found state')
  })

  test('14 - Error State', async ({ window }) => {
    await setupForSearch(window)

    const searchInput = window.locator('[data-testid="search-input"] input')
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('((invalid syntax')
      await window.locator('[data-testid="search-button"]').click()
      await window.waitForTimeout(2000)
      await screenshot(window, '14a-error-state', 'FTS5 syntax error state')
    }
  })

  // --------------------------------------------------------------------------
  // 10. RESET APPLICATION STATE
  // --------------------------------------------------------------------------

  test('15 - Reset Application State', async ({ window }) => {
    await setupForSearch(window)
    await performSearch(window, 'BRCA')
    await screenshot(window, '15a-before-reset', 'State before reset (with results)')

    const resetBtn = window.locator('button:has(.mdi-refresh)').first()
    if (await resetBtn.isVisible().catch(() => false)) {
      await resetBtn.click()
      await window.waitForTimeout(1500)
      await screenshot(window, '15b-after-reset', 'State after reset (cleared)')
    }
  })

  // --------------------------------------------------------------------------
  // 11. FINAL OVERVIEW
  // --------------------------------------------------------------------------

  test('16 - Final Overview', async ({ window }) => {
    await setupForSearch(window)
    await performSearch(window, 'DNA repair')
    await screenshot(window, '16-final-overview', 'Final application overview with search results')
  })
})

test.afterAll(async () => {
  console.log('')
  console.log('=' .repeat(60))
  console.log('📸 Screenshot generation complete!')
  console.log(`   Location: ${SCREENSHOTS_DIR}`)
  console.log('=' .repeat(60))
})
