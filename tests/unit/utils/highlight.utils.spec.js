import { describe, it, expect } from 'vitest'
import { highlightSearchTerms, sanitizeForHighlight } from '@/utils/highlight.utils'

describe('sanitizeForHighlight', () => {
  it('should escape HTML entities', () => {
    expect(sanitizeForHighlight('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  it('should escape ampersands', () => {
    expect(sanitizeForHighlight('A & B')).toBe('A &amp; B')
  })

  it('should handle empty/null input', () => {
    expect(sanitizeForHighlight('')).toBe('')
    expect(sanitizeForHighlight(null)).toBe('')
  })
})

describe('highlightSearchTerms', () => {
  it('should wrap matching text in <mark> tags', () => {
    expect(highlightSearchTerms('Hello GRIN2B world', ['GRIN2B'])).toBe(
      'Hello <mark>GRIN2B</mark> world',
    )
  })

  it('should be case-insensitive', () => {
    expect(highlightSearchTerms('Hello grin2b world', ['GRIN2B'])).toBe(
      'Hello <mark>grin2b</mark> world',
    )
  })

  it('should highlight multiple occurrences', () => {
    expect(highlightSearchTerms('GRIN2B causes GRIN2B issues', ['GRIN2B'])).toBe(
      '<mark>GRIN2B</mark> causes <mark>GRIN2B</mark> issues',
    )
  })

  it('should highlight multiple different terms', () => {
    const result = highlightSearchTerms('GRIN2B and epilepsy are related', [
      'GRIN2B',
      'epilepsy',
    ])
    expect(result).toContain('<mark>GRIN2B</mark>')
    expect(result).toContain('<mark>epilepsy</mark>')
  })

  it('should escape HTML in text before highlighting', () => {
    const result = highlightSearchTerms('<script>GRIN2B</script>', ['GRIN2B'])
    expect(result).not.toContain('<script>')
    expect(result).toContain('<mark>GRIN2B</mark>')
  })

  it('should return sanitized text when no search terms', () => {
    expect(highlightSearchTerms('Hello <b>world</b>', [])).toBe(
      'Hello &lt;b&gt;world&lt;/b&gt;',
    )
  })

  it('should handle empty text', () => {
    expect(highlightSearchTerms('', ['GRIN2B'])).toBe('')
    expect(highlightSearchTerms(null, ['GRIN2B'])).toBe('')
  })

  it('should handle regex special characters in search terms', () => {
    expect(highlightSearchTerms('test (value) here', ['(value)'])).toBe(
      'test <mark>(value)</mark> here',
    )
  })

  it('should handle partial word matches for prefix searches', () => {
    expect(highlightSearchTerms('BRCA1 and BRCA2 genes', ['BRCA'])).toBe(
      '<mark>BRCA</mark>1 and <mark>BRCA</mark>2 genes',
    )
  })
})
