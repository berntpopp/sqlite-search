/**
 * Search Utilities for Electron Main Process
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Each function does one thing
 * - Open/Closed: Extensible without modification
 * - DRY: No code duplication
 *
 * @module electron/main/utils/search
 */

/**
 * Escapes a search term for safe use in FTS5 MATCH queries
 *
 * FTS5 Escaping Rules:
 * - Only double quote (") needs escaping
 * - Escape by doubling: " becomes ""
 * - Wrap entire term in quotes for literal search
 *
 * @param {string} searchTerm - Raw user input
 * @returns {string} Escaped and quoted term
 *
 * @example
 * escapeFts5SearchTerm('hello:world')
 * // => '"hello:world"'
 *
 * @example
 * escapeFts5SearchTerm('test "quoted"')
 * // => '"test ""quoted"""'
 */
export function escapeFts5SearchTerm(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return '""'
  }

  // Escape double quotes by doubling them
  const escaped = searchTerm.replace(/"/g, '""')

  // Wrap in double quotes for literal search
  return `"${escaped}"`
}

/**
 * Builds an FTS5 column-filtered MATCH query
 *
 * Format: {column1 column2 column3}: "search term"
 *
 * @param {string[]} columns - Column names to search
 * @param {string} escapedSearchTerm - Already-escaped search term
 * @returns {string} FTS5 MATCH query string
 *
 * @throws {Error} If columns is not a non-empty array
 * @throws {Error} If escapedSearchTerm is empty
 *
 * @example
 * buildFts5MatchQuery(['title', 'content'], '"hello"')
 * // => '{title content}: "hello"'
 */
export function buildFts5MatchQuery(columns, escapedSearchTerm) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('Columns must be a non-empty array')
  }

  if (!escapedSearchTerm || typeof escapedSearchTerm !== 'string') {
    throw new Error('Search term is required')
  }

  const columnList = columns.join(' ')
  return `{${columnList}}: ${escapedSearchTerm}`
}

/**
 * Validates a search term
 *
 * @param {string} searchTerm - Term to validate
 * @returns {boolean} True if valid (non-empty after trim)
 */
export function isValidSearchTerm(searchTerm) {
  return Boolean(searchTerm && typeof searchTerm === 'string' && searchTerm.trim())
}
