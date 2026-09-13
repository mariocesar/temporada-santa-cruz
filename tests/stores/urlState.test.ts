import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PARAMS,
  parseParams,
  serializeParams,
  type DashboardParams,
} from '../../src/lib/stores/urlState'

const SLUGS = new Set(['achachairu', 'papaya', 'uva'])

describe('parseParams', () => {
  it('returns defaults for an empty search string', () => {
    expect(parseParams('', SLUGS)).toEqual(DEFAULT_PARAMS)
  })

  it('parses a full parameter set', () => {
    const p = parseParams('?product=achachairu&mode=local&category=fruit&q=acha&week=50', SLUGS)
    expect(p).toEqual({
      product: 'achachairu',
      mode: 'local',
      category: 'fruit',
      query: 'acha',
      week: 50,
    })
  })

  it('ignores unknown product slugs', () => {
    expect(parseParams('?product=manzana', SLUGS).product).toBeNull()
  })

  it('ignores invalid modes, categories and weeks', () => {
    const p = parseParams('?mode=global&category=carnes&week=99', SLUGS)
    expect(p.mode).toBe('mercado')
    expect(p.category).toBe('todos')
    expect(p.week).toBeNull()
  })

  it('rejects non-numeric and out-of-range weeks', () => {
    expect(parseParams('?week=0', SLUGS).week).toBeNull()
    expect(parseParams('?week=53', SLUGS).week).toBeNull()
    expect(parseParams('?week=abc', SLUGS).week).toBeNull()
    expect(parseParams('?week=1', SLUGS).week).toBe(1)
    expect(parseParams('?week=52', SLUGS).week).toBe(52)
  })

  it('caps absurdly long queries', () => {
    const q = 'a'.repeat(500)
    expect(parseParams(`?q=${q}`, SLUGS).query).toHaveLength(100)
  })
})

describe('serializeParams', () => {
  it('serializes defaults to an empty string', () => {
    expect(serializeParams(DEFAULT_PARAMS)).toBe('')
  })

  it('omits default values and keeps non-defaults', () => {
    const p: DashboardParams = {
      product: 'papaya',
      mode: 'mercado',
      category: 'todos',
      query: '',
      week: null,
    }
    expect(serializeParams(p)).toBe('?product=papaya')
  })

  it('round-trips a full state through parse', () => {
    const p: DashboardParams = {
      product: 'uva',
      mode: 'local',
      category: 'tuber',
      query: 'yu ca',
      week: 26,
    }
    expect(parseParams(serializeParams(p), SLUGS)).toEqual(p)
  })

  it('does not emit a query param for whitespace-only queries', () => {
    expect(serializeParams({ ...DEFAULT_PARAMS, query: '   ' })).toBe('')
  })
})
