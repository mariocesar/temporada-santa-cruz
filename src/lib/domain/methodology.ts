/**
 * Methodology constants — the ONLY place where model weights, mappings, and
 * thresholds live (PROJECT.md §29, §33, §36, §39; CLAUDE.md hard constraint).
 *
 * These are documented starting assumptions, not scientific truths. Refine
 * them here, never inline in code. `docs/METHODOLOGY.md` (Phase 3) explains
 * them to readers; this module is the executable source of truth.
 */

import type { AvailabilityLevel, ConfidenceLabel } from '../data/types'

// ---------------------------------------------------------------------------
// Weekly grid
// ---------------------------------------------------------------------------

/**
 * Canonical cyclic grid: 52 ISO-week bins. Observations dated in ISO week 53
 * (which exists in ~18% of years, between week 52 and week 1) are folded
 * into bin 52 so multi-year aggregation is uniform. December and January
 * stay adjacent: bin 52 wraps to bin 1.
 */
export const WEEK_BINS = 52

// ---------------------------------------------------------------------------
// Availability mapping (§29)
// ---------------------------------------------------------------------------

/**
 * Numeric mapping for CAO-style offer classification
 * (Escasa / Normal / Abundante). `unknown` contributes nothing.
 */
export const AVAILABILITY_SCORE: Record<Exclude<AvailabilityLevel, 'unknown'>, number> = {
  scarce: 0.2,
  normal: 0.6,
  abundant: 1.0,
}

// ---------------------------------------------------------------------------
// Season score weights (§33)
// ---------------------------------------------------------------------------

/**
 * Market season score = weighted mean of the signals present for a week.
 * When a signal is missing (null) its weight is renormalized across the
 * remaining signals — a missing signal is not evidence of zero.
 * The presence signal is required: without it no market score is emitted.
 */
export const MARKET_SCORE_WEIGHTS = {
  availability: 0.45,
  presence: 0.35,
  price: 0.2,
} as const

/**
 * Local (Producción cruceña) season score. The localShare signal is
 * REQUIRED: renormalizing it away would silently turn a market score into a
 * local claim, conflating "En temporada" with "Temporada local".
 * harvest (INE calendar prior) is optional and absent until real INE data
 * is ingested.
 */
export const LOCAL_SCORE_WEIGHTS = {
  market: 0.5,
  localShare: 0.35,
  harvest: 0.15,
} as const

// ---------------------------------------------------------------------------
// Relative price signal (§28)
// ---------------------------------------------------------------------------

export const PRICE_SIGNAL = {
  /** Minimum comparable observations in a year to trust that year's median. */
  minObservationsPerYearMedian: 5,
  /** Minimum comparable observations in a week bin to emit a price signal. */
  minObservationsPerWeek: 2,
  /** Minimum unit-conversion confidence to treat prices as comparable. */
  minConversionConfidence: 0.8,
  /**
   * Mapping relative price -> abundance-flavored score:
   * price at or below `cheapRelative` × year median scores 1 (strong supply),
   * at or above `expensiveRelative` × year median scores 0. Linear between.
   */
  cheapRelative: 0.75,
  expensiveRelative: 1.25,
} as const

// ---------------------------------------------------------------------------
// Smoothing (§38)
// ---------------------------------------------------------------------------

/**
 * Circular (year-wrapping) weighted moving average. Symmetric triangular
 * kernel, radius 2: weights for offsets [-2,-1,0,+1,+2]. Null weeks are
 * skipped and the remaining weights renormalized; a window with no data
 * stays null.
 */
export const SMOOTHING_KERNEL = [1, 2, 3, 2, 1] as const

// ---------------------------------------------------------------------------
// Season classification thresholds (§39)
// ---------------------------------------------------------------------------

/** Score boundaries: [0,off) [off,occasional) [occasional,peak) [peak,1]. */
export const SEASON_CLASS_THRESHOLDS = {
  /** Below this: off season / insufficient. */
  occasionalMin: 0.2,
  inSeasonMin: 0.45,
  peakMin: 0.7,
} as const

// ---------------------------------------------------------------------------
// Entering/leaving trend (§40)
// ---------------------------------------------------------------------------

export const TREND = {
  /** Slope is measured between week−delta and week+delta (cyclic). */
  deltaWeeks: 2,
  /** Minimum score difference to call the trend rising/falling. */
  slopeEpsilon: 0.05,
} as const

// ---------------------------------------------------------------------------
// Evidence thresholds (§36)
// ---------------------------------------------------------------------------

export const EVIDENCE = {
  /** Do not publicly classify a season with fewer useful observations. */
  minObservations: 30,
  /** ... or fewer distinct years. */
  minYears: 2,
  /** Stronger labels (Alta confidence) require at least this many years. */
  strongYears: 4,
} as const

// ---------------------------------------------------------------------------
// Confidence model (§35) — independent from the seasonality score
// ---------------------------------------------------------------------------

export const CONFIDENCE = {
  /** Component weights; must sum to 1. Missing components renormalize. */
  weights: {
    observations: 0.25,
    years: 0.3,
    sources: 0.15,
    originCoverage: 0.1,
    yearConsistency: 0.2,
  },
  /** Saturation points: the component reaches 1 at these counts. */
  observationsSaturation: 60,
  yearsSaturation: 5,
  sourcesSaturation: 3,
  /**
   * Hard caps: sparse temporal evidence can never yield high confidence.
   * A single year caps at `singleYearCap` (Baja); fewer than
   * EVIDENCE.strongYears distinct years caps below the Alta threshold.
   */
  singleYearCap: 0.45,
  belowStrongYearsCap: 0.7,
} as const

/** Label boundaries over the confidence value. */
export const CONFIDENCE_LABELS: ReadonlyArray<{ min: number; label: ConfidenceLabel }> = [
  { min: 0.75, label: 'alta' },
  { min: 0.5, label: 'media' },
  { min: 0.25, label: 'baja' },
  { min: 0, label: 'muy_baja' },
]

// ---------------------------------------------------------------------------
// Locality (§31)
// ---------------------------------------------------------------------------

/**
 * "Local" means the origin's department is Santa Cruz — any level within it
 * (Valles Cruceños, Norte Integrado, a municipality...). Records with
 * unknown origin are excluded from the local-share denominator.
 */
export const LOCAL_DEPARTMENT = 'Santa Cruz'
