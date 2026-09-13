/**
 * View models: join the published dataset files into per-product structures
 * the dashboard renders directly. Pure and testable — no browser APIs.
 */

import { seasonStateAt } from '../domain/classify'
import { EVIDENCE, WEEK_BINS } from '../domain/methodology'
import type { CategoryFilter, ViewMode } from '../i18n/labels'
import { categoryMatchesFilter } from '../i18n/labels'
import type {
  Product,
  ProductSeasonSummary,
  SeasonRange,
  SeasonState,
  WeeklySeasonality,
} from './types'

export interface ProductView {
  product: Product
  summary: ProductSeasonSummary
  /** Weekly rows indexed by week bin − 1; missing bins are null. */
  weekly: Array<WeeklySeasonality | null>
  /** Smoothed market season score per week bin (index = bin − 1). */
  marketSeries: Array<number | null>
  /** Smoothed local (Producción cruceña) score per week bin. */
  localSeries: Array<number | null>
}

/**
 * Join products, summaries and weekly rows. A product without a summary is
 * a malformed dataset (loud failure, §78); missing weekly bins are treated
 * as "no evidence" (missing data is NOT zero).
 */
export function buildProductViews(
  products: ReadonlyArray<Product>,
  summaries: ReadonlyArray<ProductSeasonSummary>,
  seasonality: ReadonlyArray<WeeklySeasonality>,
): ProductView[] {
  const summaryById = new Map(summaries.map((s) => [s.productId, s]))
  const weeklyById = new Map<string, Array<WeeklySeasonality | null>>()
  for (const row of seasonality) {
    if (!Number.isInteger(row.week) || row.week < 1 || row.week > WEEK_BINS) {
      throw new Error(`Weekly row with invalid week bin ${row.week} for ${row.productId}`)
    }
    let weeks = weeklyById.get(row.productId)
    if (!weeks) {
      weeks = new Array<WeeklySeasonality | null>(WEEK_BINS).fill(null)
      weeklyById.set(row.productId, weeks)
    }
    weeks[row.week - 1] = row
  }

  return products.map((product) => {
    const summary = summaryById.get(product.id)
    if (!summary) {
      throw new Error(`Dataset is malformed: product ${product.id} has no summary`)
    }
    const weekly = weeklyById.get(product.id) ?? new Array<WeeklySeasonality | null>(WEEK_BINS).fill(null)
    return {
      product,
      summary,
      weekly,
      marketSeries: weekly.map((w) => w?.marketScore ?? null),
      localSeries: weekly.map((w) => w?.localScore ?? null),
    }
  })
}

/** Series for the active mode. Market and local must never be conflated. */
export function seriesForMode(view: ProductView, mode: ViewMode): Array<number | null> {
  return mode === 'local' ? view.localSeries : view.marketSeries
}

/**
 * Season state at a week for the active mode. Products below the public
 * evidence thresholds never emit season claims — always `sin_datos` (§36).
 */
export function stateAt(view: ProductView, mode: ViewMode, week: number): SeasonState {
  if (view.summary.insufficientEvidence) return 'sin_datos'
  return seasonStateAt(seriesForMode(view, mode), week)
}

// ---------------------------------------------------------------------------
// Search and filters (§14)
// ---------------------------------------------------------------------------

/** Lowercase and strip diacritics so "pina" matches "Piña". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Match against display name, aliases and variety names. */
export function matchesQuery(product: Product, query: string): boolean {
  const q = normalizeText(query)
  if (q === '') return true
  const haystack = [product.nameEs, ...product.aliases, ...(product.varieties ?? [])]
  return haystack.some((name) => normalizeText(name).includes(q))
}

export function filterViews(
  views: ReadonlyArray<ProductView>,
  query: string,
  category: CategoryFilter,
): ProductView[] {
  return views.filter(
    (v) => categoryMatchesFilter(v.product.category, category) && matchesQuery(v.product, query),
  )
}

// ---------------------------------------------------------------------------
// Sorting (§77)
// ---------------------------------------------------------------------------

export type SortKey = 'inicio' | 'nombre' | 'temporada' | 'confianza' | 'categoria'

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'inicio', label: 'Inicio de temporada' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'temporada', label: 'Temporada actual' },
  { value: 'confianza', label: 'Confianza' },
  { value: 'categoria', label: 'Categoría' },
]

const STATE_ORDER: Record<SeasonState, number> = {
  pico: 0,
  entrando: 1,
  en_temporada: 2,
  saliendo: 3,
  fuera: 4,
  sin_datos: 5,
}

const byName = (a: ProductView, b: ProductView) =>
  a.product.nameEs.localeCompare(b.product.nameEs, 'es')

/** Cyclic range length in week bins (a wrapping range crosses the year edge). */
function rangeLength(range: SeasonRange): number {
  return range.startWeek <= range.endWeek
    ? range.endWeek - range.startWeek + 1
    : WEEK_BINS - range.startWeek + 1 + range.endWeek
}

/**
 * Cascade anchor (design-references NOTES §4): the start week of the
 * product's principal season range for the active mode — longest range
 * first, earlier start on ties. Null when the product has no ranges to
 * cascade (insufficient evidence, or no season in this mode); a
 * reference-season estimate NEVER supplies an anchor (§104: the estimate
 * must not raise prominence).
 */
function cascadeStart(view: ProductView, mode: ViewMode): number | null {
  if (view.summary.insufficientEvidence) return null
  const ranges =
    mode === 'local' ? view.summary.localSeasonRanges : view.summary.marketSeasonRanges
  if (ranges.length === 0) return null
  const main = [...ranges].sort(
    (a, b) => rangeLength(b) - rangeLength(a) || a.startWeek - b.startWeek,
  )[0]!
  return main.startWeek
}

export function sortViews(
  views: ReadonlyArray<ProductView>,
  sort: SortKey,
  mode: ViewMode,
  referenceWeek: number,
): ProductView[] {
  const sorted = [...views]
  switch (sort) {
    case 'inicio':
      // Cascade (the default): curves step across the year by season
      // start. Products without a cascade anchor follow, alphabetically,
      // with insufficient-evidence products last (§104).
      return sorted.sort((a, b) => {
        const sa = cascadeStart(a, mode)
        const sb = cascadeStart(b, mode)
        if (sa !== null && sb !== null) return sa - sb || byName(a, b)
        if (sa !== null) return -1
        if (sb !== null) return 1
        if (a.summary.insufficientEvidence !== b.summary.insufficientEvidence) {
          return a.summary.insufficientEvidence ? 1 : -1
        }
        return byName(a, b)
      })
    case 'nombre':
      // Default order (§104): classifiable products come first; products
      // with insufficient evidence — including estimate-only ones, whose
      // bibliography estimate must never raise their prominence — sort
      // after them, alphabetically within each group.
      return sorted.sort((a, b) => {
        if (a.summary.insufficientEvidence !== b.summary.insufficientEvidence) {
          return a.summary.insufficientEvidence ? 1 : -1
        }
        return byName(a, b)
      })
    case 'confianza':
      return sorted.sort((a, b) => {
        if (a.summary.insufficientEvidence !== b.summary.insufficientEvidence) {
          return a.summary.insufficientEvidence ? 1 : -1
        }
        return b.summary.confidence - a.summary.confidence || byName(a, b)
      })
    case 'categoria':
      return sorted.sort(
        (a, b) => a.product.category.localeCompare(b.product.category, 'es') || byName(a, b),
      )
    case 'temporada':
      return sorted.sort((a, b) => {
        const sa = STATE_ORDER[stateAt(a, mode, referenceWeek)]
        const sb = STATE_ORDER[stateAt(b, mode, referenceWeek)]
        if (sa !== sb) return sa - sb
        const scoreA = seriesForMode(a, mode)[referenceWeek - 1] ?? -1
        const scoreB = seriesForMode(b, mode)[referenceWeek - 1] ?? -1
        return scoreB - scoreA || byName(a, b)
      })
  }
}

// ---------------------------------------------------------------------------
// Evidence-derived display helpers (§17, §35, §55)
// ---------------------------------------------------------------------------

/**
 * Share of local (Santa Cruz) origins among known-origin observations.
 * Read from the pipeline-computed aggregate — NEVER summed from the
 * display-truncated primaryOrigins list. Null (no known origins) must
 * render as "sin datos", not as 0 %.
 */
export function localShareOfKnown(summary: ProductSeasonSummary): number | null {
  return summary.localShareOfKnown
}

export interface SignalContribution {
  key: 'presencia' | 'oferta' | 'precio' | 'procedencia' | 'cosecha'
  label: string
  contributed: boolean
}

/** Which model signals actually contributed evidence for this product (§17). */
export function signalContributions(view: ProductView): SignalContribution[] {
  const any = (pick: (w: WeeklySeasonality) => number | null) =>
    view.weekly.some((w) => w !== null && pick(w) !== null)
  return [
    { key: 'presencia', label: 'Presencia en mercado', contributed: any((w) => w.presenceProbability) },
    { key: 'oferta', label: 'Nivel de oferta', contributed: any((w) => w.availabilityScore) },
    { key: 'precio', label: 'Precio relativo', contributed: any((w) => w.relativePriceScore) },
    { key: 'procedencia', label: 'Procedencia', contributed: any((w) => w.localShare) },
    { key: 'cosecha', label: 'Calendario de cosecha', contributed: any((w) => w.harvestScore) },
  ]
}

/**
 * Plain-language confidence explanation (§17, §35). Built only from recorded
 * evidence — it must never invent certainty.
 */
export function confidenceExplanation(summary: ProductSeasonSummary): string {
  const e = summary.evidence
  const parts: string[] = []
  parts.push(
    `Hay ${e.observations} ${e.observations === 1 ? 'observación' : 'observaciones'} en ` +
      `${e.years} ${e.years === 1 ? 'año' : 'años'} y ` +
      `${e.independentSources} ${e.independentSources === 1 ? 'fuente independiente' : 'fuentes independientes'}.`,
  )
  if (e.yearConsistency !== null) {
    parts.push(`La coincidencia del patrón entre años es del ${Math.round(e.yearConsistency * 100)} %.`)
  }
  if (summary.insufficientEvidence) {
    parts.push(
      `Se necesitan al menos ${EVIDENCE.minObservations} observaciones y ` +
        `${EVIDENCE.minYears} años de datos para clasificar la temporada públicamente.`,
    )
  } else if (e.years === 1) {
    parts.push('Un solo año de datos limita la confianza posible.')
  } else if (e.years < EVIDENCE.strongYears) {
    parts.push(
      `Con menos de ${EVIDENCE.strongYears} años de datos la confianza no puede llegar a "Alta".`,
    )
  }
  return parts.join(' ')
}
