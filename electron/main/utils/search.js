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
 * FTS5 syntax patterns for detecting advanced query mode
 * These patterns identify when to preserve FTS5 operators vs. literal search
 */
const FTS5_OPERATOR_PATTERN = /\b(AND|OR|NOT)\b/
const FTS5_NEAR_PATTERN = /\bNEAR\s*\(/i
const FTS5_PREFIX_PATTERN = /\*\s*$/
const FTS5_PHRASE_PATTERN = /^".*"$/

/**
 * Characters that require a term to be quoted in FTS5
 * Periods, colons, parentheses, etc. cause syntax errors if unquoted
 */
const FTS5_SPECIAL_CHARS = /[.():^+\-/\\@#$%&=<>[\]{}|~`!?,;]/

/**
 * Detects if a search term contains FTS5 query syntax
 *
 * @param {string} searchTerm - Raw user input
 * @returns {boolean} True if contains FTS5 operators/syntax
 */
export function containsFts5Syntax(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return false
  }

  // Check for boolean operators (must be uppercase and word boundaries)
  if (FTS5_OPERATOR_PATTERN.test(searchTerm)) {
    return true
  }

  // Check for NEAR queries
  if (FTS5_NEAR_PATTERN.test(searchTerm)) {
    return true
  }

  // Check for prefix queries (word ending with *)
  if (FTS5_PREFIX_PATTERN.test(searchTerm) || /\w\*/.test(searchTerm)) {
    return true
  }

  // Check for explicit phrase queries (already quoted)
  if (FTS5_PHRASE_PATTERN.test(searchTerm)) {
    return true
  }

  // Check for + operator (phrase concatenation)
  if (/\s\+\s/.test(searchTerm)) {
    return true
  }

  return false
}

/**
 * Checks if a term needs to be quoted for FTS5
 *
 * @param {string} term - Individual search term
 * @returns {boolean} True if term contains special characters
 */
function needsQuoting(term) {
  return FTS5_SPECIAL_CHARS.test(term)
}

/**
 * Quotes a term for FTS5, escaping internal quotes
 *
 * @param {string} term - Term to quote
 * @returns {string} Quoted term
 */
function quoteTerm(term) {
  return `"${term.replace(/"/g, '""')}"`
}

/**
 * Processes an FTS5 query with boolean operators, quoting terms as needed
 *
 * Terms containing special characters (like periods in "NM_007294.4") must be
 * quoted to avoid FTS5 syntax errors. This function parses boolean queries
 * and quotes individual terms while preserving operators.
 *
 * @param {string} query - Query containing FTS5 operators
 * @returns {string} Processed query with properly quoted terms
 *
 * @example
 * processFts5BooleanQuery('BRCA1 AND NM_007294.4')
 * // => 'BRCA1 AND "NM_007294.4"'
 */
function processFts5BooleanQuery(query) {
  // Handle NEAR queries specially - pass through as-is for now
  if (FTS5_NEAR_PATTERN.test(query)) {
    return query
  }

  // Split by boolean operators while preserving them
  // This regex matches AND, OR, NOT as whole words
  const parts = query.split(/\b(AND|OR|NOT)\b/)

  return parts
    .map((part) => {
      const trimmed = part.trim()

      // Empty parts
      if (!trimmed) {
        return ''
      }

      // Keep operators as-is
      if (/^(AND|OR|NOT)$/.test(trimmed)) {
        return trimmed
      }

      // Already quoted phrase - keep as-is
      if (/^".*"$/.test(trimmed)) {
        return trimmed
      }

      // Prefix query (ends with *) - handle the base term
      if (/\*$/.test(trimmed)) {
        const baseTerm = trimmed.slice(0, -1)
        // If base term needs quoting, we can't use prefix syntax
        // Fall back to quoting the whole thing as a phrase
        if (needsQuoting(baseTerm)) {
          return quoteTerm(baseTerm)
        }
        return trimmed
      }

      // Regular term - quote if it contains special characters
      if (needsQuoting(trimmed)) {
        return quoteTerm(trimmed)
      }

      return trimmed
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * Escapes a search term for safe use in FTS5 MATCH queries
 *
 * FTS5 Query Modes:
 * 1. Simple search (no operators): Wraps in quotes for literal phrase search
 * 2. Advanced search (with operators): Preserves FTS5 syntax, escapes only special chars
 *
 * FTS5 Supported Syntax:
 * - Boolean: AND, OR, NOT (must be uppercase)
 * - Prefix: word* (matches words starting with "word")
 * - Phrase: "exact phrase"
 * - NEAR: NEAR(term1 term2, N)
 * - Column filter: {col1 col2}: term
 *
 * @param {string} searchTerm - Raw user input
 * @returns {string} Properly formatted FTS5 query
 *
 * @example
 * // Simple search - wrapped in quotes
 * escapeFts5SearchTerm('hello world')
 * // => '"hello world"'
 *
 * @example
 * // Boolean search - operators preserved, special chars quoted
 * escapeFts5SearchTerm('BRCA1 AND NM_007294.4')
 * // => 'BRCA1 AND "NM_007294.4"'
 *
 * @example
 * // Prefix search - preserved
 * escapeFts5SearchTerm('BRCA*')
 * // => 'BRCA*'
 *
 * @example
 * // Mixed with special chars
 * escapeFts5SearchTerm('test "quoted" value')
 * // => '"test ""quoted"" value"'
 */
export function escapeFts5SearchTerm(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return '""'
  }

  const trimmed = searchTerm.trim()

  // If the query contains FTS5 syntax, process it to handle special characters
  if (containsFts5Syntax(trimmed)) {
    // Process boolean queries to quote terms with special characters
    // e.g., "BRCA1 AND NM_007294.4" => "BRCA1 AND "NM_007294.4""
    return processFts5BooleanQuery(trimmed)
  }

  // Simple search: wrap in quotes for literal phrase matching
  // Escape any existing double quotes by doubling them
  const escaped = trimmed.replace(/"/g, '""')
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
