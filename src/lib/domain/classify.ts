/**
 * Season classification and entering/leaving trend (PROJECT.md §39–40).
 * Thresholds live in the methodology constants.
 */

import type { SeasonClass, SeasonState } from '../data/types'
import { cyclicIndex } from './cyclic'
import { SEASON_CLASS_THRESHOLDS, TREND } from './methodology'

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
 * Cyclic slope around a week: score[w+delta] − score[w−delta].
 * Null when either side lacks data.
 */
export function trendSlope(
  scores: ReadonlyArray<number | null>,
  week: number,
  delta: number = TREND.deltaWeeks,
): number | null {
  const n = scores.length
  if (n === 0) return null
  if (!Number.isInteger(week) || week < 1 || week > n) {
    throw new Error(`Week bin out of range 1..${n}: ${week}`)
  }
  const ahead = scores[cyclicIndex(week - 1 + delta, n)]
  const behind = scores[cyclicIndex(week - 1 - delta, n)]
  if (ahead === null || ahead === undefined || behind === null || behind === undefined) return null
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
 */
export function seasonStateAt(scores: ReadonlyArray<number | null>, week: number): SeasonState {
  if (scores.length === 0) return 'sin_datos'
  const score = scores[cyclicIndex(week - 1, scores.length)]
  if (score === null || score === undefined) return 'sin_datos'
  const cls = classifySeason(score)
  if (cls === 'peak') return 'pico'
  const slope = trendSlope(scores, week)
  const t = SEASON_CLASS_THRESHOLDS
  if (slope !== null && score >= t.occasionalMin) {
    if (slope >= TREND.slopeEpsilon) return 'entrando'
    if (slope <= -TREND.slopeEpsilon) return 'saliendo'
  }
  if (cls === 'in_season') return 'en_temporada'
  return 'fuera'
}
