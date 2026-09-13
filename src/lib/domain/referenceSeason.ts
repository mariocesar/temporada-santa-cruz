/**
 * Reference seasons (estimación bibliográfica, PROJECT.md §104).
 *
 * Pure projection of cited phenology windows — calendar months or ISO-week
 * bins — onto canonical cyclic week ranges. Display-only: nothing here
 * produces per-week scores, touches smoothing, or feeds confidence. The
 * observed-data model is deliberately unaware of this module.
 */

import type { ReferenceSeasonBasis, SeasonRange, SourceType } from '../data/types'
import { cyclicIndex, rangesFromMask } from './cyclic'
import { MONTH_WEEK_SPANS, WEEK_BINS } from './methodology'
import { MONTH_SHORT_ES, monthOfWeekBin } from './months'

/**
 * A cyclic phenology window as authored in data/metadata/phenology.json.
 * Either calendar months (1–12) or week bins (1–52, week 53 is never
 * authorable); start > end wraps the year boundary (§104).
 */
export interface MonthWindow {
  startMonth: number
  endMonth: number
}

export interface WeekWindow {
  startWeek: number
  endWeek: number
}

export type PhenologyWindow = MonthWindow | WeekWindow

export function isMonthWindow(window: PhenologyWindow): window is MonthWindow {
  return 'startMonth' in window
}

function assertMonth(month: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Phenology month out of range 1..12: ${month}`)
  }
}

function assertWeek(week: number): void {
  if (!Number.isInteger(week) || week < 1 || week > WEEK_BINS) {
    throw new Error(`Phenology week bin out of range 1..${WEEK_BINS}: ${week}`)
  }
}

/**
 * Weekly boolean mask covered by a set of windows. Month windows cover every
 * bin of every month they span (via MONTH_WEEK_SPANS, so boundary bins that
 * straddle two months are included); week windows cover their bins directly.
 * Windows accumulate — overlaps are fine and merge naturally.
 */
export function maskForWindows(windows: ReadonlyArray<PhenologyWindow>): boolean[] {
  const mask = new Array<boolean>(WEEK_BINS).fill(false)
  for (const window of windows) {
    if (isMonthWindow(window)) {
      assertMonth(window.startMonth)
      assertMonth(window.endMonth)
      // Walk months cyclically start..end inclusive (wraps when start > end).
      const monthCount = cyclicIndex(window.endMonth - window.startMonth, 12) + 1
      for (let i = 0; i < monthCount; i++) {
        const span = MONTH_WEEK_SPANS[cyclicIndex(window.startMonth - 1 + i, 12)]!
        for (let bin = span.startWeek; bin <= span.endWeek; bin++) {
          mask[bin - 1] = true
        }
      }
    } else {
      assertWeek(window.startWeek)
      assertWeek(window.endWeek)
      const binCount = cyclicIndex(window.endWeek - window.startWeek, WEEK_BINS) + 1
      for (let i = 0; i < binCount; i++) {
        mask[cyclicIndex(window.startWeek - 1 + i, WEEK_BINS)] = true
      }
    }
  }
  return mask
}

/**
 * Canonical merged cyclic ranges for a set of phenology windows, reusing the
 * circular-mask machinery (a window list covering all 12 months collapses to
 * the single full-year range, wrapping runs merge across the year boundary).
 */
export function referenceRanges(windows: ReadonlyArray<PhenologyWindow>): SeasonRange[] {
  return rangesFromMask(maskForWindows(windows))
}

/**
 * Basis of a reference season from the types of its cited sources (§104).
 * Market sources can never back an estimate — that would conflate the
 * display-only layer with observed evidence — so this throws on 'market'
 * (and on an empty citation list: an estimate must cite something).
 */
export function referenceBasis(sourceTypes: ReadonlyArray<SourceType>): ReferenceSeasonBasis {
  if (sourceTypes.length === 0) {
    throw new Error('Reference season without cited sources')
  }
  if (sourceTypes.includes('market')) {
    throw new Error('Market sources cannot back a reference season (§104)')
  }
  const hasLiterature = sourceTypes.includes('literature')
  const hasCensus = sourceTypes.includes('census')
  if (hasLiterature && hasCensus) return 'mixed'
  return hasCensus ? 'census' : 'literature'
}

/**
 * Approximate Spanish month label for reference ranges: "aprox. oct – feb",
 * a single month as "aprox. oct", a full-year mask as "todo el año
 * (estimado)" (§104). Endpoints of month-authored windows sit exactly on
 * MONTH_WEEK_SPANS boundaries and label as the authored months; week-level
 * endpoints fall back to the midpoint month approximation.
 */
export function formatReferenceRanges(ranges: ReadonlyArray<SeasonRange>): string {
  if (ranges.length === 1 && ranges[0]!.startWeek === 1 && ranges[0]!.endWeek === WEEK_BINS) {
    return 'todo el año (estimado)'
  }
  return `aprox. ${ranges.map(formatRange).join(' · ')}`
}

function formatRange(range: SeasonRange): string {
  const startIndex = MONTH_WEEK_SPANS.findIndex((s) => s.startWeek === range.startWeek)
  const endIndex = MONTH_WEEK_SPANS.findIndex((s) => s.endWeek === range.endWeek)
  const startMonth = startIndex >= 0 ? startIndex + 1 : monthOfWeekBin(range.startWeek)
  const endMonth = endIndex >= 0 ? endIndex + 1 : monthOfWeekBin(range.endWeek)
  const start = MONTH_SHORT_ES[startMonth - 1]!
  const end = MONTH_SHORT_ES[endMonth - 1]!
  // A wrapping range whose endpoints collapse into one month is nearly the
  // whole year — a bare month name would invert the meaning (see months.ts).
  if (range.startWeek > range.endWeek && start === end) return 'casi todo el año'
  return start === end ? start : `${start} – ${end}`
}

/**
 * Accessible description for the estimated-season badge (§104). Constant on
 * purpose: it must always say the estimate is not market evidence.
 */
export const REFERENCE_SEASON_ARIA_ES =
  'Temporada estimada según bibliografía — no proviene de observaciones de mercado.'
