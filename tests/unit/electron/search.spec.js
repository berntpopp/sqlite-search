/**
 * Tests for FTS5 Search Utilities
 *
 * @module tests/unit/electron/search.spec
 */
import { describe, it, expect } from 'vitest'
import {
  containsFts5Syntax,
  escapeFts5SearchTerm,
  buildFts5MatchQuery,
  isValidSearchTerm,
} from '../../../electron/main/utils/search.js'

describe('Search Utilities', () => {
  describe('containsFts5Syntax', () => {
    it('should return false for null/undefined/empty input', () => {
      expect(containsFts5Syntax(null)).toBe(false)
      expect(containsFts5Syntax(undefined)).toBe(false)
      expect(containsFts5Syntax('')).toBe(false)
    })

    it('should return false for simple search terms', () => {
      expect(containsFts5Syntax('hello')).toBe(false)
      expect(containsFts5Syntax('hello world')).toBe(false)
      expect(containsFts5Syntax('BRCA1')).toBe(false)
    })

    it('should detect AND operator', () => {
      expect(containsFts5Syntax('BRCA1 AND NM_007294')).toBe(true)
      expect(containsFts5Syntax('gene1 AND gene2')).toBe(true)
    })

    it('should detect OR operator', () => {
      expect(containsFts5Syntax('BRCA1 OR BRCA2')).toBe(true)
      expect(containsFts5Syntax('gene1 OR gene2 OR gene3')).toBe(true)
    })

    it('should detect NOT operator', () => {
      expect(containsFts5Syntax('BRCA1 NOT BRCA2')).toBe(true)
      expect(containsFts5Syntax('NOT excluded')).toBe(true)
    })

    it('should detect prefix queries with *', () => {
      expect(containsFts5Syntax('BRCA*')).toBe(true)
      expect(containsFts5Syntax('gene*')).toBe(true)
      expect(containsFts5Syntax('test* something')).toBe(true)
    })

    it('should detect NEAR queries', () => {
      expect(containsFts5Syntax('NEAR(term1 term2)')).toBe(true)
      expect(containsFts5Syntax('NEAR(term1 term2, 10)')).toBe(true)
      expect(containsFts5Syntax('near(a b)')).toBe(true)
    })

    it('should detect phrase queries', () => {
      expect(containsFts5Syntax('"exact phrase"')).toBe(true)
      expect(containsFts5Syntax('"hello world"')).toBe(true)
    })

    it('should not detect lowercase and/or/not as operators', () => {
      expect(containsFts5Syntax('bread and butter')).toBe(false)
      expect(containsFts5Syntax('this or that')).toBe(false)
      expect(containsFts5Syntax('why not')).toBe(false)
    })
  })

  describe('escapeFts5SearchTerm', () => {
    describe('simple searches (no operators)', () => {
      it('should wrap simple terms in quotes', () => {
        expect(escapeFts5SearchTerm('hello')).toBe('"hello"')
        expect(escapeFts5SearchTerm('hello world')).toBe('"hello world"')
      })

      it('should return empty quotes for null/undefined/empty input', () => {
        expect(escapeFts5SearchTerm(null)).toBe('""')
        expect(escapeFts5SearchTerm(undefined)).toBe('""')
        expect(escapeFts5SearchTerm('')).toBe('""')
      })

      it('should escape internal double quotes', () => {
        expect(escapeFts5SearchTerm('test "quoted" value')).toBe('"test ""quoted"" value"')
      })

      it('should trim whitespace', () => {
        expect(escapeFts5SearchTerm('  hello  ')).toBe('"hello"')
      })
    })

    describe('boolean operator queries', () => {
      it('should preserve AND operator', () => {
        expect(escapeFts5SearchTerm('BRCA1 AND BRCA2')).toBe('BRCA1 AND BRCA2')
      })

      it('should preserve OR operator', () => {
        expect(escapeFts5SearchTerm('gene1 OR gene2')).toBe('gene1 OR gene2')
      })

      it('should preserve NOT operator', () => {
        expect(escapeFts5SearchTerm('BRCA1 NOT BRCA2')).toBe('BRCA1 NOT BRCA2')
      })

      it('should quote terms with periods (special characters)', () => {
        expect(escapeFts5SearchTerm('BRCA1 AND NM_007294.4')).toBe('BRCA1 AND "NM_007294.4"')
      })

      it('should quote terms with multiple special characters', () => {
        expect(escapeFts5SearchTerm('gene1 OR gene.2.3')).toBe('gene1 OR "gene.2.3"')
      })

      it('should handle complex boolean expressions', () => {
        expect(escapeFts5SearchTerm('BRCA1 AND NM_007294.4 OR TP53')).toBe(
          'BRCA1 AND "NM_007294.4" OR TP53'
        )
      })

      it('should preserve already quoted phrases', () => {
        expect(escapeFts5SearchTerm('"exact phrase" AND term')).toBe('"exact phrase" AND term')
      })
    })

    describe('prefix queries', () => {
      it('should preserve simple prefix queries', () => {
        expect(escapeFts5SearchTerm('BRCA*')).toBe('BRCA*')
      })

      it('should preserve prefix in boolean context', () => {
        expect(escapeFts5SearchTerm('gene* AND BRCA1')).toBe('gene* AND BRCA1')
      })

      it('should handle prefix with special chars in base (falls back to phrase)', () => {
        // Prefix queries with special chars in base term can't use prefix syntax
        expect(escapeFts5SearchTerm('NM_007294.*')).toBe('"NM_007294."')
      })
    })

    describe('special character handling', () => {
      it('should quote terms with periods', () => {
        expect(escapeFts5SearchTerm('test AND file.txt')).toBe('test AND "file.txt"')
      })

      it('should quote terms with colons', () => {
        expect(escapeFts5SearchTerm('test AND http://example')).toBe('test AND "http://example"')
      })

      it('should quote terms with parentheses', () => {
        expect(escapeFts5SearchTerm('test AND func()')).toBe('test AND "func()"')
      })

      it('should quote terms with hyphens', () => {
        expect(escapeFts5SearchTerm('test AND some-value')).toBe('test AND "some-value"')
      })
    })
  })

  describe('buildFts5MatchQuery', () => {
    it('should build column-filtered query', () => {
      expect(buildFts5MatchQuery(['title', 'content'], '"hello"')).toBe('{title content}: "hello"')
    })

    it('should handle single column', () => {
      expect(buildFts5MatchQuery(['title'], '"test"')).toBe('{title}: "test"')
    })

    it('should throw for empty columns array', () => {
      expect(() => buildFts5MatchQuery([], '"test"')).toThrow('Columns must be a non-empty array')
    })

    it('should throw for non-array columns', () => {
      expect(() => buildFts5MatchQuery('title', '"test"')).toThrow(
        'Columns must be a non-empty array'
      )
    })

    it('should throw for empty search term', () => {
      expect(() => buildFts5MatchQuery(['title'], '')).toThrow('Search term is required')
    })
  })

  describe('isValidSearchTerm', () => {
    it('should return true for valid terms', () => {
      expect(isValidSearchTerm('hello')).toBe(true)
      expect(isValidSearchTerm('hello world')).toBe(true)
      expect(isValidSearchTerm('  test  ')).toBe(true)
    })

    it('should return false for invalid terms', () => {
      expect(isValidSearchTerm(null)).toBe(false)
      expect(isValidSearchTerm(undefined)).toBe(false)
      expect(isValidSearchTerm('')).toBe(false)
      expect(isValidSearchTerm('   ')).toBe(false)
    })
  })
})
