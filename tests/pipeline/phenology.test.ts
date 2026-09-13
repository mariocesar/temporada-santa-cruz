import { describe, expect, it } from 'vitest'
import type { DataSource, Origin, Product } from '../../src/lib/data/types'
import { deriveDataset, normalizeObservations, type LocatedRow } from '../../scripts/data/lib/pipeline'
import { buildRegistries, phenologyErrors, type UnitDef } from '../../scripts/data/lib/registry'
import {
  phenologyEntrySchema,
  phenologyWindowSchema,
  sourceSchema,
  type PhenologyEntry,
  type RawCsvRow,
} from '../../scripts/data/schemas'

const products: Product[] = [
  { id: 'papaya', slug: 'papaya', nameEs: 'Papaya', aliases: [], category: 'fruit' },
  { id: 'palta', slug: 'palta', nameEs: 'Palta', aliases: ['aguacate'], category: 'fruit' },
]
const origins: Origin[] = [
  {
    id: 'bo-santa-cruz',
    label: 'Santa Cruz',
    country: 'Bolivia',
    department: 'Santa Cruz',
    level: 'department',
  },
]
const units: UnitDef[] = [
  { id: 'kg', canonical: 'kg', aliases: ['kg'], knownWeightKg: 1, conversionConfidence: 1 },
]
const sources: DataSource[] = [
  { id: 'cao', name: 'CAO', publisher: 'CAO', sourceType: 'market', kind: 'original' },
  {
    id: 'lit-fen',
    name: 'Estudio fenológico',
    publisher: 'UAGRM',
    sourceType: 'literature',
    url: 'https://example.org/estudio-fenologico',
    accessedAt: '2026-09-13',
    kind: 'original',
  },
  {
    id: 'ine-censo',
    name: 'INE Censo',
    publisher: 'INE',
    sourceType: 'census',
    kind: 'original',
  },
  {
    id: 'demo-lit',
    name: 'DEMO literatura',
    publisher: 'Demo',
    sourceType: 'literature',
    url: 'https://example.org/demo',
    accessedAt: '2026-09-13',
    kind: 'original',
    synthetic: true,
  },
]

const paltaEntry: PhenologyEntry = {
  productId: 'palta',
  windows: [{ startMonth: 10, endMonth: 2 }],
  sourceIds: ['lit-fen'],
  note: 'Ventana aproximada para los valles cruceños.',
  citation: 'Estudio fenológico, cuadro 3: cosecha octubre–febrero.',
}

function row(overrides: Partial<RawCsvRow>): RawCsvRow {
  return {
    observed_at: '2024-04-08',
    source_id: 'cao',
    report_id: 'r-2024-04-08',
    market: 'Abasto',
    product_raw: 'Papaya',
    origin_raw: 'Santa Cruz',
    variety_raw: '',
    quality: '',
    availability: 'A',
    wholesale_price: '',
    wholesale_unit: '',
    retail_price: '',
    retail_unit: '',
    row_seq: '',
    ...overrides,
  }
}

function observations(rows: RawCsvRow[]) {
  const registries = buildRegistries(products, origins, units, sources)
  const located: LocatedRow[] = rows.map((r, i) => ({ row: r, location: `fixture:${i + 2}` }))
  const result = normalizeObservations(located, registries)
  expect(result.errors).toEqual([])
  return result.observations
}

describe('deriveDataset with phenology entries', () => {
  it('publishes a display-only referenceSeason on the summary', () => {
    const registries = buildRegistries(products, origins, units, sources, [paltaEntry])
    const { summaries } = deriveDataset([], registries)
    const palta = summaries.find((s) => s.productId === 'palta')!
    expect(palta.referenceSeason).toEqual({
      ranges: [{ startWeek: 40, endWeek: 9 }],
      basis: 'literature',
      sourceIds: ['lit-fen'],
      note: 'Ventana aproximada para los valles cruceños.',
    })
    // The estimate must not weaken the observed-evidence gate (§104).
    expect(palta.insufficientEvidence).toBe(true)
    expect(palta.confidence).toBe(0)
    expect(palta.marketSeasonRanges).toEqual([])
    // summary.sourceIds stays observation-only.
    expect(palta.sourceIds).toEqual([])
    const papaya = summaries.find((s) => s.productId === 'papaya')!
    expect(papaya.referenceSeason).toBeUndefined()
  })

  it('keeps observation sourceIds free of citation sources', () => {
    const registries = buildRegistries(products, origins, units, sources, [paltaEntry])
    const obs = observations([row({ product_raw: 'aguacate' })])
    const { summaries } = deriveDataset(obs, registries)
    const palta = summaries.find((s) => s.productId === 'palta')!
    expect(palta.sourceIds).toEqual(['cao'])
    expect(palta.referenceSeason?.sourceIds).toEqual(['lit-fen'])
  })

  it('anti-conflation regression: derive with vs without a phenology entry is deep-equal except referenceSeason', () => {
    const obs = observations([
      row({}),
      row({ observed_at: '2024-04-15', report_id: 'r-2024-04-15' }),
      row({ product_raw: 'aguacate', observed_at: '2025-01-06', report_id: 'r-2025-01-06' }),
    ])
    const withEntry = deriveDataset(obs, buildRegistries(products, origins, units, sources, [paltaEntry]))
    const without = deriveDataset(obs, buildRegistries(products, origins, units, sources))

    expect(withEntry.seasonality).toEqual(without.seasonality)
    expect(withEntry.summaries.map(({ referenceSeason: _referenceSeason, ...rest }) => rest)).toEqual(
      without.summaries,
    )
  })

  it('refuses market-typed and synthetic citation sources', () => {
    const marketBacked = buildRegistries(products, origins, units, sources, [
      { ...paltaEntry, sourceIds: ['cao'] },
    ])
    expect(() => deriveDataset([], marketBacked)).toThrow(/market/i)
    const syntheticBacked = buildRegistries(products, origins, units, sources, [
      { ...paltaEntry, sourceIds: ['demo-lit'] },
    ])
    expect(() => deriveDataset([], syntheticBacked)).toThrow(/synthetic/i)
  })

  it('derives a mixed basis when literature and census sources are cited', () => {
    const registries = buildRegistries(products, origins, units, sources, [
      { ...paltaEntry, sourceIds: ['lit-fen', 'ine-censo'] },
    ])
    const { summaries } = deriveDataset([], registries)
    expect(summaries.find((s) => s.productId === 'palta')!.referenceSeason?.basis).toBe('mixed')
  })
})

describe('phenologyErrors', () => {
  it('accepts a valid registry', () => {
    const registries = buildRegistries(products, origins, units, sources, [paltaEntry])
    expect(phenologyErrors(registries)).toEqual([])
  })

  it('rejects unknown products, unknown/market/synthetic sources, and duplicates', () => {
    const registries = buildRegistries(products, origins, units, sources, [
      { ...paltaEntry, productId: 'inventado' },
      { ...paltaEntry, sourceIds: ['no-existe', 'cao', 'demo-lit'] },
      paltaEntry,
      paltaEntry,
    ])
    const errors = phenologyErrors(registries)
    expect(errors.some((e) => e.includes('inventado') && e.includes('unknown product'))).toBe(true)
    expect(errors.some((e) => e.includes('no-existe'))).toBe(true)
    expect(errors.some((e) => e.includes('market source cao'))).toBe(true)
    expect(errors.some((e) => e.includes('synthetic source demo-lit'))).toBe(true)
    expect(errors.some((e) => e.includes('duplicate entry'))).toBe(true)
  })
})

describe('phenology and source schemas (§104)', () => {
  it('accepts month windows and week windows; rejects malformed ones', () => {
    expect(phenologyWindowSchema.safeParse({ startMonth: 10, endMonth: 2 }).success).toBe(true)
    expect(phenologyWindowSchema.safeParse({ startWeek: 50, endWeek: 4 }).success).toBe(true)
    // Week 53 is never authorable; mixed month/week keys are malformed.
    expect(phenologyWindowSchema.safeParse({ startWeek: 53, endWeek: 2 }).success).toBe(false)
    expect(phenologyWindowSchema.safeParse({ startMonth: 0, endMonth: 2 }).success).toBe(false)
    expect(phenologyWindowSchema.safeParse({ startMonth: 10, endWeek: 4 }).success).toBe(false)
  })

  it('requires windows, citations, and sources on each entry', () => {
    expect(phenologyEntrySchema.safeParse(paltaEntry).success).toBe(true)
    expect(phenologyEntrySchema.safeParse({ ...paltaEntry, windows: [] }).success).toBe(false)
    expect(phenologyEntrySchema.safeParse({ ...paltaEntry, sourceIds: [] }).success).toBe(false)
    const { citation: _citation, ...noCitation } = paltaEntry
    expect(phenologyEntrySchema.safeParse(noCitation).success).toBe(false)
  })

  it('requires url and accessedAt on literature sources', () => {
    const literature = sources.find((s) => s.id === 'lit-fen')!
    expect(sourceSchema.safeParse(literature).success).toBe(true)
    const { url: _url, ...noUrl } = literature
    expect(sourceSchema.safeParse(noUrl).success).toBe(false)
    const { accessedAt: _accessedAt, ...noDate } = literature
    expect(sourceSchema.safeParse(noDate).success).toBe(false)
    // Market/census sources keep url and accessedAt optional.
    expect(sourceSchema.safeParse(sources.find((s) => s.id === 'cao')).success).toBe(true)
  })
})
