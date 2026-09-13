/**
 * Availability (oferta) signal (PROJECT.md §29).
 *
 * Sources classify offer as Escasa / Normal / Abundante. The numeric mapping
 * lives in the methodology constants; `unknown` levels contribute nothing.
 */

import type { AvailabilityLevel } from '../data/types'
import { AVAILABILITY_SCORE } from './methodology'

/** Numeric score for one availability level; null for `unknown`. */
export function availabilityLevelScore(level: AvailabilityLevel): number | null {
  if (level === 'unknown') return null
  return AVAILABILITY_SCORE[level]
}

/**
 * Aggregate availability signal for a week bin: mean of the mapped scores of
 * the given levels, ignoring `unknown`. Returns null when nothing usable.
 */
export function availabilitySignal(levels: ReadonlyArray<AvailabilityLevel>): number | null {
  let sum = 0
  let count = 0
  for (const level of levels) {
    const s = availabilityLevelScore(level)
    if (s === null) continue
    sum += s
    count++
  }
  return count > 0 ? sum / count : null
}
