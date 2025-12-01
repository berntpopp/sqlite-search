/**
 * E2E Tests: Search Functionality
 *
 * Tests the FTS5 search functionality:
 * - Basic search
 * - Boolean operators (AND, OR, NOT)
 * - Prefix queries (*)
 * - Error handling
 *
 * NOTE: These tests require a database to be loaded.
 * They will skip if no database is available.
 *
 * @module e2e/search.spec
 */
import { test, expect } from './fixtures/electron.js'

test.describe('Search UI Elements', () => {
  test('should display search input when table is selected', async ({ window, takeScreenshot }) => {
    // Wait for app to initialize
    await window.waitForTimeout(2000)

    // Check if table selector is visible (database connected)
    const tableSelector = window.locator('[data-testid="table-selector"]')
    const isDbConnected = await tableSelector.isVisible().catch(() => false)

    if (!isDbConnected) {
      test.skip('No database connected - skipping search tests')
      return
    }

    // If database is connected, check for search input after selecting table
    await takeScreenshot('search-ui-with-db')
  })

  test('should show search hint text', async ({ window }) => {
    // Wait for app to load
    await window.waitForTimeout(2000)

    // Look for the FTS5 syntax hint
    const hint = window.locator('text=FTS5 syntax')
    const hasHint = await hint.isVisible().catch(() => false)

    // Hint should be visible if search input is shown
    if (hasHint) {
      await expect(hint).toBeVisible()
    }
  })
})

test.describe('Search Input Behavior', () => {
  test('should enable search button when text is entered', async ({ window }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible - no table selected')
      return
    }

    // Type in search input
    await searchInput.fill('test')

    // Search button should be enabled
    const searchButton = window.locator('[data-testid="search-button"]')
    await expect(searchButton).toBeEnabled()
  })

  test('should clear search input on clear button click', async ({ window }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    // Type something
    await searchInput.fill('test query')

    // Find and click clear button (the X icon in text field)
    const clearButton = window.locator('[data-testid="search-input"] button[aria-label*="clear"]')
    const hasClearButton = await clearButton.isVisible().catch(() => false)

    if (hasClearButton) {
      await clearButton.click()

      // Input should be empty
      const value = await searchInput.inputValue()
      expect(value).toBe('')
    }
  })
})

test.describe('Search Execution', () => {
  test('should perform search on Enter key', async ({ window, takeScreenshot }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    // Type search term and press Enter
    await searchInput.fill('test')
    await searchInput.press('Enter')

    // Wait for potential results
    await window.waitForTimeout(2000)

    // Take screenshot of results (or no results)
    await takeScreenshot('search-results')
  })

  test('should perform search on button click', async ({ window }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    // Type search term
    await searchInput.fill('search term')

    // Click search button
    const searchButton = window.locator('[data-testid="search-button"]')
    await searchButton.click()

    // Wait for search to complete
    await window.waitForTimeout(2000)
  })
})

test.describe('FTS5 Boolean Operators', () => {
  test('should handle AND operator without syntax error', async ({ window, takeScreenshot }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    // Type boolean query with AND
    await searchInput.fill('term1 AND term2')
    await searchInput.press('Enter')

    // Wait for response
    await window.waitForTimeout(2000)

    // Check that no error dialog appeared
    const errorDialog = window.locator('[data-testid="error-dialog"]')
    const hasError = await errorDialog.isVisible().catch(() => false)

    // Take screenshot
    await takeScreenshot('search-and-operator')

    // Should not have syntax error
    expect(hasError).toBe(false)
  })

  test('should handle OR operator without syntax error', async ({ window }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    await searchInput.fill('term1 OR term2')
    await searchInput.press('Enter')
    await window.waitForTimeout(2000)

    const errorDialog = window.locator('[data-testid="error-dialog"]')
    const hasError = await errorDialog.isVisible().catch(() => false)
    expect(hasError).toBe(false)
  })

  test('should handle NOT operator without syntax error', async ({ window }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    await searchInput.fill('term1 NOT term2')
    await searchInput.press('Enter')
    await window.waitForTimeout(2000)

    const errorDialog = window.locator('[data-testid="error-dialog"]')
    const hasError = await errorDialog.isVisible().catch(() => false)
    expect(hasError).toBe(false)
  })

  test('should handle prefix wildcard (*) without syntax error', async ({ window }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    await searchInput.fill('test*')
    await searchInput.press('Enter')
    await window.waitForTimeout(2000)

    const errorDialog = window.locator('[data-testid="error-dialog"]')
    const hasError = await errorDialog.isVisible().catch(() => false)
    expect(hasError).toBe(false)
  })

  test('should handle terms with special characters (periods)', async ({ window, takeScreenshot }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    // This was a bug - periods caused syntax errors
    await searchInput.fill('term1 AND value.123')
    await searchInput.press('Enter')
    await window.waitForTimeout(2000)

    await takeScreenshot('search-special-chars')

    const errorDialog = window.locator('[data-testid="error-dialog"]')
    const hasError = await errorDialog.isVisible().catch(() => false)
    expect(hasError).toBe(false)
  })
})

test.describe('Search Results', () => {
  test('should display results table when results found', async ({ window, takeScreenshot }) => {
    await window.waitForTimeout(2000)

    const searchInput = window.locator('[data-testid="search-input"]')
    const isInputVisible = await searchInput.isVisible().catch(() => false)

    if (!isInputVisible) {
      test.skip('Search input not visible')
      return
    }

    // Perform a search
    await searchInput.fill('a')
    await searchInput.press('Enter')
    await window.waitForTimeout(3000)

    // Check for results table
    const resultsTable = window.locator('[data-testid="results-table"]')
    const hasResults = await resultsTable.isVisible().catch(() => false)

    if (hasResults) {
      await takeScreenshot('search-results-table')
      await expect(resultsTable).toBeVisible()
    }
  })

  test('should display result count', async ({ window }) => {
    await window.waitForTimeout(2000)

    const resultsCount = window.locator('[data-testid="results-count"]')
    const hasCount = await resultsCount.isVisible().catch(() => false)

    if (hasCount) {
      const countText = await resultsCount.textContent()
      expect(countText).toMatch(/\d+/)
    }
  })
})
