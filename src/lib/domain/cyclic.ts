/**
 * Cyclic-calendar utilities (PROJECT.md §38, §53). The year is a circle:
 * December and January are adjacent, so smoothing and ranges must wrap.
 *
 * Weekly series are arrays of length WEEK_BINS where index i holds the value
 * for week bin i+1. `null` means "no evidence", which is different from 0.
 */

import { SMOOTHING_KERNEL, WEEK_BINS } from './methodology'
import type { SeasonRange } from '../data/types'

/** Wrap an arbitrary integer offset into a valid array index [0, n). */
export function cyclicIndex(i: number, n: number = WEEK_BINS): number {
  if (n <= 0) throw new Error(`Cycle length must be positive: ${n}`)
  return ((i % n) + n) % n
}

/** Shortest cyclic distance between two week bins (1-based), in [0, n/2]. */
export function cyclicWeekDistance(a: number, b: number, n: number = WEEK_BINS): number {
  const d = Math.abs(cyclicIndex(a - 1, n) - cyclicIndex(b - 1, n))
  return Math.min(d, n - d)
}

/**
 * Circular weighted moving average with null-awareness.
 *
 * - The kernel must have odd length; it is centered on each position.
 * - Null neighbors are skipped and the remaining kernel weights are
 *   renormalized (a missing week is NOT treated as zero).
 * - A window containing no data at all yields null.
 * - An empty series returns an empty array.
 */
export function smoothCircular(
  values: ReadonlyArray<number | null>,
  kernel: ReadonlyArray<number> = SMOOTHING_KERNEL,
): Array<number | null> {
  const n = values.length
  if (n === 0) return []
  if (kernel.length % 2 !== 1) {
    throw new Error(`Smoothing kernel must have odd length, got ${kernel.length}`)
  }
  if (kernel.some((w) => w < 0) || kernel.every((w) => w === 0)) {
    throw new Error('Smoothing kernel weights must be non-negative and not all zero')
  }
  const radius = (kernel.length - 1) / 2
  const out: Array<number | null> = new Array(n).fill(null)
  for (let i = 0; i < n; i++) {
    let sum = 0
    let weight = 0
    for (let k = -radius; k <= radius; k++) {
      const v = values[cyclicIndex(i + k, n)]
      if (v === null || v === undefined) continue
      const w = kernel[k + radius]!
      sum += v * w
      weight += w
    }
    out[i] = weight > 0 ? sum / weight : null
  }
  return out
}

/** Number of week bins covered by an inclusive cyclic range. */
export function rangeLength(range: SeasonRange, n: number = WEEK_BINS): number {
  assertValidWeek(range.startWeek, n)
  assertValidWeek(range.endWeek, n)
  if (range.startWeek <= range.endWeek) return range.endWeek - range.startWeek + 1
  return n - range.startWeek + 1 + range.endWeek
}

/** Whether a week bin falls inside an inclusive cyclic range. */
export function rangeContains(range: SeasonRange, week: number, n: number = WEEK_BINS): boolean {
  assertValidWeek(range.startWeek, n)
  assertValidWeek(range.endWeek, n)
  assertValidWeek(week, n)
  if (range.startWeek <= range.endWeek) {
    return week >= range.startWeek && week <= range.endWeek
  }
  return week >= range.startWeek || week <= range.endWeek
}

/**
 * Extract maximal cyclic ranges from a boolean weekly mask.
 *
 * - `mask[i]` refers to week bin i+1.
 * - Runs that touch both ends of the array merge across the year boundary
 *   (e.g. weeks 48..52 + 1..8 become one range 48..8).
 * - An all-true mask yields the single full-year range {1, n}.
 * - An all-false or empty mask yields [].
 * - Ranges are returned sorted by start week.
 */
export function rangesFromMask(mask: ReadonlyArray<boolean>): SeasonRange[] {
  const n = mask.length
  if (n === 0) return []
  if (mask.every(Boolean)) return [{ startWeek: 1, endWeek: n }]
  if (!mask.some(Boolean)) return []

  const ranges: SeasonRange[] = []
  // Start scanning right after a false so every run is seen exactly once.
  const firstFalse = mask.findIndex((v) => !v)
  let runStart: number | null = null
  for (let step = 1; step <= n; step++) {
    const i = cyclicIndex(firstFalse + step, n)
    if (mask[i] && runStart === null) runStart = i
    if (runStart !== null) {
      const next = cyclicIndex(i + 1, n)
      if (!mask[next]) {
        ranges.push({ startWeek: runStart + 1, endWeek: i + 1 })
        runStart = null
      }
    }
  }
  return ranges.sort((a, b) => a.startWeek - b.startWeek)
}

function assertValidWeek(week: number, n: number): void {
  if (!Number.isInteger(week) || week < 1 || week > n) {
    throw new Error(`Week bin out of range 1..${n}: ${week}`)
  }
}
