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

  /**
   * Default sort order for table columns
   * @type {string}
   */
  DEFAULT_SORT_ORDER: 'asc',

  /**
   * Maximum number of columns that can be sorted simultaneously
   * Prevents performance issues with complex multi-column sorting
   * @type {number}
   */
  MAX_SORT_COLUMNS: 3,

  /**
   * Minimum filter string length to trigger filtering
   * Prevents unnecessary filtering on very short strings
   * @type {number}
   */
  MIN_FILTER_LENGTH: 1,

  /**
   * Filter debounce delay in milliseconds
   * Delays filter application to improve performance during typing
   * @type {number}
   */
  FILTER_DEBOUNCE_MS: 300,

  /**
   * LocalStorage key prefix for table preferences
   * Used to namespace localStorage keys per table
   * @type {string}
   */
  STORAGE_KEY_PREFIX: 'sqlite_search',

  /**
   * Column management settings
   */
  COLUMN_MANAGEMENT: {
    /**
     * Minimum number of visible columns required
     * Prevents hiding all columns
     * @type {number}
     */
    MIN_VISIBLE_COLUMNS: 1,

    /**
     * Show column management button by default
     * @type {boolean}
     */
    SHOW_MANAGEMENT_BUTTON: true,

    /**
     * Enable column reordering
     * @type {boolean}
     */
    ENABLE_REORDERING: true,
  },
}
