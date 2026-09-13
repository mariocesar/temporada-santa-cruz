import { describe, expect, it } from 'vitest'
import { MONTH_WEEK_SPANS, WEEK_BINS } from '../../src/lib/domain/methodology'
import { MONTH_START_DAY } from '../../src/lib/domain/months'
import {
  formatReferenceRanges,
  maskForWindows,
  referenceBasis,
  referenceRanges,
} from '../../src/lib/domain/referenceSeason'

describe('MONTH_WEEK_SPANS', () => {
  it('has one inclusive, in-bounds span per month', () => {
    expect(MONTH_WEEK_SPANS).toHaveLength(12)
    for (const span of MONTH_WEEK_SPANS) {
      expect(span.startWeek).toBeGreaterThanOrEqual(1)
      expect(span.endWeek).toBeLessThanOrEqual(WEEK_BINS)
      // No month wraps the year boundary by itself.
      expect(span.startWeek).toBeLessThanOrEqual(span.endWeek)
    }
  })

  it('starts in week 1, ends in week 52, and never authors week 53', () => {
    expect(MONTH_WEEK_SPANS[0]!.startWeek).toBe(1)
    expect(MONTH_WEEK_SPANS[11]!.endWeek).toBe(WEEK_BINS)
    expect(MONTH_WEEK_SPANS.every((s) => s.endWeek <= 52)).toBe(true)
  })

  it('covers every week bin with no gaps between consecutive months', () => {
    const covered = new Array<boolean>(WEEK_BINS).fill(false)
    for (const span of MONTH_WEEK_SPANS) {
      for (let bin = span.startWeek; bin <= span.endWeek; bin++) covered[bin - 1] = true
    }
    expect(covered.every(Boolean)).toBe(true)
    for (let m = 1; m < 12; m++) {
      // Next month starts at or right after the previous month's end.
      expect(MONTH_WEEK_SPANS[m]!.startWeek).toBeLessThanOrEqual(
        MONTH_WEEK_SPANS[m - 1]!.endWeek + 1,
      )
      expect(MONTH_WEEK_SPANS[m]!.startWeek).toBeGreaterThan(MONTH_WEEK_SPANS[m - 1]!.startWeek)
    }
  })

  it('matches the non-leap day-of-year projection used by months.ts', () => {
    for (let m = 0; m < 12; m++) {
      const firstDay = MONTH_START_DAY[m]!
      const lastDay = m === 11 ? 364 : MONTH_START_DAY[m + 1]! - 1
      expect(MONTH_WEEK_SPANS[m]).toEqual({
        startWeek: Math.min(WEEK_BINS, Math.floor(firstDay / 7) + 1),
        endWeek: Math.min(WEEK_BINS, Math.floor(lastDay / 7) + 1),
      })
    }
  })
})

describe('maskForWindows / referenceRanges', () => {
  it('projects a single month onto its span', () => {
    expect(referenceRanges([{ startMonth: 2, endMonth: 2 }])).toEqual([
      { startWeek: 5, endWeek: 9 },
    ])
  })

  it('wraps octubre–febrero across the year boundary into one range', () => {
    expect(referenceRanges([{ startMonth: 10, endMonth: 2 }])).toEqual([
      { startWeek: 40, endWeek: 9 },
    ])
  })

  it('collapses enero–diciembre to the full-year range', () => {
    expect(referenceRanges([{ startMonth: 1, endMonth: 12 }])).toEqual([
      { startWeek: 1, endWeek: WEEK_BINS },
    ])
  })

  it('collapses a wrapping 12-month window (marzo–febrero) to the full year', () => {
    // Cyclic month walking, not endpoint arithmetic: mar..feb is every month,
    // so the mask is full — NOT the single-bin range 9..9.
    expect(referenceRanges([{ startMonth: 3, endMonth: 2 }])).toEqual([
      { startWeek: 1, endWeek: WEEK_BINS },
    ])
  })

  it('merges overlapping windows and sorts disjoint ranges by start week', () => {
    expect(
      referenceRanges([
        { startMonth: 11, endMonth: 12 },
        { startMonth: 5, endMonth: 6 },
      ]),
    ).toEqual([
      { startWeek: 18, endWeek: 26 },
      { startWeek: 44, endWeek: 52 },
    ])
    // Adjacent months share their boundary bin, so consecutive windows merge.
    expect(
      referenceRanges([
        { startMonth: 1, endMonth: 2 },
        { startMonth: 2, endMonth: 4 },
      ]),
    ).toEqual([{ startWeek: 1, endWeek: 18 }])
  })

  it('supports week windows, including year wrap', () => {
    expect(referenceRanges([{ startWeek: 50, endWeek: 4 }])).toEqual([
      { startWeek: 50, endWeek: 4 },
    ])
    const mask = maskForWindows([{ startWeek: 50, endWeek: 4 }])
    expect(mask.filter(Boolean)).toHaveLength(7)
    expect(mask[49] && mask[51] && mask[0] && mask[3]).toBe(true)
    expect(mask[4]).toBe(false)
  })

  it('rejects out-of-range months and week bins (week 53 is never authorable)', () => {
    expect(() => maskForWindows([{ startMonth: 0, endMonth: 3 }])).toThrow()
    expect(() => maskForWindows([{ startMonth: 1, endMonth: 13 }])).toThrow()
    expect(() => maskForWindows([{ startWeek: 53, endWeek: 2 }])).toThrow()
    expect(() => maskForWindows([{ startWeek: 1, endWeek: 0 }])).toThrow()
  })

  it('returns no ranges for no windows', () => {
    expect(referenceRanges([])).toEqual([])
  })
})

describe('referenceBasis', () => {
  it('derives literature, census, and mixed bases', () => {
    expect(referenceBasis(['literature'])).toBe('literature')
    expect(referenceBasis(['literature', 'literature'])).toBe('literature')
    expect(referenceBasis(['census'])).toBe('census')
    expect(referenceBasis(['literature', 'census'])).toBe('mixed')
  })

  it('throws on market sources and on empty citations', () => {
    expect(() => referenceBasis(['market'])).toThrow(/market/i)
    expect(() => referenceBasis(['literature', 'market'])).toThrow(/market/i)
    expect(() => referenceBasis([])).toThrow(/without cited sources/i)
  })
})

describe('formatReferenceRanges', () => {
  it('labels month-authored ranges with their authored months', () => {
    expect(formatReferenceRanges(referenceRanges([{ startMonth: 10, endMonth: 2 }]))).toBe(
      'aprox. oct – feb',
    )
    expect(formatReferenceRanges(referenceRanges([{ startMonth: 2, endMonth: 2 }]))).toBe(
      'aprox. feb',
    )
  })

  it('labels the full-year range as an estimate', () => {
    expect(formatReferenceRanges([{ startWeek: 1, endWeek: WEEK_BINS }])).toBe(
      'todo el año (estimado)',
    )
  })

  it('joins multiple ranges', () => {
    expect(
      formatReferenceRanges(
        referenceRanges([
          { startMonth: 11, endMonth: 12 },
          { startMonth: 5, endMonth: 6 },
        ]),
      ),
    ).toBe('aprox. may – jun · nov – dic')
  })

  it('approximates week-authored endpoints by their midpoint month', () => {
    expect(formatReferenceRanges([{ startWeek: 6, endWeek: 20 }])).toBe('aprox. feb – may')
  })

  it('never labels a near-full wrapping range with a bare month name', () => {
    expect(formatReferenceRanges([{ startWeek: 7, endWeek: 6 }])).toBe('aprox. casi todo el año')
  })
})
