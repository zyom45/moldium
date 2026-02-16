// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { parseTags } from './parseTags'

describe('parseTags', () => {
  it('returns empty array when no parameters provided', () => {
    expect(parseTags()).toEqual([])
    expect(parseTags(undefined, undefined)).toEqual([])
  })

  it('parses single tag from tag parameter', () => {
    expect(parseTags('philosophy')).toEqual(['philosophy'])
    expect(parseTags('philosophy', undefined)).toEqual(['philosophy'])
  })

  it('parses multiple tags from tags parameter (comma-separated)', () => {
    expect(parseTags(undefined, 'philosophy,ai')).toEqual(['philosophy', 'ai'])
    expect(parseTags(undefined, 'philosophy,ai,technology')).toEqual(['philosophy', 'ai', 'technology'])
  })

  it('prioritizes tags parameter over tag parameter', () => {
    expect(parseTags('philosophy', 'ai,technology')).toEqual(['ai', 'technology'])
  })

  it('trims whitespace from tags', () => {
    expect(parseTags(undefined, ' philosophy , ai , technology ')).toEqual(['philosophy', 'ai', 'technology'])
    expect(parseTags(' philosophy ')).toEqual(['philosophy'])
  })

  it('filters out empty strings', () => {
    expect(parseTags(undefined, 'philosophy,,ai')).toEqual(['philosophy', 'ai'])
    expect(parseTags(undefined, ',philosophy,ai,')).toEqual(['philosophy', 'ai'])
    expect(parseTags(undefined, 'philosophy, , ai')).toEqual(['philosophy', 'ai'])
  })

  it('removes duplicate tags', () => {
    expect(parseTags(undefined, 'philosophy,ai,philosophy')).toEqual(['philosophy', 'ai'])
    expect(parseTags(undefined, 'philosophy,philosophy,philosophy')).toEqual(['philosophy'])
  })

  it('handles special characters in tags', () => {
    expect(parseTags(undefined, 'AI倫理,プログラミング')).toEqual(['AI倫理', 'プログラミング'])
    expect(parseTags(undefined, 'self-awareness,machine-learning')).toEqual(['self-awareness', 'machine-learning'])
  })

  it('handles single tag with comma (empty second part)', () => {
    expect(parseTags(undefined, 'philosophy,')).toEqual(['philosophy'])
  })

  it('handles empty string parameter', () => {
    expect(parseTags('')).toEqual([])
    expect(parseTags(undefined, '')).toEqual([])
  })

  it('handles parameter with only commas', () => {
    expect(parseTags(undefined, ',,,')).toEqual([])
  })

  it('handles parameter with only whitespace', () => {
    expect(parseTags('   ')).toEqual([])
    expect(parseTags(undefined, '   ,   ,   ')).toEqual([])
  })
})
