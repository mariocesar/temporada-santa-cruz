import { describe, expect, it } from 'vitest'
import { WEEK_BINS } from '../../src/lib/domain/methodology'
import {
  formatRangeAsMonths,
  formatRangesAsMonths,
  MONTH_NAMES_ES,
  monthAxisTicks,
  monthOfWeekBin,
  weekBinForMonth,
} from '../../src/lib/domain/months'

describe('weekBinForMonth', () => {
  it('returns a valid bin for every month', () => {
    for (let m = 1; m <= 12; m++) {
      const bin = weekBinForMonth(m)
      expect(bin).toBeGreaterThanOrEqual(1)
      expect(bin).toBeLessThanOrEqual(WEEK_BINS)
    }
  })

  it('is monotonically increasing across the year', () => {
    for (let m = 2; m <= 12; m++) {
      expect(weekBinForMonth(m)).toBeGreaterThan(weekBinForMonth(m - 1))
    }
  })

  it('lands mid-month: January → week 3, December → week 50', () => {
    expect(weekBinForMonth(1)).toBe(3)
    expect(weekBinForMonth(12)).toBe(50)
  })

  it('rejects invalid months', () => {
    expect(() => weekBinForMonth(0)).toThrow()
    expect(() => weekBinForMonth(13)).toThrow()
    expect(() => weekBinForMonth(1.5)).toThrow()
  })
})

describe('monthOfWeekBin', () => {
  it('maps boundary bins to the expected months', () => {
    expect(monthOfWeekBin(1)).toBe(1) // enero
    expect(monthOfWeekBin(52)).toBe(12) // diciembre
  })

  it('round-trips through weekBinForMonth for every month', () => {
    for (let m = 1; m <= 12; m++) {
      expect(monthOfWeekBin(weekBinForMonth(m))).toBe(m)
    }
  })

  it('never decreases across the year', () => {
    for (let w = 2; w <= WEEK_BINS; w++) {
      expect(monthOfWeekBin(w)).toBeGreaterThanOrEqual(monthOfWeekBin(w - 1))
    }
  })

  it('rejects out-of-range bins', () => {
    expect(() => monthOfWeekBin(0)).toThrow()
    expect(() => monthOfWeekBin(53)).toThrow()
  })
})

describe('formatRangeAsMonths', () => {
  it('formats a wrapping December–February range', () => {
    expect(formatRangeAsMonths({ startWeek: 49, endWeek: 6 })).toBe('diciembre – febrero')
  })

  it('formats a same-month range as a single month', () => {
    expect(formatRangeAsMonths({ startWeek: 2, endWeek: 4 })).toBe('enero')
  })

  it('labels a full-year range as todo el año, wherever it starts', () => {
    expect(formatRangeAsMonths({ startWeek: 1, endWeek: 52 })).toBe('todo el año')
    expect(formatRangeAsMonths({ startWeek: 30, endWeek: 29 })).toBe('todo el año')
  })

  it('labels a wrapping range with same-month endpoints as casi todo el año', () => {
    // 51 weeks starting and ending in noviembre must never read as "noviembre".
    expect(formatRangeAsMonths({ startWeek: 46, endWeek: 44 })).toBe('casi todo el año')
    expect(formatRangeAsMonths({ startWeek: 52, endWeek: 50 })).toBe('casi todo el año')
  })

  it('still labels short same-month and ordinary wrapping ranges normally', () => {
    expect(formatRangeAsMonths({ startWeek: 2, endWeek: 4 })).toBe('enero')
    expect(formatRangeAsMonths({ startWeek: 49, endWeek: 6 })).toBe('diciembre – febrero')
  })

  it('joins multiple ranges with a separator', () => {
    expect(
      formatRangesAsMonths([
        { startWeek: 49, endWeek: 6 },
        { startWeek: 23, endWeek: 27 },
      ]),
    ).toBe('diciembre – febrero · junio – julio')
  })
})

describe('monthAxisTicks', () => {
  it('emits 12 ticks in ascending x order within the 364-unit grid', () => {
    const ticks = monthAxisTicks()
    expect(ticks).toHaveLength(12)
    expect(ticks[0]).toEqual({ month: 1, x: 0 })
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]!.x).toBeGreaterThan(ticks[i - 1]!.x)
      expect(ticks[i]!.x).toBeLessThan(364)
    }
  })
})

describe('month names', () => {
  it('has 12 lowercase Spanish month names', () => {
    expect(MONTH_NAMES_ES).toHaveLength(12)
    expect(MONTH_NAMES_ES[0]).toBe('enero')
    expect(MONTH_NAMES_ES[11]).toBe('diciembre')
  })
})
