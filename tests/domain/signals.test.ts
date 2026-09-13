import { describe, expect, it } from 'vitest'
import type { Origin } from '../../src/lib/data/types'
import { availabilityLevelScore, availabilitySignal } from '../../src/lib/domain/availability'
import { isLocalOrigin, localShareSignal } from '../../src/lib/domain/localShare'
import { presenceProbability } from '../../src/lib/domain/presence'

describe('presenceProbability', () => {
  it('computes yearsPresent / yearsObserved', () => {
    expect(
      presenceProbability({
        yearsObserved: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
        yearsPresent: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      }),
    ).toBeCloseTo(0.8)
  })

  it('returns null when NO report covers the week (missing report ≠ absence)', () => {
    expect(presenceProbability({ yearsObserved: [], yearsPresent: [] })).toBeNull()
  })

  it('returns 0 when reports exist but the product never appears', () => {
    expect(presenceProbability({ yearsObserved: [2024, 2025], yearsPresent: [] })).toBe(0)
  })

  it('rejects presence without report coverage (upstream coverage bug)', () => {
    expect(() =>
      presenceProbability({ yearsObserved: [2024], yearsPresent: [2023] }),
    ).toThrow(/coverage/)
    expect(() => presenceProbability({ yearsObserved: [], yearsPresent: [2023] })).toThrow()
  })

  it('accepts Sets as well as arrays', () => {
    expect(
      presenceProbability({ yearsObserved: new Set([2024, 2025]), yearsPresent: new Set([2024]) }),
    ).toBe(0.5)
  })
})

describe('availability', () => {
  it('maps levels through the methodology constants', () => {
    expect(availabilityLevelScore('scarce')).toBe(0.2)
    expect(availabilityLevelScore('normal')).toBe(0.6)
    expect(availabilityLevelScore('abundant')).toBe(1.0)
    expect(availabilityLevelScore('unknown')).toBeNull()
  })

  it('averages known levels and ignores unknown', () => {
    expect(availabilitySignal(['scarce', 'abundant'])).toBeCloseTo(0.6)
    expect(availabilitySignal(['abundant', 'unknown', 'unknown'])).toBe(1.0)
  })

  it('returns null for empty or all-unknown inputs', () => {
    expect(availabilitySignal([])).toBeNull()
    expect(availabilitySignal(['unknown', 'unknown'])).toBeNull()
  })
})

const scRegion: Origin = {
  id: 'bo-sc-valles',
  label: 'Valles Cruceños',
  country: 'Bolivia',
  department: 'Santa Cruz',
  region: 'Valles Cruceños',
  level: 'region',
}
const scDept: Origin = {
  id: 'bo-sc',
  label: 'Santa Cruz',
  country: 'Bolivia',
  department: 'Santa Cruz',
  level: 'department',
}
const cbba: Origin = {
  id: 'bo-cb',
  label: 'Cochabamba',
  country: 'Bolivia',
  department: 'Cochabamba',
  level: 'department',
}
const argentina: Origin = {
  id: 'ar',
  label: 'Argentina',
  country: 'Argentina',
  level: 'country',
}

describe('isLocalOrigin', () => {
  it('is true anywhere within the Santa Cruz department', () => {
    expect(isLocalOrigin(scDept)).toBe(true)
    expect(isLocalOrigin(scRegion)).toBe(true)
  })

  it('is false for other departments and countries', () => {
    expect(isLocalOrigin(cbba)).toBe(false)
    expect(isLocalOrigin(argentina)).toBe(false)
  })
})

describe('localShareSignal', () => {
  it('excludes unknown origins from the denominator', () => {
    expect(localShareSignal([scDept, null, null, cbba])).toBeCloseTo(0.5)
    expect(localShareSignal([scRegion, null])).toBe(1)
  })

  it('returns null when no origin is known (never fakes locality)', () => {
    expect(localShareSignal([])).toBeNull()
    expect(localShareSignal([null, null, null])).toBeNull()
  })

  it('is 0 when all known origins are elsewhere', () => {
    expect(localShareSignal([argentina, cbba])).toBe(0)
  })
})
