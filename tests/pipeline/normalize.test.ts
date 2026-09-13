import { describe, expect, it } from 'vitest'
import type { DataSource, Origin, Product } from '../../src/lib/data/types'
import { observationId } from '../../scripts/data/lib/id'
import { normalizeObservations, type LocatedRow } from '../../scripts/data/lib/pipeline'
import { buildRegistries, type UnitDef } from '../../scripts/data/lib/registry'
import type { RawCsvRow } from '../../scripts/data/schemas'

const products: Product[] = [
  { id: 'papaya', slug: 'papaya', nameEs: 'Papaya', aliases: ['papaya'], category: 'fruit' },
]
const origins: Origin[] = [
  {
    id: 'bo-santa-cruz',
    label: 'Santa Cruz',
    country: 'Bolivia',
    department: 'Santa Cruz',
    level: 'department',
    aliases: ['sta. cruz'],
  },
]
const units: UnitDef[] = [
  { id: 'kg', canonical: 'kg', aliases: ['kg'], knownWeightKg: 1, conversionConfidence: 1 },
]
const sources: DataSource[] = [
  { id: 'cao', name: 'CAO', publisher: 'CAO', kind: 'original' },
  { id: 'cao-espejo', name: 'Espejo CAO', publisher: 'Otro', kind: 'mirror', mirrorOf: 'cao' },
  { id: 'demo', name: 'DEMO fuente', publisher: 'Demo', kind: 'original', synthetic: true },
]

const registries = buildRegistries(products, origins, units, sources)

function row(overrides: Partial<RawCsvRow>): RawCsvRow {
  return {
    observed_at: '2024-04-08',
    source_id: 'cao',
    report_id: 'cao-2024-15',
    market: 'Abasto',
    product_raw: 'Papaya',
    origin_raw: 'Santa Cruz',
    variety_raw: '',
    quality: '',
    availability: 'A',
    wholesale_price: '4.50',
    wholesale_unit: 'kg',
    retail_price: '',
    retail_unit: '',
    ...overrides,
  }
}

function located(rows: RawCsvRow[]): LocatedRow[] {
  return rows.map((r, i) => ({ row: r, location: `test.csv:${i + 2}` }))
}

describe('observationId', () => {
  it('is deterministic and sensitive to identity fields', () => {
    const base = {
      originalSourceId: 'cao',
      reportId: 'cao-2024-15',
      observedAt: '2024-04-08',
      market: 'Abasto',
      productRaw: 'Papaya',
      originRaw: 'Santa Cruz',
      varietyRaw: '',
      quality: '',
    }
    expect(observationId(base)).toBe(observationId({ ...base }))
    expect(observationId(base)).not.toBe(observationId({ ...base, reportId: 'cao-2024-16' }))
    expect(observationId(base)).not.toBe(observationId({ ...base, productRaw: 'Piña' }))
    expect(observationId(base)).toMatch(/^obs_[0-9a-f]{16}$/)
  })

  it('does not collide when field contents shift between fields', () => {
    const a = observationId({
      originalSourceId: 'cao',
      reportId: 'r1',
      observedAt: '2024-04-08',
      market: '',
      productRaw: 'ab',
      originRaw: 'c',
      varietyRaw: '',
      quality: '',
    })
    const b = observationId({
      originalSourceId: 'cao',
      reportId: 'r1',
      observedAt: '2024-04-08',
      market: '',
      productRaw: 'a',
      originRaw: 'bc',
      varietyRaw: '',
      quality: '',
    })
    expect(a).not.toBe(b)
  })
})

describe('normalizeObservations', () => {
  it('preserves raw strings beside canonical values', () => {
    const { observations, errors } = normalizeObservations(
      located([row({ product_raw: 'PAPAYA', origin_raw: 'Sta. Cruz', availability: 'Abundante' })]),
      registries,
    )
    expect(errors).toEqual([])
    const obs = observations[0]!
    expect(obs.productId).toBe('papaya')
    expect(obs.productRaw).toBe('PAPAYA')
    expect(obs.originId).toBe('bo-santa-cruz')
    expect(obs.originRaw).toBe('Sta. Cruz')
    expect(obs.originNormalization).toBe('alias')
    expect(obs.availability).toBe('abundant')
    expect(obs.availabilityRaw).toBe('Abundante')
    expect(obs.synthetic).toBe(false)
  })

  it('marks records from synthetic sources', () => {
    const { observations } = normalizeObservations(
      located([row({ source_id: 'demo', report_id: 'demo-1' })]),
      registries,
    )
    expect(observations[0]!.synthetic).toBe(true)
  })

  it('rejects exact duplicates within the same source', () => {
    const { observations, errors } = normalizeObservations(located([row({}), row({})]), registries)
    expect(observations).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/exact duplicate/)
  })

  it('collapses a mirror of the same report into one observation (§66–67)', () => {
    const { observations, errors } = normalizeObservations(
      located([row({}), row({ source_id: 'cao-espejo' })]),
      registries,
    )
    expect(errors).toEqual([])
    expect(observations).toHaveLength(1)
    const obs = observations[0]!
    expect(obs.sourceId).toBe('cao') // the original wins
    expect(obs.originalSourceId).toBe('cao')
  })

  it('keeps the original record no matter the mirror import order', () => {
    const { observations } = normalizeObservations(
      located([row({ source_id: 'cao-espejo' }), row({})]),
      registries,
    )
    expect(observations).toHaveLength(1)
    expect(observations[0]!.sourceId).toBe('cao')
  })

  it('fails when a mirror disagrees with the original', () => {
    const { errors } = normalizeObservations(
      located([row({}), row({ source_id: 'cao-espejo', wholesale_price: '9.99' })]),
      registries,
    )
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/mirror disagrees/)
  })

  it('reports unknown products, origins, units and availability with location', () => {
    const { errors } = normalizeObservations(
      located([
        row({ product_raw: 'Carambola' }),
        row({ origin_raw: 'Marte' }),
        row({ wholesale_unit: 'fanega' }),
        row({ availability: 'muchísima' }),
      ]),
      registries,
    )
    expect(errors).toHaveLength(4)
    expect(errors[0]).toMatch(/test.csv:2: unknown product "Carambola"/)
    expect(errors[1]).toMatch(/unknown origin/)
    expect(errors[2]).toMatch(/unknown unit/)
    expect(errors[3]).toMatch(/unrecognized availability/)
  })

  it('rejects impossible dates', () => {
    const { errors } = normalizeObservations(
      located([row({ observed_at: '2024-02-31' })]),
      registries,
    )
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/Impossible/)
  })

  it('handles empty input', () => {
    expect(normalizeObservations([], registries)).toEqual({ observations: [], errors: [] })
  })
})
