/**
 * Month ↔ week-bin mapping for UI navigation and axis labels (PROJECT.md
 * §75–76).
 *
 * The mapping is deliberately approximate: ISO weeks do not align with
 * calendar months (week 1 can start in late December). For navigation
 * ("¿qué está de temporada en diciembre?") and axis ticks, a deterministic
 * day-of-year approximation over a non-leap reference year is enough and
 * keeps the cyclic 52-bin grid uniform. The user's ACTUAL current week is
 * computed exactly from the date (isoWeek.ts); only month labels use this
 * approximation.
 */

import type { SeasonRange } from '../data/types'
import { rangeLength } from './cyclic'
import { WEEK_BINS } from './methodology'

/** Month names in Spanish, lowercase as used in running text. Index 0 = enero. */
export const MONTH_NAMES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

/** Short month labels for dense axes. Index 0 = ene. */
export const MONTH_SHORT_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

/** 0-based day-of-year each month starts on (non-leap reference year). */
export const MONTH_START_DAY = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334] as const

function assertMonth(month: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Month out of range 1..12: ${month}`)
  }
}

function assertWeekBin(week: number): void {
  if (!Number.isInteger(week) || week < 1 || week > WEEK_BINS) {
    throw new Error(`Week bin out of range 1..${WEEK_BINS}: ${week}`)
  }
}

/**
 * Representative week bin for a month (its middle), for month-based
 * exploration. month is 1..12.
 */
export function weekBinForMonth(month: number): number {
  assertMonth(month)
  const midDay = MONTH_START_DAY[month - 1]! + 14
  return Math.min(WEEK_BINS, Math.floor(midDay / 7) + 1)
}

/** Approximate month (1..12) a week bin falls in, using the bin's midpoint. */
export function monthOfWeekBin(week: number): number {
  assertWeekBin(week)
  const midDay = (week - 1) * 7 + 3
  for (let m = 11; m >= 0; m--) {
    if (midDay >= MONTH_START_DAY[m]!) return m + 1
  }
  return 1
}

/**
 * Axis tick positions for the 52-week grid, in day units (the grid spans
 * 0..364 where each week is 7 units wide). One tick per month start.
 */
export function monthAxisTicks(): Array<{ month: number; x: number }> {
  return MONTH_START_DAY.map((day, i) => ({ month: i + 1, x: day }))
}

/**
 * Human label for a cyclic week range, in months: "diciembre – febrero",
 * a single month when both ends fall in it, or "todo el año" for a
 * full-year range. Ranges wrap the year.
 */
export function formatRangeAsMonths(range: SeasonRange): string {
  if (rangeLength(range) === WEEK_BINS) return 'todo el año'
  const start = MONTH_NAMES_ES[monthOfWeekBin(range.startWeek) - 1]!
  const end = MONTH_NAMES_ES[monthOfWeekBin(range.endWeek) - 1]!
  if (start === end) return start
  return `${start} – ${end}`
}

/** Label for a list of ranges: "diciembre – febrero · junio – julio". */
export function formatRangesAsMonths(ranges: ReadonlyArray<SeasonRange>): string {
  return ranges.map(formatRangeAsMonths).join(' · ')
}
