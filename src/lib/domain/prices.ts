/**
 * Relative price signal (PROJECT.md §27–28, §54).
 *
 * Nominal Bs prices are never compared across years. For unit-comparable
 * observations, price is expressed relative to the SAME product's median in
 * the SAME year; cheap-vs-own-normal reads as stronger supply.
 *
 * Guards: incompatible units are excluded, year medians need a minimum
 * sample, weekly signals need a minimum sample. Sparse price data must never
 * dominate seasonality (it only ever carries PRICE_SIGNAL's weight).
 */

import type { MarketUnit } from '../data/types'
import { PRICE_SIGNAL } from './methodology'

export interface ComparablePrice {
  isoYear: number
  /** Canonical week bin 1..52. */
  bin: number
  /** Price on a single consistent basis (Bs per kg). */
  pricePerKg: number
}

/** Median of a non-empty list; null for an empty one. */
export function median(values: ReadonlyArray<number>): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/**
 * Convert a nominal price in a raw market unit to Bs/kg, or null when no
 * defensible conversion exists (unknown weight or low conversion
 * confidence). Package/count units (caja, bolsa, docena...) have no
 * knownWeightKg and are therefore never converted — no fake precision.
 */
export function comparablePricePerKg(
  price: number | undefined,
  unit: MarketUnit | undefined,
): number | null {
  if (price === undefined || price === null) return null
  if (!Number.isFinite(price)) throw new Error(`Non-finite price: ${price}`)
  if (price < 0) throw new Error(`Negative price: ${price}`)
  if (!unit || unit.knownWeightKg === undefined || unit.knownWeightKg <= 0) return null
  if ((unit.conversionConfidence ?? 0) < PRICE_SIGNAL.minConversionConfidence) return null
  return price / unit.knownWeightKg
}

/**
 * Relative price per observation: price / median(pricePerKg of its year).
 * Years with fewer than `minObservationsPerYearMedian` comparable
 * observations are dropped entirely (their median is not trustworthy).
 */
export function relativePrices(
  observations: ReadonlyArray<ComparablePrice>,
): Array<{ isoYear: number; bin: number; relative: number }> {
  const byYear = new Map<number, ComparablePrice[]>()
  for (const o of observations) {
    if (!Number.isFinite(o.pricePerKg)) {
      throw new Error(`Non-finite comparable price: ${o.pricePerKg}`)
    }
    if (o.pricePerKg <= 0) continue // zero prices carry no signal
    const list = byYear.get(o.isoYear) ?? []
    list.push(o)
    byYear.set(o.isoYear, list)
  }
  const out: Array<{ isoYear: number; bin: number; relative: number }> = []
  for (const [isoYear, list] of byYear) {
    if (list.length < PRICE_SIGNAL.minObservationsPerYearMedian) continue
    const m = median(list.map((o) => o.pricePerKg))
    if (m === null || m <= 0) continue
    for (const o of list) {
      out.push({ isoYear, bin: o.bin, relative: o.pricePerKg / m })
    }
  }
  return out
}

/**
 * Map a relative price to an abundance-flavored score in [0,1]:
 * cheap (≤ cheapRelative × median) → 1, expensive (≥ expensiveRelative) → 0.
 */
export function relativePriceToScore(relative: number): number {
  const { cheapRelative, expensiveRelative } = PRICE_SIGNAL
  const t = (expensiveRelative - relative) / (expensiveRelative - cheapRelative)
  return Math.min(1, Math.max(0, t))
}

/**
 * Weekly relative-price score series (length `bins`), null where there is
 * not enough comparable data. Index i = week bin i+1.
 */
export function weeklyPriceSignal(
  observations: ReadonlyArray<ComparablePrice>,
  bins: number,
): Array<number | null> {
  const out: Array<number | null> = new Array(bins).fill(null)
  const relatives = relativePrices(observations)
  const byBin = new Map<number, number[]>()
  for (const r of relatives) {
    if (r.bin < 1 || r.bin > bins) throw new Error(`Week bin out of range: ${r.bin}`)
    const list = byBin.get(r.bin) ?? []
    list.push(r.relative)
    byBin.set(r.bin, list)
  }
  for (const [bin, list] of byBin) {
    if (list.length < PRICE_SIGNAL.minObservationsPerWeek) continue
    const m = median(list)
    if (m !== null) out[bin - 1] = relativePriceToScore(m)
  }
  return out
}
