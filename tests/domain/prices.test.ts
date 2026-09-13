import { describe, expect, it } from 'vitest'
import {
  comparablePricePerKg,
  median,
  relativePrices,
  relativePriceToScore,
  weeklyPriceSignal,
  type ComparablePrice,
} from '../../src/lib/domain/prices'

describe('median', () => {
  it('handles empty, odd, and even inputs', () => {
    expect(median([])).toBeNull()
    expect(median([4])).toBe(4)
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 10])).toBe(2.5)
  })
})

describe('comparablePricePerKg', () => {
  const kg = { raw: 'kg', canonical: 'kg', knownWeightKg: 1, conversionConfidence: 1 }
  const lb = { raw: 'lb', canonical: 'lb', knownWeightKg: 0.4536, conversionConfidence: 1 }
  const caja = { raw: 'caja', canonical: 'caja' } // package unit: no weight
  const dubious = { raw: 'bolsa', canonical: 'bolsa', knownWeightKg: 20, conversionConfidence: 0.3 }

  it('converts weight units with confident conversions', () => {
    expect(comparablePricePerKg(10, kg)).toBe(10)
    expect(comparablePricePerKg(4.536, lb)).toBeCloseTo(10)
  })

  it('refuses incompatible or dubious units (no fake precision)', () => {
    expect(comparablePricePerKg(50, caja)).toBeNull()
    expect(comparablePricePerKg(50, dubious)).toBeNull()
    expect(comparablePricePerKg(50, undefined)).toBeNull()
    expect(comparablePricePerKg(undefined, kg)).toBeNull()
  })

  it('rejects negative and non-finite prices loudly', () => {
    expect(() => comparablePricePerKg(-1, kg)).toThrow(/Negative/)
    expect(() => comparablePricePerKg(Number.NaN, kg)).toThrow(/Non-finite/)
    expect(() => comparablePricePerKg(Number.POSITIVE_INFINITY, kg)).toThrow(/Non-finite/)
  })
})

function obs(isoYear: number, bin: number, pricePerKg: number): ComparablePrice {
  return { isoYear, bin, pricePerKg }
}

describe('relativePrices', () => {
  it('drops years with too small a sample for a trustworthy median', () => {
    // 3 observations < minObservationsPerYearMedian (5) → year dropped.
    expect(relativePrices([obs(2024, 1, 10), obs(2024, 2, 12), obs(2024, 3, 8)])).toEqual([])
  })

  it('normalizes against the same year’s median', () => {
    const year = [obs(2024, 1, 5), obs(2024, 2, 10), obs(2024, 3, 10), obs(2024, 4, 10), obs(2024, 5, 20)]
    const rel = relativePrices(year)
    expect(rel).toHaveLength(5)
    expect(rel.find((r) => r.bin === 1)?.relative).toBeCloseTo(0.5)
    expect(rel.find((r) => r.bin === 5)?.relative).toBeCloseTo(2)
  })

  it('returns [] for empty input', () => {
    expect(relativePrices([])).toEqual([])
  })

  it('rejects non-finite comparable prices instead of skewing medians', () => {
    expect(() => relativePrices([obs(2024, 1, Number.POSITIVE_INFINITY)])).toThrow(/Non-finite/)
    expect(() => relativePrices([obs(2024, 1, Number.NaN)])).toThrow(/Non-finite/)
  })
})

describe('relativePriceToScore', () => {
  it('maps cheap→1, year-normal→0.5, expensive→0, clamped', () => {
    expect(relativePriceToScore(0.75)).toBe(1)
    expect(relativePriceToScore(1)).toBeCloseTo(0.5)
    expect(relativePriceToScore(1.25)).toBe(0)
    expect(relativePriceToScore(0.1)).toBe(1)
    expect(relativePriceToScore(3)).toBe(0)
  })
})

describe('weeklyPriceSignal', () => {
  it('returns all-null for empty input', () => {
    const out = weeklyPriceSignal([], 52)
    expect(out).toHaveLength(52)
    expect(out.every((v) => v === null)).toBe(true)
  })

  it('requires a minimum weekly sample', () => {
    // One year, 5 obs (median trustworthy) but only 1 in bin 9 → bin 9 null.
    const data = [obs(2024, 9, 5), obs(2024, 20, 10), obs(2024, 21, 10), obs(2024, 22, 10), obs(2024, 23, 10)]
    const out = weeklyPriceSignal(data, 52)
    expect(out[8]).toBeNull()
  })

  it('scores weeks that are cheap relative to their year', () => {
    const data = [
      // cheap in weeks 1-2, normal in 20-23 — 8 obs so the median holds.
      obs(2024, 1, 5),
      obs(2024, 1, 5),
      obs(2024, 2, 5),
      obs(2024, 20, 10),
      obs(2024, 20, 10),
      obs(2024, 21, 10),
      obs(2024, 21, 10),
      obs(2024, 22, 10),
    ]
    const out = weeklyPriceSignal(data, 52)
    expect(out[0]).toBe(1) // 5/10 = 0.5 relative → clamped to 1 (very cheap)
    expect(out[19]).toBeCloseTo(0.5) // at the year median
    expect(out[30]).toBeNull() // no data
  })

  it('rejects out-of-range bins', () => {
    expect(() =>
      weeklyPriceSignal(
        [obs(2024, 60, 1), obs(2024, 60, 1), obs(2024, 60, 1), obs(2024, 60, 1), obs(2024, 60, 1)],
        52,
      ),
    ).toThrow(/range/)
  })
})
