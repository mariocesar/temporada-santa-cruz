/**
 * Pure pipeline core: raw CSV rows → normalized observations → derived
 * weekly seasonality and product summaries. The CLI entries (validate /
 * normalize / derive) are thin IO wrappers around these functions so the
 * logic stays unit-testable.
 */

import type {
  EvidenceSummary,
  MarketObservation,
  Origin,
  ProductSeasonSummary,
  WeeklySeasonality,
} from '../../../src/lib/data/types'
import { availabilitySignal } from '../../../src/lib/domain/availability'
import { classifySeason } from '../../../src/lib/domain/classify'
import { confidenceLabel, confidenceValue, hasSufficientEvidence } from '../../../src/lib/domain/confidence'
import { rangesFromMask, smoothCircular } from '../../../src/lib/domain/cyclic'
import { weekBinOf } from '../../../src/lib/domain/isoWeek'
import { isLocalOrigin, localShareSignal } from '../../../src/lib/domain/localShare'
import { PRICE_SIGNAL, WEEK_BINS } from '../../../src/lib/domain/methodology'
import { presenceProbability } from '../../../src/lib/domain/presence'
import {
  comparablePricePerKg,
  relativePrices,
  weeklyPriceSignal,
  type ComparablePrice,
} from '../../../src/lib/domain/prices'
import { localSeasonScore, marketSeasonScore } from '../../../src/lib/domain/scores'
import { observationId } from './id'
import {
  foldKey,
  normalizeAvailability,
  originalSourceOf,
  resolveUnit,
  type Registries,
} from './registry'
import type { RawCsvRow } from '../schemas'

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export interface LocatedRow {
  row: RawCsvRow
  /** e.g. "data/raw/demo/observations.csv:41" for error messages. */
  location: string
}

export interface NormalizeResult {
  observations: MarketObservation[]
  errors: string[]
}

export function normalizeObservations(
  rows: ReadonlyArray<LocatedRow>,
  registries: Registries,
): NormalizeResult {
  const errors: string[] = []
  const byId = new Map<string, { obs: MarketObservation; location: string }>()

  for (const { row, location } of rows) {
    const rowErrors: string[] = []

    const source = registries.sourceById.get(row.source_id)
    if (!source) {
      errors.push(`${location}: unknown source_id ${JSON.stringify(row.source_id)}`)
      continue
    }
    const original = originalSourceOf(row.source_id, registries)

    const product = registries.productByAlias.get(foldKey(row.product_raw))
    if (!product) {
      rowErrors.push(`unknown product ${JSON.stringify(row.product_raw)} (add an alias to data/metadata/products.json)`)
    }

    let origin: Origin | undefined
    if (row.origin_raw.trim() !== '') {
      origin = registries.originByAlias.get(foldKey(row.origin_raw))
      if (!origin) {
        rowErrors.push(`unknown origin ${JSON.stringify(row.origin_raw)} (add it to data/metadata/origins.json)`)
      }
    }

    const availability = normalizeAvailability(row.availability)
    if (availability === null) {
      rowErrors.push(`unrecognized availability ${JSON.stringify(row.availability)}`)
    }

    const wholesaleUnit = row.wholesale_unit.trim() !== '' ? resolveUnit(row.wholesale_unit, registries) : undefined
    if (row.wholesale_unit.trim() !== '' && wholesaleUnit === null) {
      rowErrors.push(`unknown unit ${JSON.stringify(row.wholesale_unit)} (add it to data/metadata/units.json)`)
    }
    const retailUnit = row.retail_unit.trim() !== '' ? resolveUnit(row.retail_unit, registries) : undefined
    if (row.retail_unit.trim() !== '' && retailUnit === null) {
      rowErrors.push(`unknown unit ${JSON.stringify(row.retail_unit)}`)
    }

    const wholesalePrice = parsePrice(row.wholesale_price)
    const retailPrice = parsePrice(row.retail_price)
    if (wholesalePrice !== undefined && row.wholesale_unit.trim() === '') {
      rowErrors.push('wholesale_price without wholesale_unit')
    }
    if (retailPrice !== undefined && row.retail_unit.trim() === '') {
      rowErrors.push('retail_price without retail_unit')
    }

    // Dates must be real calendar dates (weekBinOf throws on impossible ones).
    try {
      weekBinOf(row.observed_at)
    } catch (e) {
      rowErrors.push(String(e instanceof Error ? e.message : e))
    }

    if (rowErrors.length > 0 || !product || availability === null) {
      for (const msg of rowErrors) errors.push(`${location}: ${msg}`)
      continue
    }

    const id = observationId({
      originalSourceId: original.id,
      reportId: row.report_id,
      observedAt: row.observed_at,
      market: row.market,
      productRaw: row.product_raw,
      originRaw: row.origin_raw,
      varietyRaw: row.variety_raw,
      quality: row.quality,
    })

    const obs: MarketObservation = {
      id,
      observedAt: row.observed_at,
      sourceId: source.id,
      originalSourceId: original.id,
      reportId: row.report_id,
      ...(row.market.trim() !== '' ? { market: row.market } : {}),
      productId: product.id,
      productRaw: row.product_raw,
      ...(origin ? { originId: origin.id, originNormalization: aliasKind(row.origin_raw, origin) } : {}),
      ...(row.origin_raw.trim() !== '' ? { originRaw: row.origin_raw } : {}),
      ...(row.variety_raw.trim() !== '' ? { variety: row.variety_raw, varietyRaw: row.variety_raw } : {}),
      ...(row.quality.trim() !== '' ? { quality: row.quality } : {}),
      availability,
      ...(row.availability.trim() !== '' ? { availabilityRaw: row.availability } : {}),
      ...(wholesalePrice !== undefined ? { wholesalePrice } : {}),
      ...(wholesaleUnit ? { wholesaleUnit } : {}),
      ...(retailPrice !== undefined ? { retailPrice } : {}),
      ...(retailUnit ? { retailUnit } : {}),
      synthetic: original.synthetic === true || source.synthetic === true,
    }

    const existing = byId.get(id)
    if (!existing) {
      byId.set(id, { obs, location })
      continue
    }
    // Deterministic ID collision = same original report row (§65–66).
    if (existing.obs.sourceId === obs.sourceId) {
      errors.push(`${location}: exact duplicate of ${existing.location} (same source, report and row identity)`)
      continue
    }
    // Mirror of an already-imported original report: verify agreement, keep
    // the record closest to the original publisher. Mirrors are access, not
    // independent evidence.
    if (!mirrorAgrees(existing.obs, obs)) {
      const role = (o: MarketObservation) =>
        o.sourceId === o.originalSourceId ? 'original' : 'mirror'
      errors.push(
        `${location}: ${role(obs)} row disagrees with ${role(existing.obs)} row at ` +
          `${existing.location} for ${id} (availability/prices differ); fix the transcription`,
      )
      continue
    }
    if (obs.sourceId === obs.originalSourceId && existing.obs.sourceId !== existing.obs.originalSourceId) {
      byId.set(id, { obs, location })
    }
  }

  const observations = [...byId.values()]
    .map((v) => v.obs)
    .sort((a, b) =>
      a.observedAt < b.observedAt ? -1 : a.observedAt > b.observedAt ? 1 :
      a.productId < b.productId ? -1 : a.productId > b.productId ? 1 :
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    )
  return { observations, errors }
}

function aliasKind(raw: string, origin: Origin): 'exact' | 'alias' {
  return foldKey(raw) === foldKey(origin.label) ? 'exact' : 'alias'
}

function parsePrice(cell: string): number | undefined {
  if (cell.trim() === '') return undefined
  const value = Number(cell)
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid price cell: ${cell}`)
  return value
}

function mirrorAgrees(a: MarketObservation, b: MarketObservation): boolean {
  return (
    a.availability === b.availability &&
    a.wholesalePrice === b.wholesalePrice &&
    a.retailPrice === b.retailPrice &&
    (a.wholesaleUnit?.canonical ?? null) === (b.wholesaleUnit?.canonical ?? null) &&
    (a.retailUnit?.canonical ?? null) === (b.retailUnit?.canonical ?? null)
  )
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

export interface DerivedDataset {
  seasonality: WeeklySeasonality[]
  summaries: ProductSeasonSummary[]
}

export function deriveDataset(
  observations: ReadonlyArray<MarketObservation>,
  registries: Registries,
): DerivedDataset {
  // Report coverage index: which ISO years have at least one report covering
  // each week bin. A report covers its week for EVERY product — absence from
  // an existing report is (weak) absence evidence; a missing report is none.
  const coverage: Array<Set<number>> = Array.from({ length: WEEK_BINS }, () => new Set<number>())
  const reportKeys = new Set<string>()
  for (const obs of observations) {
    const key = `${obs.originalSourceId}\u001f${obs.reportId}\u001f${obs.observedAt}`
    if (reportKeys.has(key)) continue
    reportKeys.add(key)
    const { isoYear, bin } = weekBinOf(obs.observedAt)
    coverage[bin - 1]!.add(isoYear)
  }
  const weekCoverage = coverage.filter((years) => years.size > 0).length / WEEK_BINS

  const originById = new Map(registries.origins.map((o) => [o.id, o]))
  const seasonality: WeeklySeasonality[] = []
  const summaries: ProductSeasonSummary[] = []

  for (const product of registries.products) {
    const productObs = observations.filter((o) => o.productId === product.id)

    // Per-bin accumulators.
    const presentYears: Array<Set<number>> = Array.from({ length: WEEK_BINS }, () => new Set())
    const binObs: MarketObservation[][] = Array.from({ length: WEEK_BINS }, () => [])
    const comparable: ComparablePrice[] = []
    for (const obs of productObs) {
      const { isoYear, bin } = weekBinOf(obs.observedAt)
      presentYears[bin - 1]!.add(isoYear)
      binObs[bin - 1]!.push(obs)
      // The methodology constant decides which price level feeds the signal.
      const [price, unit] =
        PRICE_SIGNAL.basis === 'wholesale'
          ? [obs.wholesalePrice, obs.wholesaleUnit]
          : [obs.retailPrice, obs.retailUnit]
      const pricePerKg = comparablePricePerKg(price, unit)
      if (pricePerKg !== null) comparable.push({ isoYear, bin, pricePerKg })
    }

    const priceSignal = weeklyPriceSignal(comparable, WEEK_BINS)

    const rawMarket: Array<number | null> = []
    const rawLocal: Array<number | null> = []
    const presenceByBin: Array<number | null> = []
    const availabilityByBin: Array<number | null> = []
    const localShareByBin: Array<number | null> = []
    for (let bin = 1; bin <= WEEK_BINS; bin++) {
      const presence = presenceProbability({
        yearsObserved: coverage[bin - 1]!,
        yearsPresent: presentYears[bin - 1]!,
      })
      const availability = availabilitySignal(binObs[bin - 1]!.map((o) => o.availability))
      const localShare = localShareSignal(
        binObs[bin - 1]!.map((o) => (o.originId ? originById.get(o.originId) ?? null : null)),
      )
      const market = marketSeasonScore({
        presence,
        availability,
        price: priceSignal[bin - 1]!,
      })
      presenceByBin.push(presence)
      availabilityByBin.push(availability)
      localShareByBin.push(localShare)
      rawMarket.push(market)
      rawLocal.push(localSeasonScore({ market, localShare, harvest: null }))
    }

    // Round BEFORE classification so published scores and published ranges
    // stay mutually reconstructable (derived values must trace back, §23).
    const smoothMarket = smoothCircular(rawMarket).map(roundOrNull)
    const smoothLocal = smoothCircular(rawLocal).map(roundOrNull)

    // Evidence and confidence (product-level, independent from scores).
    const obsYears = new Set(productObs.map((o) => weekBinOf(o.observedAt).isoYear))
    const originKnown = productObs.filter((o) => o.originId !== undefined).length
    const evidence: EvidenceSummary = {
      observations: productObs.length,
      years: obsYears.size,
      independentSources: new Set(productObs.map((o) => o.originalSourceId)).size,
      originKnownRatio: productObs.length > 0 ? originKnown / productObs.length : null,
      // Inter-annual agreement only means something once the product itself
      // has been observed in 2+ years; otherwise unanimous ABSENCE under
      // coverage would inflate a single-year product's consistency.
      yearConsistency: obsYears.size >= 2 ? yearConsistency(coverage, presentYears) : null,
      weekCoverage,
    }
    const confidence = confidenceValue(evidence)
    const sufficient = hasSufficientEvidence(evidence)

    const productSourceIds = [...new Set(productObs.map((o) => o.originalSourceId))].sort()

    for (let bin = 1; bin <= WEEK_BINS; bin++) {
      seasonality.push({
        productId: product.id,
        week: bin,
        marketScore: roundOrNull(smoothMarket[bin - 1]!),
        localScore: roundOrNull(smoothLocal[bin - 1]!),
        presenceProbability: roundOrNull(presenceByBin[bin - 1]!),
        availabilityScore: roundOrNull(availabilityByBin[bin - 1]!),
        relativePriceScore: roundOrNull(priceSignal[bin - 1]!),
        localShare: roundOrNull(localShareByBin[bin - 1]!),
        harvestScore: null,
        confidence: round(confidence),
        observations: binObs[bin - 1]!.length,
        years: presentYears[bin - 1]!.size,
        sourceIds: [...new Set(binObs[bin - 1]!.map((o) => o.originalSourceId))].sort(),
      })
    }

    // Season ranges are only published with sufficient evidence (§36).
    const marketMask = smoothMarket.map((s) => classifySeason(s) === 'in_season' || classifySeason(s) === 'peak')
    const localMask = smoothLocal.map((s) => classifySeason(s) === 'in_season' || classifySeason(s) === 'peak')
    const peakWeeks = smoothMarket
      .map((s, i) => (classifySeason(s) === 'peak' ? i + 1 : null))
      .filter((w): w is number => w !== null)

    const knownOriginObs = productObs.filter((o) => o.originId !== undefined)
    const originCounts = new Map<string, number>()
    for (const o of knownOriginObs) {
      originCounts.set(o.originId!, (originCounts.get(o.originId!) ?? 0) + 1)
    }
    const primaryOrigins = [...originCounts.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, 3)
      .map(([originId, count]) => {
        const origin = originById.get(originId)!
        return {
          originId,
          label: origin.label,
          share: round(count / knownOriginObs.length),
          observations: count,
          isLocal: isLocalOrigin(origin),
        }
      })

    const dates = productObs.map((o) => o.observedAt).sort()

    summaries.push({
      productId: product.id,
      peakWeeks: sufficient ? peakWeeks : [],
      marketSeasonRanges: sufficient ? rangesFromMask(marketMask) : [],
      localSeasonRanges: sufficient ? rangesFromMask(localMask) : [],
      observationCount: productObs.length,
      yearsCovered: obsYears.size,
      ...(dates.length > 0 ? { firstObservation: dates[0]!, lastObservation: dates[dates.length - 1]! } : {}),
      confidence: round(confidence),
      confidenceLabel: confidenceLabel(confidence),
      insufficientEvidence: !sufficient,
      evidence: {
        ...evidence,
        originKnownRatio: roundOrNull(evidence.originKnownRatio),
        yearConsistency: roundOrNull(evidence.yearConsistency),
        weekCoverage: round(evidence.weekCoverage),
      },
      primaryOrigins,
      priceComparable: relativePrices(comparable).length > 0,
      containsSyntheticData: productObs.some((o) => o.synthetic),
      sourceIds: productSourceIds,
    })
  }

  assertDerived(seasonality)
  return { seasonality, summaries }
}

/**
 * Inter-annual presence agreement: for bins observed in ≥2 years, |2p−1|
 * (1 = unanimous across years, 0 = coin flip). Null when no bin qualifies.
 */
function yearConsistency(
  coverage: ReadonlyArray<ReadonlySet<number>>,
  presentYears: ReadonlyArray<ReadonlySet<number>>,
): number | null {
  const agreements: number[] = []
  for (let i = 0; i < coverage.length; i++) {
    const observed = coverage[i]!
    if (observed.size < 2) continue
    const p = presentYears[i]!.size / observed.size
    agreements.push(Math.abs(2 * p - 1))
  }
  if (agreements.length === 0) return null
  return agreements.reduce((a, b) => a + b, 0) / agreements.length
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

function roundOrNull(value: number | null): number | null {
  return value === null ? null : round(value)
}

/** §44: invalid season scores must never reach the published dataset. */
function assertDerived(rows: ReadonlyArray<WeeklySeasonality>): void {
  for (const row of rows) {
    for (const key of [
      'marketScore',
      'localScore',
      'presenceProbability',
      'availabilityScore',
      'relativePriceScore',
      'localShare',
      'confidence',
    ] as const) {
      const value = row[key]
      if (value === null) continue
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
        throw new Error(`Derived ${key} outside [0,1] for ${row.productId} week ${row.week}: ${value}`)
      }
    }
    if (row.week < 1 || row.week > WEEK_BINS) {
      throw new Error(`Derived week out of range: ${row.week}`)
    }
  }
}
