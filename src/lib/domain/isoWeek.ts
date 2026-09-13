/**
 * ISO-8601 week handling (PROJECT.md §37), including 53-week years.
 * All computations are UTC-based to stay independent of the host timezone.
 */

import { WEEK_BINS } from './methodology'

export interface IsoWeekDate {
  /** ISO week-numbering year (can differ from the calendar year). */
  isoYear: number
  /** ISO week number, 1..53. */
  week: number
}

const DAY_MS = 86_400_000

function parseUtc(date: Date | string): Date {
  if (date instanceof Date) return date
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) throw new Error(`Invalid ISO date: ${JSON.stringify(date)} (expected YYYY-MM-DD)`)
  const [, y, mo, d] = m
  const parsed = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)))
  // Reject overflow dates like 2023-02-31, which Date silently rolls over.
  if (
    parsed.getUTCFullYear() !== Number(y) ||
    parsed.getUTCMonth() !== Number(mo) - 1 ||
    parsed.getUTCDate() !== Number(d)
  ) {
    throw new Error(`Impossible calendar date: ${date}`)
  }
  return parsed
}

/**
 * ISO week and ISO week-year of a date (UTC). Implements the standard
 * "Thursday rule": a week belongs to the year that contains its Thursday.
 */
export function isoWeekOf(date: Date | string): IsoWeekDate {
  const d = parseUtc(date)
  // Shift to the Thursday of this date's ISO week.
  const target = new Date(d.getTime())
  const dayOfWeek = (d.getUTCDay() + 6) % 7 // Monday=0 .. Sunday=6
  target.setUTCDate(target.getUTCDate() - dayOfWeek + 3)
  const isoYear = target.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4))
  const firstWeekMonday = new Date(firstThursday.getTime())
  firstWeekMonday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7))
  const week = Math.floor((target.getTime() - firstWeekMonday.getTime()) / (7 * DAY_MS)) + 1
  return { isoYear, week }
}

/** Number of ISO weeks (52 or 53) in an ISO week-numbering year. */
export function weeksInIsoYear(isoYear: number): number {
  // A year has 53 ISO weeks iff Dec 28 falls in week 53 (Dec 28 is always
  // in the year's last ISO week).
  return isoWeekOf(new Date(Date.UTC(isoYear, 11, 28))).week
}

/**
 * Fold an ISO week (1..53) into the canonical cyclic bin grid (1..52).
 * Week 53 pools with week 52 (see methodology WEEK_BINS docs).
 */
export function toWeekBin(isoWeek: number): number {
  if (!Number.isInteger(isoWeek) || isoWeek < 1 || isoWeek > 53) {
    throw new Error(`ISO week out of range: ${isoWeek}`)
  }
  return Math.min(isoWeek, WEEK_BINS)
}

/** Convenience: ISO year + canonical week bin for a date. */
export function weekBinOf(date: Date | string): { isoYear: number; bin: number } {
  const { isoYear, week } = isoWeekOf(date)
  return { isoYear, bin: toWeekBin(week) }
}
