import { describe, expect, it } from 'vitest'
import {
  cyclicIndex,
  cyclicWeekDistance,
  rangeContains,
  rangeLength,
  rangesFromMask,
  smoothCircular,
} from '../../src/lib/domain/cyclic'

function maskFor(weeks: number[], n = 52): boolean[] {
  const mask = new Array<boolean>(n).fill(false)
  for (const w of weeks) mask[w - 1] = true
  return mask
}

function weekSpan(start: number, end: number): number[] {
  // Inclusive cyclic span of week numbers, wrapping at 52.
  const out: number[] = []
  let w = start
  for (;;) {
    out.push(w)
    if (w === end) return out
    w = (w % 52) + 1
  }
}

describe('cyclicIndex', () => {
  it('wraps negative and overflowing indexes', () => {
    expect(cyclicIndex(-1, 52)).toBe(51)
    expect(cyclicIndex(52, 52)).toBe(0)
    expect(cyclicIndex(105, 52)).toBe(1)
    expect(cyclicIndex(0, 52)).toBe(0)
  })

  it('rejects non-positive cycle length', () => {
    expect(() => cyclicIndex(1, 0)).toThrow()
  })
})

describe('cyclicWeekDistance', () => {
  it('treats December and January as adjacent', () => {
    expect(cyclicWeekDistance(52, 1)).toBe(1)
    expect(cyclicWeekDistance(1, 52)).toBe(1)
    expect(cyclicWeekDistance(48, 8)).toBe(12)
    expect(cyclicWeekDistance(1, 27)).toBe(26)
    expect(cyclicWeekDistance(7, 7)).toBe(0)
  })
})

describe('smoothCircular', () => {
  it('returns [] for an empty series', () => {
    expect(smoothCircular([])).toEqual([])
  })

  it('keeps a constant series constant', () => {
    const values = new Array<number>(52).fill(0.6)
    for (const v of smoothCircular(values)) expect(v).toBeCloseTo(0.6, 12)
  })

  it('wraps the year boundary (impulse response)', () => {
    const values = [1, 0, 0, 0, 0, 0, 0, 0]
    const out = smoothCircular(values, [1, 2, 3, 2, 1])
    expect(out[0]).toBeCloseTo(3 / 9)
    expect(out[1]).toBeCloseTo(2 / 9)
    expect(out[2]).toBeCloseTo(1 / 9)
    expect(out[3]).toBeCloseTo(0)
    expect(out[6]).toBeCloseTo(1 / 9) // wrapped
    expect(out[7]).toBeCloseTo(2 / 9) // wrapped
  })

  it('treats null as missing, not zero (renormalizes weights)', () => {
    const values = [null, 1, null, null, null, null, null, null]
    const out = smoothCircular(values, [1, 2, 3, 2, 1])
    expect(out[1]).toBe(1) // only contributor in its own window
    expect(out[3]).toBe(1) // index 1 is the only data in the window
    expect(out[4]).toBeNull() // window indexes 2..6 are all null
  })

  it('returns all null for an all-null series', () => {
    const out = smoothCircular(new Array<number | null>(52).fill(null))
    expect(out).toHaveLength(52)
    expect(out.every((v) => v === null)).toBe(true)
  })

  it('rejects invalid kernels', () => {
    expect(() => smoothCircular([1, 2], [1, 1])).toThrow(/odd/)
    expect(() => smoothCircular([1, 2], [1, -1, 1])).toThrow()
    expect(() => smoothCircular([1, 2], [0, 0, 0])).toThrow()
  })
})

describe('rangeLength', () => {
  it('measures plain and wrapping ranges', () => {
    expect(rangeLength({ startWeek: 10, endWeek: 20 })).toBe(11)
    expect(rangeLength({ startWeek: 5, endWeek: 5 })).toBe(1)
    expect(rangeLength({ startWeek: 48, endWeek: 8 })).toBe(13) // Dec→Feb wrap
    expect(rangeLength({ startWeek: 1, endWeek: 52 })).toBe(52)
  })

  it('rejects out-of-range weeks', () => {
    expect(() => rangeLength({ startWeek: 0, endWeek: 5 })).toThrow()
    expect(() => rangeLength({ startWeek: 5, endWeek: 53 })).toThrow()
  })
})

describe('rangeContains', () => {
  it('handles wrapping ranges (December→February)', () => {
    const dic_feb = { startWeek: 48, endWeek: 8 }
    for (const w of [48, 52, 1, 8]) expect(rangeContains(dic_feb, w)).toBe(true)
    for (const w of [9, 20, 47]) expect(rangeContains(dic_feb, w)).toBe(false)
  })

  it('handles plain ranges', () => {
    const r = { startWeek: 10, endWeek: 20 }
    expect(rangeContains(r, 10)).toBe(true)
    expect(rangeContains(r, 20)).toBe(true)
    expect(rangeContains(r, 9)).toBe(false)
    expect(rangeContains(r, 21)).toBe(false)
  })
})

describe('rangesFromMask', () => {
  it('returns [] for empty and all-false masks', () => {
    expect(rangesFromMask([])).toEqual([])
    expect(rangesFromMask(new Array<boolean>(52).fill(false))).toEqual([])
  })

  it('returns the full year for an all-true mask', () => {
    expect(rangesFromMask(new Array<boolean>(52).fill(true))).toEqual([
      { startWeek: 1, endWeek: 52 },
    ])
  })

  it('merges runs across the year boundary (December→February)', () => {
    const mask = maskFor(weekSpan(48, 8))
    expect(rangesFromMask(mask)).toEqual([{ startWeek: 48, endWeek: 8 }])
  })

  it('extracts January→March without wrapping artifacts', () => {
    expect(rangesFromMask(maskFor(weekSpan(1, 13)))).toEqual([{ startWeek: 1, endWeek: 13 }])
  })

  it('extracts November→December runs ending at week 52', () => {
    expect(rangesFromMask(maskFor(weekSpan(44, 52)))).toEqual([{ startWeek: 44, endWeek: 52 }])
  })

  it('finds multiple disjoint ranges, sorted by start', () => {
    const mask = maskFor([...weekSpan(30, 35), ...weekSpan(5, 10)])
    expect(rangesFromMask(mask)).toEqual([
      { startWeek: 5, endWeek: 10 },
      { startWeek: 30, endWeek: 35 },
    ])
  })

  it('handles single-week seasons', () => {
    expect(rangesFromMask(maskFor([7]))).toEqual([{ startWeek: 7, endWeek: 7 }])
  })
})
