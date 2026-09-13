/**
 * Weighted season scores (PROJECT.md §33). Transparent, deterministic,
 * no ML. All weights live in the methodology constants.
 *
 * Missing-signal policy:
 * - Market score: presence is REQUIRED (it is the base evidence that the
 *   product was in the market at all). availability/price renormalize away
 *   when missing.
 * - Local score: localShare is REQUIRED — without origin evidence a local
 *   claim would just repeat the market claim, conflating "En temporada"
 *   with "Temporada local". The harvest prior renormalizes away when absent.
 */

import { LOCAL_SCORE_WEIGHTS, MARKET_SCORE_WEIGHTS } from './methodology'

export interface MarketSignals {
  presence: number | null
  availability: number | null
  price: number | null
}

export interface LocalSignals {
  /** The (unsmoothed) market score for the same week. */
  market: number | null
  localShare: number | null
  harvest: number | null
}

function weightedMean(parts: Array<{ value: number | null; weight: number }>): number | null {
  let sum = 0
  let weight = 0
  for (const p of parts) {
    if (p.value === null) continue
    assertUnit(p.value)
    sum += p.value * p.weight
    weight += p.weight
  }
  return weight > 0 ? sum / weight : null
}

/** Market season score for one week, [0,1] or null without presence data. */
export function marketSeasonScore(signals: MarketSignals): number | null {
  if (signals.presence === null) return null
  return weightedMean([
    { value: signals.availability, weight: MARKET_SCORE_WEIGHTS.availability },
    { value: signals.presence, weight: MARKET_SCORE_WEIGHTS.presence },
    { value: signals.price, weight: MARKET_SCORE_WEIGHTS.price },
  ])
}

/** Local season score for one week, [0,1]; null without market+origin data. */
export function localSeasonScore(signals: LocalSignals): number | null {
  if (signals.market === null || signals.localShare === null) return null
  return weightedMean([
    { value: signals.market, weight: LOCAL_SCORE_WEIGHTS.market },
    { value: signals.localShare, weight: LOCAL_SCORE_WEIGHTS.localShare },
    { value: signals.harvest, weight: LOCAL_SCORE_WEIGHTS.harvest },
  ])
}

function assertUnit(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Signal outside [0,1]: ${value}`)
  }
}
