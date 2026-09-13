/**
 * Dashboard state (PROJECT.md §49): the small set of shareable UI state —
 * mode, selected product, category filter, search query, reference week —
 * synchronized with URL search params (§74). Everything else stays local to
 * components.
 */

import { weekBinOf } from '../domain/isoWeek'
import type { CategoryFilter, ViewMode } from '../i18n/labels'
import type { SortKey } from '../data/views'
import { DEFAULT_PARAMS, parseParams, serializeParams, type DashboardParams } from './urlState'

/** Current ISO week bin from the browser's local date. */
export function todayWeekBin(): number {
  const now = new Date()
  // Local calendar date, expressed as UTC so isoWeek's UTC math reads the
  // user's own date (not the UTC date, which can differ near midnight).
  const local = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  return weekBinOf(local).bin
}

export class DashboardState {
  mode = $state<ViewMode>('mercado')
  selectedSlug = $state<string | null>(null)
  category = $state<CategoryFilter>('todos')
  query = $state('')
  /** Week pinned via the month explorer; null follows the browser's week. */
  pinnedWeek = $state<number | null>(null)
  /** Timeline sort — deliberately NOT in the URL (§49: only useful state). */
  sort = $state<SortKey>('inicio')

  readonly todayWeek: number

  constructor(initialSearch: string, validProductSlugs: ReadonlySet<string>, todayWeek: number) {
    this.todayWeek = todayWeek
    this.applyParams(parseParams(initialSearch, validProductSlugs))
  }

  /** The week the dashboard is answering questions about. */
  get referenceWeek(): number {
    return this.pinnedWeek ?? this.todayWeek
  }

  get isToday(): boolean {
    return this.pinnedWeek === null
  }

  get params(): DashboardParams {
    return {
      product: this.selectedSlug,
      mode: this.mode,
      category: this.category,
      query: this.query,
      week: this.pinnedWeek,
    }
  }

  applyParams(p: DashboardParams): void {
    this.selectedSlug = p.product
    this.mode = p.mode
    this.category = p.category
    this.query = p.query
    this.pinnedWeek = p.week
  }

  reset(): void {
    this.applyParams({ ...DEFAULT_PARAMS })
  }

  /** Serialized search string for the current state ('' when default). */
  get searchString(): string {
    return serializeParams(this.params)
  }
}
