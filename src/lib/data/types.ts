/**
 * Canonical domain types for Temporada Santa Cruz.
 *
 * Shared by the Svelte app (`src/`) and the offline data pipeline
 * (`scripts/data/`). Three data layers (PROJECT.md §23):
 *
 *   raw        — exactly what a source reported; never destroyed
 *   normalized — canonical products/origins/units beside the raw strings
 *   derived    — seasonality scores, confidence, summaries
 *
 * Every derived value must trace back to observations and source IDs.
 */

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type ProductCategory =
  | 'fruit'
  | 'vegetable'
  | 'tuber'
  | 'grain'
  | 'herb'
  | 'other'

export interface Product {
  id: string
  slug: string
  nameEs: string
  scientificName?: string
  aliases: string[]
  category: ProductCategory
  varieties?: string[]
}

// ---------------------------------------------------------------------------
// Origins (geographic ontology, PROJECT.md §31–32)
// ---------------------------------------------------------------------------

export type OriginLevel =
  | 'country'
  | 'department'
  | 'province'
  | 'municipality'
  | 'region'
  | 'unknown'

export type OriginNormalizationMethod = 'exact' | 'alias' | 'manual' | 'inferred'

export interface Origin {
  id: string
  label: string
  country: string
  department?: string
  province?: string
  municipality?: string
  region?: string
  level: OriginLevel
  /** Recognized raw spellings that normalize to this origin. */
  aliases?: string[]
}

export interface OriginSummary {
  originId: string
  label: string
  /** Share among observations with KNOWN origin, in [0,1]. */
  share: number
  observations: number
  isLocal: boolean
}

// ---------------------------------------------------------------------------
// Sources (PROJECT.md §46, §66–67)
// ---------------------------------------------------------------------------

export type SourceKind = 'original' | 'mirror'

/**
 * What kind of evidence a source provides (§104):
 *
 *   market     — market price/availability reports; feeds observed scores
 *   census     — agricultural census; harvest-calendar PRIOR only (§34)
 *   literature — phenology/harvest-calendar bibliography; display-only
 *                reference seasons, never part of observed scoring
 */
export type SourceType = 'market' | 'census' | 'literature'

export interface DataSource {
  id: string
  name: string
  publisher: string
  sourceType: SourceType
  url?: string
  description?: string
  coverageStart?: string
  coverageEnd?: string
  accessedAt?: string
  methodologyNotes?: string
  licenseNotes?: string
  /**
   * Mirrors provide access, not independent evidence (§67). A mirror points
   * at the original source it re-publishes; evidence counting collapses
   * mirrors into their original.
   */
  kind: SourceKind
  mirrorOf?: string
  /**
   * True only for the demo seed source. Synthetic records must be
   * unmistakable (§45, §79).
   */
  synthetic?: boolean
}

// ---------------------------------------------------------------------------
// Observations (raw + normalized side by side, PROJECT.md §25–27)
// ---------------------------------------------------------------------------

export type AvailabilityLevel = 'scarce' | 'normal' | 'abundant' | 'unknown'

export interface MarketUnit {
  raw: string
  canonical?: string
  /** Defensible weight conversion, if one exists. Absent for caja/bolsa/etc. */
  knownWeightKg?: number
  /** Confidence in the weight conversion, in [0,1]. */
  conversionConfidence?: number
}

export interface MarketObservation {
  /** Deterministic ID derived from source identity (§65). */
  id: string
  /** ISO date (YYYY-MM-DD) the source reported for. */
  observedAt: string
  sourceId: string
  /**
   * Original-evidence source: equals sourceId unless the record arrived via
   * a mirror, in which case it is the mirrored original (§67).
   */
  originalSourceId: string
  /** Source report/document this row was transcribed from. */
  reportId: string
  market?: string

  productId: string
  productRaw: string

  originId?: string
  originRaw?: string
  originNormalization?: OriginNormalizationMethod

  variety?: string
  varietyRaw?: string

  quality?: string
  /**
   * Print-order discriminator for report lines that are identical in every
   * other identity dimension (layouts that omit Origen/Calidad yet print
   * quality-tiered lines). Part of the observation ID when present.
   */
  rowSeq?: string

  availability: AvailabilityLevel
  availabilityRaw?: string

  wholesalePrice?: number
  wholesaleUnit?: MarketUnit

  retailPrice?: number
  retailUnit?: MarketUnit

  /** True when the record comes from a synthetic/demo source (§45). */
  synthetic: boolean
}

// ---------------------------------------------------------------------------
// Derived weekly data (PROJECT.md §51)
// ---------------------------------------------------------------------------

/**
 * Weeks are ISO-week bins 1..52. Observations dated in ISO week 53 are
 * folded into bin 52 (week 53 exists only in ~18% of years and sits between
 * week 52 and week 1; folding keeps the cyclic grid uniform across years).
 * See methodology constants.
 */
export type WeekBin = number

export interface WeeklySeasonality {
  productId: string
  week: WeekBin

  /** Smoothed weighted market season score, [0,1]; null = no evidence. */
  marketScore: number | null
  /** Smoothed local (Santa Cruz production) season score, [0,1]. */
  localScore: number | null

  presenceProbability: number | null
  availabilityScore: number | null
  relativePriceScore: number | null
  localShare: number | null
  harvestScore: number | null

  /** Product-level confidence, [0,1] (independent from the scores). */
  confidence: number
  observations: number
  years: number

  sourceIds: string[]
}

// ---------------------------------------------------------------------------
// Season classification (PROJECT.md §39–40)
// ---------------------------------------------------------------------------

export type SeasonClass = 'off' | 'occasional' | 'in_season' | 'peak' | 'insufficient'

export type SeasonState =
  | 'pico'
  | 'entrando'
  | 'en_temporada'
  | 'saliendo'
  | 'fuera'
  | 'sin_datos'

export type ConfidenceLabel = 'muy_baja' | 'baja' | 'media' | 'alta'

// ---------------------------------------------------------------------------
// Cyclic season ranges (PROJECT.md §53)
// ---------------------------------------------------------------------------

/**
 * Inclusive cyclic range of week bins. `startWeek > endWeek` means the range
 * wraps the year boundary (e.g. 48..8 = December through February).
 * A full-year range is startWeek=1, endWeek=52.
 */
export interface SeasonRange {
  startWeek: WeekBin
  endWeek: WeekBin
}

// ---------------------------------------------------------------------------
// Reference seasons (estimación bibliográfica, PROJECT.md §104)
// ---------------------------------------------------------------------------

/** Which cited source types back a reference season. Never 'market'. */
export type ReferenceSeasonBasis = 'literature' | 'census' | 'mixed'

/**
 * Display-only estimated season from cited phenology/harvest-calendar
 * bibliography. NEVER blended into scores, confidence, evidence, or
 * `insufficientEvidence` — an estimate-only product correctly keeps
 * "Datos insuficientes" alongside this (§104).
 */
export interface ReferenceSeason {
  ranges: SeasonRange[]
  basis: ReferenceSeasonBasis
  /** Cited literature/census sources — disjoint from observation sourceIds. */
  sourceIds: string[]
  /** Optional Spanish display note (e.g. region caveat). */
  note?: string
}

// ---------------------------------------------------------------------------
// Product summaries (PROJECT.md §52)
// ---------------------------------------------------------------------------

export interface ProductSeasonSummary {
  productId: string

  peakWeeks: WeekBin[]
  marketSeasonRanges: SeasonRange[]
  localSeasonRanges: SeasonRange[]

  observationCount: number
  yearsCovered: number
  firstObservation?: string
  lastObservation?: string

  confidence: number
  confidenceLabel: ConfidenceLabel
  /**
   * True when evidence falls below the public-classification thresholds
   * (§36). The UI must show "Datos insuficientes" instead of season claims.
   */
  insufficientEvidence: boolean
  /** Human-readable reasons feeding the confidence/evidence display. */
  evidence: EvidenceSummary

  primaryOrigins: OriginSummary[]
  /**
   * Share of local (Santa Cruz) origins among ALL observations with a known
   * origin, in [0,1]; null when no observation has a recorded origin —
   * absent origin evidence must never read as "0 % local". Computed over
   * the full observation set: `primaryOrigins` is a display-truncated top
   * list and must never be summed to reconstruct this value.
   */
  localShareOfKnown: number | null
  /**
   * False when historical units are not comparable, so no price trend is
   * derived (§54).
   */
  priceComparable: boolean

  /** True if ANY contributing observation is synthetic (§45). */
  containsSyntheticData: boolean
  /** Original-evidence sources of the OBSERVATIONS only — reference-season
   * citations live in `referenceSeason.sourceIds`, never here (§104). */
  sourceIds: string[]
  /** Display-only estimated season from cited bibliography (§104). */
  referenceSeason?: ReferenceSeason
}

export interface EvidenceSummary {
  observations: number
  years: number
  independentSources: number
  originKnownRatio: number | null
  /**
   * Inter-annual presence agreement, [0,1], over week bins with report
   * coverage in 2+ years; null until the product itself has observations
   * in 2+ distinct years.
   */
  yearConsistency: number | null
  /** Fraction of week bins covered by at least one report, [0,1]. */
  weekCoverage: number
}

// ---------------------------------------------------------------------------
// Published dataset (public/data/*.json)
// ---------------------------------------------------------------------------

export interface DatasetIndex {
  /** Latest observation date across the dataset — NOT the deploy date (§47). */
  dataUpdatedAt: string | null
  productCount: number
  observationCount: number
  sourceCount: number
  /**
   * True when any published record is synthetic. The UI must display the
   * demo-data banner whenever this is set (§79).
   */
  containsDemoData: boolean
  /**
   * True when EVERY published observation is synthetic (§45). Combined with
   * `containsDemoData` this distinguishes the all-demo state (the banner
   * speaks for the whole dataset) from the mixed real+demo state, where the
   * banner switches to partial copy and per-product DE EJEMPLO markers
   * become load-bearing. False when there are no observations at all.
   */
  allDataSynthetic: boolean
  /**
   * True when any published summary carries a bibliography-estimated
   * reference season; the UI adds the estimated-seasons footnote (§104).
   */
  containsEstimatedSeasons: boolean
  files: {
    products: string
    seasonality: string
    summaries: string
    sources: string
  }
  schemaVersion: number
}
