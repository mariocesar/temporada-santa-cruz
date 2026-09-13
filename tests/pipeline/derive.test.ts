import { describe, expect, it } from 'vitest'
import type { DataSource, Origin, Product } from '../../src/lib/data/types'
import { classifySeason } from '../../src/lib/domain/classify'
import { rangesFromMask } from '../../src/lib/domain/cyclic'
import { deriveDataset, normalizeObservations, type LocatedRow } from '../../scripts/data/lib/pipeline'
import { buildRegistries, type UnitDef } from '../../scripts/data/lib/registry'
import type { RawCsvRow } from '../../scripts/data/schemas'

const products: Product[] = [
  { id: 'papaya', slug: 'papaya', nameEs: 'Papaya', aliases: [], category: 'fruit' },
  { id: 'uva', slug: 'uva', nameEs: 'Uva', aliases: [], category: 'fruit' },
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
  { id: 'cao', name: 'CAO', publisher: 'CAO', kind: 'original' },
]
const registries = buildRegistries(products, origins, units, sources)

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
    ...overrides,
  }
}

function observationsFrom(rows: RawCsvRow[]) {
  const located: LocatedRow[] = rows.map((r, i) => ({ row: r, location: `fixture:${i + 2}` }))
  const { observations, errors } = normalizeObservations(located, registries)
  expect(errors).toEqual([])
  return observations
}

describe('deriveDataset', () => {
  it('handles an empty observation set without inventing evidence', () => {
    const { seasonality, summaries } = deriveDataset([], registries)
    expect(seasonality).toHaveLength(2 * 52)
    for (const week of seasonality) {
      // No reports at all → no coverage → presence must be null, never 0.
      expect(week.presenceProbability).toBeNull()
      expect(week.marketScore).toBeNull()
      expect(week.localScore).toBeNull()
    }
    for (const summary of summaries) {
      expect(summary.insufficientEvidence).toBe(true)
      expect(summary.confidence).toBe(0)
      expect(summary.marketSeasonRanges).toEqual([])
    }
  })

  it('keeps presence null outside report coverage, 0 under coverage without the product', () => {
    // One report in ISO week 15 of 2024 listing only papaya.
    const observations = observationsFrom([row({})])
    const { seasonality } = deriveDataset(observations, registries)
    const uvaW15 = seasonality.find((w) => w.productId === 'uva' && w.week === 15)!
    const uvaW20 = seasonality.find((w) => w.productId === 'uva' && w.week === 20)!
    expect(uvaW15.presenceProbability).toBe(0) // report existed, uva absent
    expect(uvaW20.presenceProbability).toBeNull() // no report covers week 20
  })

  it('feeds the price signal only from the methodology basis (wholesale)', () => {
    // Retail-only prices in kg across two years: comparable by unit, but the
    // methodology basis is wholesale, so no price signal may be derived.
    const rows: RawCsvRow[] = []
    for (const year of ['2023', '2024']) {
      for (const day of ['01-02', '02-06', '03-06', '04-03', '05-01', '06-05']) {
        rows.push(
          row({
            observed_at: `${year}-${day}`,
            report_id: `r-${year}-${day}`,
            retail_price: '10',
            retail_unit: 'kg',
          }),
        )
      }
    }
    const observations = observationsFrom(rows)
    const { seasonality, summaries } = deriveDataset(observations, registries)
    const papaya = summaries.find((s) => s.productId === 'papaya')!
    expect(papaya.priceComparable).toBe(false)
    for (const week of seasonality.filter((w) => w.productId === 'papaya')) {
      expect(week.relativePriceScore).toBeNull()
    }
  })

  it('nulls yearConsistency for single-year products (absence agreement must not inflate it)', () => {
    const rows: RawCsvRow[] = []
    for (const year of ['2023', '2024', '2025']) {
      for (const day of ['01-02', '04-03', '07-03', '10-02']) {
        rows.push(row({ observed_at: `${year}-${day}`, report_id: `r-${year}-${day}` }))
        if (year === '2025') {
          rows.push(
            row({
              observed_at: `${year}-${day}`,
              report_id: `r-${year}-${day}`,
              product_raw: 'Uva',
            }),
          )
        }
      }
    }
    const observations = observationsFrom(rows)
    const { summaries } = deriveDataset(observations, registries)
    const uva = summaries.find((s) => s.productId === 'uva')!
    const papaya = summaries.find((s) => s.productId === 'papaya')!
    expect(uva.yearsCovered).toBe(1)
    expect(uva.evidence.yearConsistency).toBeNull()
    expect(papaya.evidence.yearConsistency).not.toBeNull()
  })

  it('publishes season ranges that reconstruct exactly from the published rounded scores', () => {
    const rows: RawCsvRow[] = []
    for (const year of ['2023', '2024']) {
      for (const month of ['01', '02', '03', '06', '07', '08', '11', '12']) {
        for (const dom of ['03', '17']) {
          const day = `${year}-${month}-${dom}`
          rows.push(
            row({
              observed_at: day,
              report_id: `r-${day}`,
              availability: month === '06' || month === '07' ? 'E' : 'A',
            }),
          )
        }
      }
    }
    const observations = observationsFrom(rows) // 32 obs, 2 years: sufficient
    expect(observations.length).toBeGreaterThanOrEqual(30)
    const { seasonality, summaries } = deriveDataset(observations, registries)
    const papaya = summaries.find((s) => s.productId === 'papaya')!
    const weekly = seasonality
      .filter((w) => w.productId === 'papaya')
      .sort((a, b) => a.week - b.week)
    // Re-deriving the mask from the PUBLISHED rounded scores must reproduce
    // the PUBLISHED ranges exactly (traceability, PROJECT.md §23).
    const mask = weekly.map((w) => {
      const cls = classifySeason(w.marketScore)
      return cls === 'in_season' || cls === 'peak'
    })
    expect(rangesFromMask(mask)).toEqual(papaya.marketSeasonRanges)
  })

  it('aggregates localShareOfKnown over ALL known origins, beyond the top-3 list', () => {
    const manyOrigins: Origin[] = [
      ...origins,
      { id: 'bo-sc-warnes', label: 'Warnes', country: 'Bolivia', department: 'Santa Cruz', level: 'municipality' },
      { id: 'bo-sc-portachuelo', label: 'Portachuelo', country: 'Bolivia', department: 'Santa Cruz', level: 'municipality' },
      { id: 'bo-cbba', label: 'Cochabamba', country: 'Bolivia', department: 'Cochabamba', level: 'department' },
    ]
    const localRegistries = buildRegistries(products, manyOrigins, units, sources)
    // Known-origin distribution: Cochabamba 4 (not local), Santa Cruz 3,
    // Warnes 3, Portachuelo 2 (all local). Top-3 truncation drops
    // Portachuelo, but the aggregate must still count it: 8/12 local.
    const spec: Array<[string, number]> = [
      ['Cochabamba', 4],
      ['Santa Cruz', 3],
      ['Warnes', 3],
      ['Portachuelo', 2],
    ]
    const rows: RawCsvRow[] = []
    let day = 1
    for (const [originRaw, count] of spec) {
      for (let i = 0; i < count; i++) {
        const date = `2024-03-${String(day++).padStart(2, '0')}`
        rows.push(row({ observed_at: date, report_id: `r-${date}`, origin_raw: originRaw }))
      }
    }
    // And a product observed WITHOUT any origin: aggregate must be null, not 0.
    const uvaDate = '2024-03-20'
    rows.push(row({ observed_at: uvaDate, report_id: `r-${uvaDate}`, product_raw: 'Uva', origin_raw: '' }))

    const located: LocatedRow[] = rows.map((r, i) => ({ row: r, location: `fixture:${i + 2}` }))
    const { observations, errors } = normalizeObservations(located, localRegistries)
    expect(errors).toEqual([])
    const { summaries } = deriveDataset(observations, localRegistries)
    const papaya = summaries.find((s) => s.productId === 'papaya')!
    expect(papaya.primaryOrigins).toHaveLength(3)
    expect(papaya.localShareOfKnown).toBeCloseTo(8 / 12, 3)
    // Summing the truncated list would give 0.5 — the bug this guards against.
    const truncatedSum = papaya.primaryOrigins
      .filter((o) => o.isLocal)
      .reduce((acc, o) => acc + o.share, 0)
    expect(truncatedSum).toBeLessThan(papaya.localShareOfKnown!)

    const uva = summaries.find((s) => s.productId === 'uva')!
    expect(uva.evidence.originKnownRatio).toBe(0)
    expect(uva.localShareOfKnown).toBeNull()
  })
})
