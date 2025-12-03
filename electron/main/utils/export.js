/**
 * Export Utility Functions
 *
 * Generates CSV and Excel files from data arrays.
 * Used by main process IPC handlers for file export functionality.
 *
 * @module electron/main/utils/export
 */

import ExcelJS from 'exceljs'

/**
 * Export configuration constants (duplicated from renderer config for main process)
 * @constant
 */
const EXPORT_CONFIG = {
  CSV: {
    DELIMITER: ',',
    QUOTE_CHAR: '"',
    ESCAPE_CHAR: '"',
    LINE_ENDING: '\r\n',
  },
  EXCEL: {
    SHEET_NAME: 'Export',
    MAX_COL_WIDTH: 50,
    WIDTH_SAMPLE_SIZE: 100,
  },
}

/**
 * Generate CSV string from data array
 *
 * Pure function with no side effects. Handles special characters
 * (commas, quotes, newlines) according to RFC 4180.
 *
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Column names in desired order
 * @param {Object} [options] - CSV generation options
 * @param {string} [options.delimiter=','] - Field delimiter
 * @param {string} [options.quoteChar='"'] - Quote character
 * @param {string} [options.escapeChar='"'] - Escape character for quotes
 * @param {string} [options.lineEnding='\r\n'] - Line ending
 * @returns {string} CSV content string
 *
 * @example
 * const csv = generateCSV(
 *   [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }],
 *   ['name', 'age']
 * )
 * // Returns: "name,age\r\nJohn,30\r\nJane,25"
 */
export function generateCSV(data, columns, options = {}) {
  const {
    delimiter = EXPORT_CONFIG.CSV.DELIMITER,
    quoteChar = EXPORT_CONFIG.CSV.QUOTE_CHAR,
    escapeChar = EXPORT_CONFIG.CSV.ESCAPE_CHAR,
    lineEnding = EXPORT_CONFIG.CSV.LINE_ENDING,
  } = options

  /**
   * Escape a single value for CSV format
   * Handles null, undefined, and special characters
   *
   * @param {*} value - Value to escape
   * @returns {string} Escaped CSV value
   */
  const escapeValue = value => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return ''
    }

    // Convert to string
    const str = String(value)

    // Check if quoting is needed (contains delimiter, quote, newline, or carriage return)
    const needsQuoting =
      str.includes(delimiter) ||
      str.includes(quoteChar) ||
      str.includes('\n') ||
      str.includes('\r')

    if (needsQuoting) {
      // Escape internal quotes by doubling them
      const escaped = str.replace(new RegExp(quoteChar, 'g'), escapeChar + quoteChar)
      return quoteChar + escaped + quoteChar
    }

    return str
  }

  // Generate header row
  const headerRow = columns.map(escapeValue).join(delimiter)

  // Generate data rows
  const dataRows = data.map(row => columns.map(col => escapeValue(row[col])).join(delimiter))

  // Combine header and data with line endings
  return [headerRow, ...dataRows].join(lineEnding)
}

/**
 * Generate Excel workbook buffer from data array
 *
 * Uses ExcelJS to create a proper XLSX file with:
 * - Auto-calculated column widths
 * - Proper data types
 * - Single worksheet
 *
 * @param {Object[]} data - Array of row objects
 * @param {string[]} columns - Column names in desired order
 * @param {string} [sheetName='Export'] - Worksheet name
 * @returns {Promise<Buffer>} XLSX file buffer ready for writing to disk
 *
 * @example
 * const buffer = await generateExcel(
 *   [{ name: 'John', age: 30 }],
 *   ['name', 'age'],
 *   'Users'
 * )
 * fs.writeFileSync('export.xlsx', buffer)
 */
export async function generateExcel(data, columns, sheetName = EXPORT_CONFIG.EXCEL.SHEET_NAME) {
  // Create new workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'sqlite-search'
  workbook.created = new Date()

  // Add worksheet
  const worksheet = workbook.addWorksheet(sheetName)

  // Calculate optimal column widths based on content
  const columnWidths = columns.map(col => {
    let maxLen = col.length

    // Sample first N rows for width calculation (performance optimization)
    const sampleRows = data.slice(0, EXPORT_CONFIG.EXCEL.WIDTH_SAMPLE_SIZE)
    for (const row of sampleRows) {
      const cellValue = row[col]
      if (cellValue !== null && cellValue !== undefined) {
        const len = String(cellValue).length
        if (len > maxLen) {
          maxLen = len
        }
      }
    }

    // Add padding and cap at max width
    return Math.min(maxLen + 2, EXPORT_CONFIG.EXCEL.MAX_COL_WIDTH)
  })

  // Define columns with headers and widths
  worksheet.columns = columns.map((col, index) => ({
    header: col,
    key: col,
    width: columnWidths[index],
  }))

  // Style header row
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // Add data rows
  for (const row of data) {
    const rowData = {}
    for (const col of columns) {
      rowData[col] = row[col] ?? ''
    }
    worksheet.addRow(rowData)
  }

  // Generate buffer
  return workbook.xlsx.writeBuffer()
}

/**
 * Validate export parameters
 *
 * @param {Object[]} data - Data array to validate
 * @param {string[]} columns - Column array to validate
 * @param {number} maxRows - Maximum allowed rows
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateExportParams(data, columns, maxRows) {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Data must be an array' }
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    return { valid: false, error: 'Columns must be a non-empty array' }
  }

  if (data.length > maxRows) {
    return {
      valid: false,
      error: `Row count (${data.length}) exceeds maximum (${maxRows})`,
    }
  }

  return { valid: true }
}
