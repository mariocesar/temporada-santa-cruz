import { describe, expect, it } from 'vitest'
import type {
  Product,
  ProductSeasonSummary,
  WeeklySeasonality,
} from '../../src/lib/data/types'
import {
  buildProductViews,
  confidenceExplanation,
  filterViews,
  localShareOfKnown,
  matchesQuery,
  normalizeText,
  signalContributions,
  sortViews,
  stateAt,
} from '../../src/lib/data/views'
import { WEEK_BINS } from '../../src/lib/domain/methodology'

function product(overrides: Partial<Product> & { id: string }): Product {
  return {
    slug: overrides.id,
    nameEs: overrides.id,
    aliases: [],
    category: 'fruit',
    ...overrides,
  }
}

function summary(
  overrides: Partial<ProductSeasonSummary> & { productId: string },
): ProductSeasonSummary {
  return {
    peakWeeks: [],
    marketSeasonRanges: [],
    localSeasonRanges: [],
    observationCount: 40,
    yearsCovered: 5,
    confidence: 0.8,
    confidenceLabel: 'alta',
    insufficientEvidence: false,
    evidence: {
      observations: 40,
      years: 5,
      independentSources: 2,
      originKnownRatio: 0.9,
      yearConsistency: 0.85,
      weekCoverage: 0.75,
    },
    primaryOrigins: [],
    localShareOfKnown: null,
    priceComparable: false,
    containsSyntheticData: true,
    sourceIds: [],
    ...overrides,
  }
}

function weeklyRow(
  productId: string,
  week: number,
  overrides: Partial<WeeklySeasonality> = {},
): WeeklySeasonality {
  return {
    productId,
    week,
    marketScore: null,
    localScore: null,
    presenceProbability: null,
    availabilityScore: null,
    relativePriceScore: null,
    localShare: null,
    harvestScore: null,
    confidence: 0.8,
    observations: 0,
    years: 0,
    sourceIds: [],
    ...overrides,
  }
}

function fullYear(productId: string, marketScore: number | null): WeeklySeasonality[] {
  return Array.from({ length: WEEK_BINS }, (_, i) => weeklyRow(productId, i + 1, { marketScore }))
}

describe('buildProductViews', () => {
  it('joins products, summaries and weekly rows into 52-slot series', () => {
    const views = buildProductViews(
      [product({ id: 'a' })],
      [summary({ productId: 'a' })],
      fullYear('a', 0.5),
    )
    expect(views).toHaveLength(1)
    expect(views[0]!.marketSeries).toHaveLength(WEEK_BINS)
    expect(views[0]!.marketSeries.every((v) => v === 0.5)).toBe(true)
  })

  it('fills missing week bins with null (missing evidence is not zero)', () => {
    const views = buildProductViews(
      [product({ id: 'a' })],
      [summary({ productId: 'a' })],
      [weeklyRow('a', 10, { marketScore: 0.9 })],
    )
    const series = views[0]!.marketSeries
    expect(series[9]).toBe(0.9)
    expect(series[0]).toBeNull()
    expect(series.filter((v) => v !== null)).toHaveLength(1)
  })

  it('throws loudly when a product has no summary', () => {
    expect(() => buildProductViews([product({ id: 'a' })], [], [])).toThrow(/no summary/)
  })

  it('throws on weekly rows with invalid week bins', () => {
    expect(() =>
      buildProductViews(
        [product({ id: 'a' })],
        [summary({ productId: 'a' })],
        [weeklyRow('a', 53)],
      ),
    ).toThrow(/invalid week bin/)
  })
})

describe('stateAt', () => {
  it('classifies a peak week from the mode series', () => {
    const views = buildProductViews(
      [product({ id: 'a' })],
      [summary({ productId: 'a' })],
      fullYear('a', 0.9),
    )
    expect(stateAt(views[0]!, 'mercado', 1)).toBe('pico')
  })

  it('keeps market and local modes independent', () => {
    const weekly = Array.from({ length: WEEK_BINS }, (_, i) =>
      weeklyRow('a', i + 1, { marketScore: 0.9, localScore: 0.05 }),
    )
    const views = buildProductViews([product({ id: 'a' })], [summary({ productId: 'a' })], weekly)
    expect(stateAt(views[0]!, 'mercado', 10)).toBe('pico')
    expect(stateAt(views[0]!, 'local', 10)).toBe('fuera')
  })

  it('always reports sin_datos for insufficient-evidence products', () => {
    const views = buildProductViews(
      [product({ id: 'a' })],
      [summary({ productId: 'a', insufficientEvidence: true })],
      fullYear('a', 0.95),
    )
    expect(stateAt(views[0]!, 'mercado', 1)).toBe('sin_datos')
    expect(stateAt(views[0]!, 'local', 1)).toBe('sin_datos')
  })
})

describe('search', () => {
  it('normalizes accents and case', () => {
    expect(normalizeText('Piña')).toBe('pina')
    expect(normalizeText('  ACHACHAIRÚ ')).toBe('achachairu')
  })

  it('matches by name, alias and variety', () => {
    const p = product({
      id: 'pina',
      nameEs: 'Piña',
      aliases: ['ananá'],
      varieties: ['Cayena lisa'],
    })
    expect(matchesQuery(p, 'pina')).toBe(true)
    expect(matchesQuery(p, 'anana')).toBe(true)
    expect(matchesQuery(p, 'cayena')).toBe(true)
    expect(matchesQuery(p, 'papaya')).toBe(false)
    expect(matchesQuery(p, '')).toBe(true)
  })

  it('filters by category buckets, collapsing grain/herb/other into otros', () => {
    const views = buildProductViews(
      [
        product({ id: 'a', category: 'fruit' }),
        product({ id: 'b', category: 'grain' }),
        product({ id: 'c', category: 'herb' }),
      ],
      [summary({ productId: 'a' }), summary({ productId: 'b' }), summary({ productId: 'c' })],
      [],
    )
    expect(filterViews(views, '', 'fruit').map((v) => v.product.id)).toEqual(['a'])
    expect(filterViews(views, '', 'otros').map((v) => v.product.id)).toEqual(['b', 'c'])
    expect(filterViews(views, '', 'todos')).toHaveLength(3)
  })
})

describe('sortViews', () => {
  const views = buildProductViews(
    [
      product({ id: 'b', nameEs: 'Banana' }),
      product({ id: 'a', nameEs: 'Achachairú' }),
      product({ id: 'u', nameEs: 'Uva' }),
    ],
    [
      summary({ productId: 'b', confidence: 0.9 }),
      summary({ productId: 'a', confidence: 0.6 }),
      summary({ productId: 'u', confidence: 0.3, insufficientEvidence: true }),
    ],
    [...fullYear('b', 0.1), ...fullYear('a', 0.9), ...fullYear('u', 0.9)],
  )

  it('sorts by name with Spanish collation', () => {
    expect(sortViews(views, 'nombre', 'mercado', 1).map((v) => v.product.id)).toEqual([
      'a',
      'b',
      'u',
    ])
  })

  it('sorts by current season, insufficient-evidence products last', () => {
    expect(sortViews(views, 'temporada', 'mercado', 1).map((v) => v.product.id)).toEqual([
      'a', // pico
      'b', // fuera
      'u', // sin_datos (insufficient, despite a high raw score)
    ])
  })

  it('sorts by confidence, insufficient-evidence products last', () => {
    expect(sortViews(views, 'confianza', 'mercado', 1).map((v) => v.product.id)).toEqual([
      'b',
      'a',
      'u',
    ])
  })
})

describe('localShareOfKnown', () => {
  it('reads the pipeline aggregate, never a sum over the truncated origin list', () => {
    // primaryOrigins is a display-truncated top-3 list: summing its local
    // shares (here 0.58) would understate the true aggregate (0.7).
    const s = summary({
      productId: 'a',
      localShareOfKnown: 0.7,
      primaryOrigins: [
        { originId: 'sc-valles', label: 'Valles', share: 0.34, observations: 17, isLocal: true },
        { originId: 'sc-comarapa', label: 'Comarapa', share: 0.24, observations: 12, isLocal: true },
        { originId: 'ar', label: 'Argentina', share: 0.22, observations: 11, isLocal: false },
      ],
    })
    expect(localShareOfKnown(s)).toBe(0.7)
  })

  it('returns null when no observation has a known origin (never 0 %)', () => {
    // Pipeline emits originKnownRatio 0 (not null) when observations exist
    // but none carry an origin; the aggregate itself must be null.
    const s = summary({ productId: 'a', localShareOfKnown: null })
    s.evidence.originKnownRatio = 0
    expect(localShareOfKnown(s)).toBeNull()
  })
})

describe('signalContributions', () => {
  it('reports exactly the signals with any non-null weekly value', () => {
    const views = buildProductViews(
      [product({ id: 'a' })],
      [summary({ productId: 'a' })],
      [
        weeklyRow('a', 1, { presenceProbability: 0.8, availabilityScore: 0.6 }),
        weeklyRow('a', 2, { localShare: 0.5 }),
      ],
    )
    const byKey = Object.fromEntries(
      signalContributions(views[0]!).map((s) => [s.key, s.contributed]),
    )
    expect(byKey).toEqual({
      presencia: true,
      oferta: true,
      precio: false,
      procedencia: true,
      cosecha: false,
    })
  })
})

describe('confidenceExplanation', () => {
  it('states the recorded evidence numbers', () => {
    const text = confidenceExplanation(summary({ productId: 'a' }))
    expect(text).toContain('40 observaciones')
    expect(text).toContain('5 años')
    expect(text).toContain('2 fuentes independientes')
    expect(text).toContain('85 %')
  })

  it('explains the public evidence thresholds for insufficient products', () => {
    const s = summary({ productId: 'a', insufficientEvidence: true })
    s.evidence.observations = 4
    s.evidence.years = 1
    const text = confidenceExplanation(s)
    expect(text).toMatch(/al menos 30 observaciones/)
    expect(text).toMatch(/2 años/)
  })

  it('notes the single-year confidence cap', () => {
    const s = summary({ productId: 'a' })
    s.evidence.years = 1
    expect(confidenceExplanation(s)).toContain('Un solo año de datos')
  })
})
