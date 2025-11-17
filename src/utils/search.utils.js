/**
 * Search Utilities
 * Provides reusable functions for search operations
 *
 * SOLID Principles:
 * - SRP: Each function has single responsibility
 * - DRY: Centralized escaping logic
 * - Testable: Pure functions with no side effects
 */

/**
 * Escapes a search term for safe use in FTS5 MATCH queries
 *
 * FTS5 Special Characters:
 * - Only " (double quote) needs escaping
 * - Escape method: Replace " with ""
 * - Wrap entire term in quotes to treat as literal
 *
 * @param {string} searchTerm - Raw user input
 * @returns {string} Escaped and quoted term safe for FTS5
 *
 * @example
 * escapeFts5SearchTerm('hello:world')
 * // returns '"hello:world"'
 *
 * @example
 * escapeFts5SearchTerm('test "quoted"')
 * // returns '"test ""quoted"""'
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
 * Validates that a search term is non-empty after trimming
 *
 * @param {string} searchTerm - Term to validate
 * @returns {boolean} True if valid (non-empty after trim)
 *
 * @example
 * isValidSearchTerm('hello') // true
 * isValidSearchTerm('   ')   // false
 * isValidSearchTerm('')      // false
 */
export function isValidSearchTerm(searchTerm) {
  return Boolean(searchTerm && typeof searchTerm === 'string' && searchTerm.trim())
}

/**
 * Detects if a search term contains FTS5 special characters
 *
 * Special characters: : " * - ( ) { } OR AND NOT
 *
 * @param {string} searchTerm - Term to check
 * @returns {boolean} True if special characters detected
 *
 * @example
 * hasSpecialCharacters('hello:world') // true
 * hasSpecialCharacters('simple')      // false
 */
export function hasSpecialCharacters(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return false
  }

  // Regex for FTS5 special characters
  return /[:"*\-(){}]|(\bOR\b)|(\bAND\b)|(\bNOT\b)/i.test(searchTerm)
}

/**
 * Creates an FTS5 column-filtered MATCH query
 *
 * Format: {column1 column2 column3}: "search term"
 *
 * @param {string[]} columns - Column names to search
 * @param {string} searchTerm - Already-escaped search term
 * @returns {string} FTS5 MATCH query string
 *
 * @example
 * buildFts5MatchQuery(['title', 'content'], '"hello"')
 * // returns '{title content}: "hello"'
 */
export function buildFts5MatchQuery(columns, searchTerm) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('Columns must be a non-empty array')
  }

  if (!searchTerm) {
    throw new Error('Search term is required')
  }

  const columnList = columns.join(' ')
  return `{${columnList}}: ${searchTerm}`
}

/**
 * Truncates text for display with ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 *
 * @example
 * truncateText('Hello World', 5) // 'Hello...'
 * truncateText('Hi', 10)          // 'Hi'
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return ''

  const str = String(text)
  return str.length > maxLength
    ? `${str.substring(0, maxLength)}...`
    : str
}
