/**
 * Confidence model (PROJECT.md §35–36) — INDEPENDENT from season scores.
 * A pronounced peak with sparse evidence must read as low confidence.
 *
 * confidence = renormalized weighted mean of saturating evidence components,
 * hard-capped by temporal coverage: 1 year → at most `singleYearCap`;
 * fewer than `strongYears` years → below the Alta threshold.
 */

import type { ConfidenceLabel, EvidenceSummary } from '../data/types'
import { CONFIDENCE, CONFIDENCE_LABELS, EVIDENCE } from './methodology'

/** Saturating ramp: 0 at 0, 1 at `saturation`, clamped. */
function ramp(value: number, saturation: number): number {
  if (saturation <= 0) throw new Error(`Saturation must be positive: ${saturation}`)
  return Math.min(1, Math.max(0, value / saturation))
}

/**
 * Confidence value in [0,1] from an evidence summary.
 * Null components (originKnownRatio, yearConsistency) renormalize away:
 * absence of that evidence dimension neither helps nor hurts.
 */
export function confidenceValue(evidence: EvidenceSummary): number {
  if (evidence.observations === 0 || evidence.years === 0) return 0
  const w = CONFIDENCE.weights
  const parts: Array<{ value: number | null; weight: number }> = [
    { value: ramp(evidence.observations, CONFIDENCE.observationsSaturation), weight: w.observations },
    { value: ramp(evidence.years, CONFIDENCE.yearsSaturation), weight: w.years },
    { value: ramp(evidence.independentSources, CONFIDENCE.sourcesSaturation), weight: w.sources },
    { value: evidence.originKnownRatio, weight: w.originCoverage },
    { value: evidence.yearConsistency, weight: w.yearConsistency },
  ]
  let sum = 0
  let weight = 0
  for (const p of parts) {
    if (p.value === null) continue
    sum += Math.min(1, Math.max(0, p.value)) * p.weight
    weight += p.weight
  }
  let value = weight > 0 ? sum / weight : 0

  if (evidence.years < 2) value = Math.min(value, CONFIDENCE.singleYearCap)
  if (evidence.years < EVIDENCE.strongYears) value = Math.min(value, CONFIDENCE.belowStrongYearsCap)
  return value
}

/** Map a confidence value to its display label. */
export function confidenceLabel(value: number): ConfidenceLabel {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Confidence outside [0,1]: ${value}`)
  }
  for (const { min, label } of CONFIDENCE_LABELS) {
    if (value >= min) return label
  }
  return 'muy_baja'
}

/**
 * Public-classification gate (§36): with fewer observations/years than the
 * evidence thresholds, the UI must say "Datos insuficientes" rather than
 * classify a season.
 */
export function hasSufficientEvidence(evidence: EvidenceSummary): boolean {
  return (
    evidence.observations >= EVIDENCE.minObservations && evidence.years >= EVIDENCE.minYears
  )
}
