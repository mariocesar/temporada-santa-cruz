/**
 * Season classification and entering/leaving trend (PROJECT.md §39–40).
 * Thresholds live in the methodology constants.
 */

import type { SeasonClass, SeasonState } from '../data/types'
import { cyclicIndex } from './cyclic'
import { SEASON_CLASS_THRESHOLDS, TREND, WEEK_BINS } from './methodology'

/** Discrete class for a smoothed weekly score; null score → insufficient. */
export function classifySeason(score: number | null): SeasonClass {
  if (score === null) return 'insufficient'
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error(`Season score outside [0,1]: ${score}`)
  }
  const t = SEASON_CLASS_THRESHOLDS
  if (score >= t.peakMin) return 'peak'
  if (score >= t.inSeasonMin) return 'in_season'
  if (score >= t.occasionalMin) return 'occasional'
  return 'off'
}

/**
 * Validate a week against a series of length n. ISO week 53 folds into
 * bin 52 when the series uses the canonical 52-bin grid (the same policy as
 * `toWeekBin`); anything else out of 1..n throws — no silent wrapping.
 */
function resolveWeek(week: number, n: number): number {
  if (!Number.isInteger(week)) throw new Error(`Week must be an integer: ${week}`)
  if (week === 53 && n === WEEK_BINS) return WEEK_BINS
  if (week < 1 || week > n) throw new Error(`Week bin out of range 1..${n}: ${week}`)
  return week
}

/**
 * Cyclic slope around a week: score[w+delta] − score[w−delta].
 * Null when either side lacks data; throws on non-finite (NaN) scores —
 * invalid data must fail loudly, never read as "stable".
 */
export function trendSlope(
  scores: ReadonlyArray<number | null>,
  week: number,
  delta: number = TREND.deltaWeeks,
): number | null {
  const n = scores.length
  if (n === 0) return null
  const w = resolveWeek(week, n)
  const ahead = scores[cyclicIndex(w - 1 + delta, n)]
  const behind = scores[cyclicIndex(w - 1 - delta, n)]
  if (ahead === null || ahead === undefined || behind === null || behind === undefined) return null
  if (!Number.isFinite(ahead) || !Number.isFinite(behind)) {
    throw new Error(`Non-finite score in trend window around week ${w}`)
  }
  return ahead - behind
}

/**
 * Deterministic "Ahora" state for one week (§40). Precedence:
 *   1. score ≥ peakMin                       → pico
 *   2. rising slope and score ≥ occasionalMin → entrando
 *   3. falling slope and score ≥ occasionalMin → saliendo
 *   4. score ≥ inSeasonMin (stable)           → en_temporada
 *   5. otherwise                              → fuera
 * A null score (or empty series) → sin_datos. A null slope counts as stable.
 * ISO week 53 folds into bin 52 on the canonical grid; other out-of-range
 * weeks throw.
 */
export function seasonStateAt(scores: ReadonlyArray<number | null>, week: number): SeasonState {
  if (scores.length === 0) return 'sin_datos'
  const w = resolveWeek(week, scores.length)
  const score = scores[w - 1]
  if (score === null || score === undefined) return 'sin_datos'
  const cls = classifySeason(score)
  if (cls === 'peak') return 'pico'
  const slope = trendSlope(scores, w)
  const t = SEASON_CLASS_THRESHOLDS
  if (slope !== null && score >= t.occasionalMin) {
    if (slope >= TREND.slopeEpsilon) return 'entrando'
    if (slope <= -TREND.slopeEpsilon) return 'saliendo'
  }
  if (cls === 'in_season') return 'en_temporada'
  return 'fuera'
}
