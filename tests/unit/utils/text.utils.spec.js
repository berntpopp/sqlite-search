import { describe, it, expect } from 'vitest'
import { extractSearchWords, stripMarkupTags } from '@/utils/text.utils'

describe('extractSearchWords', () => {
  it('should extract a single word', () => {
    expect(extractSearchWords('GRIN2B')).toEqual(['GRIN2B'])
  })

  it('should extract multiple space-separated words', () => {
    expect(extractSearchWords('GRIN2B epilepsy')).toEqual(['GRIN2B', 'epilepsy'])
  })

  it('should strip FTS5 boolean operators', () => {
    expect(extractSearchWords('GRIN2B AND epilepsy')).toEqual(['GRIN2B', 'epilepsy'])
    expect(extractSearchWords('BRCA1 OR BRCA2')).toEqual(['BRCA1', 'BRCA2'])
    expect(extractSearchWords('NOT cancer')).toEqual(['cancer'])
  })

  it('should handle quoted phrases', () => {
    expect(extractSearchWords('"exact phrase"')).toEqual(['exact phrase'])
  })

  it('should handle prefix queries by stripping asterisk', () => {
    expect(extractSearchWords('BRCA*')).toEqual(['BRCA'])
  })

  it('should handle mixed operators and phrases', () => {
    expect(extractSearchWords('GRIN2B AND "infantile spasms"')).toEqual([
      'infantile spasms',
      'GRIN2B',
    ])
  })

  it('should return empty array for empty input', () => {
    expect(extractSearchWords('')).toEqual([])
    expect(extractSearchWords(null)).toEqual([])
    expect(extractSearchWords(undefined)).toEqual([])
  })

  it('should deduplicate words', () => {
    expect(extractSearchWords('GRIN2B AND GRIN2B')).toEqual(['GRIN2B'])
  })
})

describe('stripMarkupTags', () => {
  it('should strip single-letter tags', () => {
    expect(stripMarkupTags('<f>Anamnese: </f>')).toBe('Anamnese: ')
  })

  it('should strip multiple different tags', () => {
    expect(stripMarkupTags('<u>Molekulargenetik</u> und <k>Klinik</k>')).toBe(
      'Molekulargenetik und Klinik'
    )
  })

  it('should handle nested tags', () => {
    expect(stripMarkupTags('<f><u>bold underline</u></f>')).toBe('bold underline')
  })

  it('should not strip multi-letter HTML tags', () => {
    expect(stripMarkupTags('<div>content</div>')).toBe('<div>content</div>')
  })

  it('should return original string when no tags present', () => {
    expect(stripMarkupTags('plain text')).toBe('plain text')
  })

  it('should handle null/undefined/empty input', () => {
    expect(stripMarkupTags(null)).toBe('')
    expect(stripMarkupTags(undefined)).toBe('')
    expect(stripMarkupTags('')).toBe('')
  })

  it('should handle non-string input', () => {
    expect(stripMarkupTags(42)).toBe('42')
  })
})
