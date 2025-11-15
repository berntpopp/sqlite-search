/**
 * Search Configuration
 *
 * Centralized configuration for search-related constants.
 * Follows DRY principle by defining magic numbers in one place.
 *
 * SOLID Principles:
 * - Single Responsibility: Only defines search configuration
 * - Open/Closed: Easy to extend with new config values
 * - DRY: No magic numbers scattered throughout codebase
 *
 * @module config/search.config
 */

/**
 * Search configuration constants
 * @constant
 */
export const SEARCH_CONFIG = {
  /**
   * Default number of columns to auto-select when loading a table
   * Auto-selects first N columns to avoid overwhelming users with large tables
   * @type {number}
   */
  DEFAULT_COLUMN_COUNT: 5,

  /**
   * Maximum number of column chips to display before showing "N more"
   * Keeps UI compact and readable
   * @type {number}
   */
  MAX_CHIP_PREVIEW: 2,

  /**
   * Maximum number of search results to display in the results table
   * Prevents UI from becoming sluggish with very large result sets
   * @type {number}
   */
  MAX_RESULTS_DISPLAY: 1000,
}
