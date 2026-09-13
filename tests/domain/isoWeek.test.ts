import { describe, expect, it } from 'vitest'
import { isoWeekOf, toWeekBin, weekBinOf, weeksInIsoYear } from '../../src/lib/domain/isoWeek'

describe('isoWeekOf', () => {
  it('computes known ISO weeks around year boundaries', () => {
    // 2026-01-01 is a Thursday → week 1 of 2026.
    expect(isoWeekOf('2026-01-01')).toEqual({ isoYear: 2026, week: 1 })
    // 2023-01-01 is a Sunday → still week 52 of ISO year 2022.
    expect(isoWeekOf('2023-01-01')).toEqual({ isoYear: 2022, week: 52 })
    // 2024-12-30 (Monday) belongs to week 1 of ISO year 2025.
    expect(isoWeekOf('2024-12-30')).toEqual({ isoYear: 2025, week: 1 })
  })

  it('handles ISO week 53', () => {
    // 2020 is a 53-week ISO year (leap year starting Wednesday).
    expect(isoWeekOf('2020-12-31')).toEqual({ isoYear: 2020, week: 53 })
    expect(isoWeekOf('2021-01-01')).toEqual({ isoYear: 2020, week: 53 })
    expect(isoWeekOf('2021-01-04')).toEqual({ isoYear: 2021, week: 1 })
    // 2015 is a 53-week ISO year (starts Thursday).
    expect(isoWeekOf('2016-01-01')).toEqual({ isoYear: 2015, week: 53 })
    // 2026 is the next 53-week ISO year.
    expect(isoWeekOf('2026-12-28')).toEqual({ isoYear: 2026, week: 53 })
    expect(isoWeekOf('2027-01-03')).toEqual({ isoYear: 2026, week: 53 })
  })

  it('accepts Date objects (UTC)', () => {
    expect(isoWeekOf(new Date(Date.UTC(2020, 11, 31)))).toEqual({ isoYear: 2020, week: 53 })
  })

  it('rejects malformed and impossible dates', () => {
    expect(() => isoWeekOf('garbage')).toThrow()
    expect(() => isoWeekOf('2023-2-1')).toThrow()
    expect(() => isoWeekOf('2023-02-31')).toThrow(/Impossible/)
    expect(() => isoWeekOf('2023-13-01')).toThrow(/Impossible/)
    expect(() => isoWeekOf('')).toThrow()
  })
})

describe('weeksInIsoYear', () => {
  it('identifies 53-week years', () => {
    expect(weeksInIsoYear(2015)).toBe(53)
    expect(weeksInIsoYear(2020)).toBe(53)
    expect(weeksInIsoYear(2026)).toBe(53)
  })

  it('identifies 52-week years', () => {
    for (const year of [2021, 2022, 2023, 2024, 2025, 2027]) {
      expect(weeksInIsoYear(year)).toBe(52)
    }
  })
})

describe('toWeekBin', () => {
  it('folds week 53 into bin 52 and keeps 1..52 as-is', () => {
    expect(toWeekBin(53)).toBe(52)
    expect(toWeekBin(52)).toBe(52)
    expect(toWeekBin(1)).toBe(1)
  })

  it('rejects out-of-range weeks', () => {
    expect(() => toWeekBin(0)).toThrow()
    expect(() => toWeekBin(54)).toThrow()
    expect(() => toWeekBin(1.5)).toThrow()
  })
})

describe('weekBinOf', () => {
  it('maps week-53 dates to bin 52 of the right ISO year', () => {
    expect(weekBinOf('2026-12-31')).toEqual({ isoYear: 2026, bin: 52 })
    expect(weekBinOf('2021-01-02')).toEqual({ isoYear: 2020, bin: 52 })
  })
})
