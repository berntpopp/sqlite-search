/**
 * Text processing utilities for search highlighting and display
 */

const FTS5_OPERATORS = /\b(AND|OR|NOT|NEAR)\b/g

/**
 * Extracts actual search words from an FTS5 query string.
 * Strips boolean operators (AND, OR, NOT, NEAR) and handles
 * quoted phrases, prefix queries (word*), and deduplication.
 *
 * @param {string} query - Raw FTS5 search query
 * @returns {string[]} Array of search words/phrases
 */
export function extractSearchWords(query) {
  if (!query || typeof query !== 'string') return []

  const words = []

  // Extract quoted phrases first
  const withoutQuoted = query.replace(/"([^"]+)"/g, (_, phrase) => {
    words.push(phrase)
    return ''
  })

  // Remove FTS5 operators, then split remaining into words
  const remaining = withoutQuoted.replace(FTS5_OPERATORS, '').trim()

  if (remaining) {
    remaining.split(/\s+/).forEach(word => {
      // Strip prefix asterisk
      const cleaned = word.replace(/\*$/, '').trim()
      if (cleaned) words.push(cleaned)
    })
  }

  // Deduplicate (case-sensitive — FTS5 is case-insensitive but we preserve original case)
  return [...new Set(words)]
}

/**
 * Strips single-letter markup tags from text.
 * Matches tags like <f>, </f>, <u>, </u>, <k>, </k> etc.
 * Does NOT strip multi-letter HTML tags like <div>, <span>.
 *
 * @param {string} text - Text potentially containing markup tags
 * @returns {string} Text with single-letter tags removed
 */
export function stripMarkupTags(text) {
  if (text === null || text === undefined) return ''
  const str = String(text)
  return str.replace(/<\/?[a-z]>/gi, '')
}
