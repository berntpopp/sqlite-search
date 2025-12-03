/**
 * Export Configuration
 *
 * Centralized configuration for export-related constants.
 * Follows DRY principle by defining limits and options in one place.
 *
 * SOLID Principles:
 * - Single Responsibility: Only defines export configuration
 * - Open/Closed: Easy to extend with new format options
 * - DRY: No magic numbers scattered throughout codebase
 *
 * @module config/export.config
 */

/**
 * Export configuration constants
 * @constant
 */
export const EXPORT_CONFIG = {
  /**
   * Maximum number of rows that can be exported
   * Prevents memory exhaustion and performance issues
   * Excel max is 1,048,576 but practical limit is lower
   * @type {number}
   */
  MAX_EXPORT_ROWS: 100000,

  /**
   * Row count threshold for showing warning badge
   * Alerts users that export may take longer
   * @type {number}
   */
  WARNING_THRESHOLD: 50000,

  /**
   * Available export format options
   * @type {Object}
   */
  FORMATS: {
    CSV: {
      extension: 'csv',
      mimeType: 'text/csv',
      label: 'CSV (Comma Separated)',
      icon: 'mdi-file-delimited',
    },
    EXCEL: {
      extension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      label: 'Excel Workbook',
      icon: 'mdi-microsoft-excel',
    },
  },

  /**
   * CSV generation options
   * @type {Object}
   */
  CSV: {
    /**
     * Field delimiter character
     * @type {string}
     */
    DELIMITER: ',',

    /**
     * Quote character for wrapping fields with special chars
     * @type {string}
     */
    QUOTE_CHAR: '"',

    /**
     * Character used to escape quote characters within fields
     * @type {string}
     */
    ESCAPE_CHAR: '"',

    /**
     * Line ending for CSV files
     * Using Windows line endings for max compatibility
     * @type {string}
     */
    LINE_ENDING: '\r\n',
  },

  /**
   * Excel generation options
   * @type {Object}
   */
  EXCEL: {
    /**
     * Default worksheet name
     * @type {string}
     */
    SHEET_NAME: 'Export',

    /**
     * Maximum column width in characters
     * @type {number}
     */
    MAX_COL_WIDTH: 50,

    /**
     * Number of rows to sample for auto-width calculation
     * Limits processing time for large datasets
     * @type {number}
     */
    WIDTH_SAMPLE_SIZE: 100,
  },
}
