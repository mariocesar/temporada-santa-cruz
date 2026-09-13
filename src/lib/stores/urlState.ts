/**
 * URL search-param codec for shareable dashboard state (PROJECT.md §49, §74).
 * Pure functions — the store applies them to history/location.
 *
 * Params: ?product=<slug>&mode=local&category=<filter>&q=<text>&week=<1..52>
 * Defaults are omitted so a pristine dashboard has a clean URL.
 */

import { WEEK_BINS } from '../domain/methodology'
import type { CategoryFilter, ViewMode } from '../i18n/labels'

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

const CATEGORY_VALUES: ReadonlySet<string> = new Set(['fruit', 'vegetable', 'tuber', 'otros'])

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
  if (category !== null && CATEGORY_VALUES.has(category)) {
    out.category = category as CategoryFilter
  }

  const query = params.get('q')
  if (query !== null) out.query = query.slice(0, 100)

  const week = params.get('week')
  if (week !== null && /^\d{1,2}$/.test(week)) {
    const n = Number(week)
    if (n >= 1 && n <= WEEK_BINS) out.week = n
  }

  return out
}

/** Serialize to a search string ('' when everything is default). */
export function serializeParams(p: DashboardParams): string {
  const params = new URLSearchParams()
  if (p.product !== null) params.set('product', p.product)
  if (p.mode === 'local') params.set('mode', 'local')
  if (p.category !== 'todos') params.set('category', p.category)
  if (p.query.trim() !== '') params.set('q', p.query)
  if (p.week !== null) params.set('week', String(p.week))
  const s = params.toString()
  return s === '' ? '' : `?${s}`
}
