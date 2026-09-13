/**
 * Locality signal (PROJECT.md §31).
 *
 * localShare = observationsFromSantaCruz / observationsWithKnownOrigin
 *
 * Unknown-origin records are EXCLUDED from the denominator. Geographic
 * granularity is respected: "Santa Cruz" (department) is local without
 * inventing a more specific municipality.
 */

import type { Origin } from '../data/types'
import { LOCAL_DEPARTMENT } from './methodology'

/** An origin is local when it lies within the Santa Cruz department. */
export function isLocalOrigin(origin: Origin): boolean {
  return origin.country === 'Bolivia' && origin.department === LOCAL_DEPARTMENT
}

/**
 * Local share over a set of observations' resolved origins. Pass null for
 * observations whose origin is unknown; they are excluded from the
 * denominator. Returns null when no observation has a known origin —
 * "no origin data" must never read as "not local" or "local".
 */
export function localShareSignal(origins: ReadonlyArray<Origin | null>): number | null {
  let known = 0
  let local = 0
  for (const origin of origins) {
    if (origin === null) continue
    known++
    if (isLocalOrigin(origin)) local++
  }
  return known > 0 ? local / known : null
}
