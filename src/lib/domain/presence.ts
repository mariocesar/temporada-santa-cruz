/**
 * Presence signal (PROJECT.md §30).
 *
 * presenceProbability(week) = yearsPresent / yearsObserved
 *
 * "Observed" is defined by REPORT COVERAGE, not by product rows: a year
 * counts as observed for a week only if at least one source report exists
 * for that (year, week). A missing report is NOT evidence of absence.
 */

export interface WeekPresenceInput {
  /** Years for which at least one report covers this week bin. */
  yearsObserved: ReadonlySet<number> | ReadonlyArray<number>
  /** Years in which the product appeared in a report covering this week. */
  yearsPresent: ReadonlySet<number> | ReadonlyArray<number>
}

/**
 * Presence probability for one week bin. Returns null when no year has
 * report coverage for the week (no evidence either way).
 *
 * Throws if a "present" year is not among the observed years — presence
 * without coverage indicates a bug in the coverage index upstream.
 */
export function presenceProbability(input: WeekPresenceInput): number | null {
  const observed = new Set(input.yearsObserved)
  const present = new Set(input.yearsPresent)
  if (observed.size === 0) {
    if (present.size > 0) {
      throw new Error('Presence recorded for a week with no report coverage')
    }
    return null
  }
  for (const y of present) {
    if (!observed.has(y)) {
      throw new Error(`Year ${y} marked present but has no report coverage for this week`)
    }
  }
  return present.size / observed.size
}
