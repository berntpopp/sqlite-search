/**
 * Search term highlighting utilities
 * Safely renders highlighted text for use with v-html
 */

/**
 * Escapes HTML entities to prevent XSS when using v-html.
 *
 * @param {string} text - Raw text to sanitize
 * @returns {string} HTML-safe text with entities escaped
 */
export function sanitizeForHighlight(text) {
  if (!text && text !== 0) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Escapes regex special characters in a string.
 *
 * @param {string} str - String to escape
 * @returns {string} Regex-safe string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Highlights search terms in text by wrapping matches in <mark> tags.
 * Input is sanitized first to prevent XSS.
 *
 * @param {string} text - Text to highlight in
 * @param {string[]} searchWords - Array of words to highlight
 * @returns {string} HTML string with <mark> tags around matches
 */
export function highlightSearchTerms(text, searchWords) {
  if (!text && text !== 0) return ''

  const sanitized = sanitizeForHighlight(text)

  if (!searchWords || searchWords.length === 0) return sanitized

  // Build regex from all search words, longest first to avoid partial replacement issues
  const sorted = [...searchWords].sort((a, b) => b.length - a.length)
  const pattern = sorted.map(w => escapeRegex(w)).join('|')

  const regex = new RegExp(`(${pattern})`, 'gi')
  return sanitized.replace(regex, '<mark>$1</mark>')
}
