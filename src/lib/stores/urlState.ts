/**
 * URL search-param codec for shareable dashboard state (PROJECT.md §49, §74).
 * Pure functions — the store applies them to history/location.
 *
 * Params: ?product=<slug>&mode=local&category=<filter>&q=<text>&week=<1..52>
 * Defaults are omitted so a pristine dashboard has a clean URL.
 */

import { toWeekBin } from '../domain/isoWeek'
import { CATEGORY_FILTERS, type CategoryFilter, type ViewMode } from '../i18n/labels'

export interface DashboardParams {
  /** Selected product slug, or null when no product is open. */
  product: string | null
  mode: ViewMode
  category: CategoryFilter
  query: string
  /** Pinned reference week (month explorer), or null to follow today. */
  week: number | null
}

export const DEFAULT_PARAMS: DashboardParams = {
  product: null,
  mode: 'mercado',
  category: 'todos',
  query: '',
  week: null,
}

/** Longest accepted search query; parse and serialize apply the same cap. */
export const MAX_QUERY_LENGTH = 100

// Derived from the filter registry so the codec can never drift from the UI.
const CATEGORY_VALUES: ReadonlySet<string> = new Set(CATEGORY_FILTERS.map((f) => f.value))

function isCategoryFilter(value: string): value is CategoryFilter {
  return CATEGORY_VALUES.has(value)
}

/**
 * Parse a location.search string. Unknown or invalid values fall back to
 * defaults — a shared URL must never crash the dashboard (§78).
 */
export function parseParams(
  search: string,
  validProductSlugs: ReadonlySet<string>,
): DashboardParams {
  const params = new URLSearchParams(search)
  const out: DashboardParams = { ...DEFAULT_PARAMS }

  const product = params.get('product')
  if (product !== null && validProductSlugs.has(product)) out.product = product

  if (params.get('mode') === 'local') out.mode = 'local'

  const category = params.get('category')
  if (category !== null && isCategoryFilter(category)) {
    out.category = category
  }

  const query = params.get('q')
  if (query !== null) out.query = query.slice(0, MAX_QUERY_LENGTH)

  const week = params.get('week')
  if (week !== null && /^\d{1,2}$/.test(week)) {
    const n = Number(week)
    // ISO week 53 folds into bin 52, same convention as everywhere else.
    if (n >= 1 && n <= 53) out.week = toWeekBin(n)
  }

  return out
}

/** Serialize to a search string ('' when everything is default). */
export function serializeParams(p: DashboardParams): string {
  const params = new URLSearchParams()
  if (p.product !== null) params.set('product', p.product)
  if (p.mode === 'local') params.set('mode', 'local')
  if (p.category !== 'todos') params.set('category', p.category)
  const query = p.query.slice(0, MAX_QUERY_LENGTH)
  if (query.trim() !== '') params.set('q', query)
  if (p.week !== null) params.set('week', String(p.week))
  const s = params.toString()
  return s === '' ? '' : `?${s}`
}
