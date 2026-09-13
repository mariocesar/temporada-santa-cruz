/**
 * Spanish (Bolivia) UI labels for domain enums. UI text lives here so the
 * domain modules stay language-neutral. Never conflate the three core
 * concepts: Disponible / En temporada / Temporada local (PROJECT.md §2).
 */

import type { ConfidenceLabel, ProductCategory, SeasonClass, SeasonState } from '../data/types'

export const SEASON_STATE_LABEL: Record<SeasonState, string> = {
  pico: 'Pico',
  entrando: 'Entrando en temporada',
  en_temporada: 'En temporada',
  saliendo: 'Saliendo de temporada',
  fuera: 'Fuera de temporada',
  sin_datos: 'Sin datos',
}

export const SEASON_CLASS_LABEL: Record<SeasonClass, string> = {
  off: 'Fuera de temporada',
  occasional: 'Oferta ocasional',
  in_season: 'En temporada',
  peak: 'Pico',
  insufficient: 'Sin evidencia',
}

export const CONFIDENCE_TEXT: Record<ConfidenceLabel, string> = {
  muy_baja: 'Muy baja',
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

/** Display label for a product's own category. */
export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  fruit: 'Fruta',
  vegetable: 'Verdura',
  tuber: 'Tubérculo',
  grain: 'Grano',
  herb: 'Hierba',
  other: 'Otro',
}

/**
 * Filter buckets (§14): the visible filters are broader than the raw
 * categories — grain/herb/other collapse into "Otros".
 */
export type CategoryFilter = 'todos' | 'fruit' | 'vegetable' | 'tuber' | 'otros'

export const CATEGORY_FILTERS: ReadonlyArray<{ value: CategoryFilter; label: string }> = [
  { value: 'todos', label: 'Todo' },
  { value: 'fruit', label: 'Frutas' },
  { value: 'vegetable', label: 'Verduras' },
  { value: 'tuber', label: 'Tubérculos' },
  { value: 'otros', label: 'Otros' },
]

export function categoryMatchesFilter(category: ProductCategory, filter: CategoryFilter): boolean {
  if (filter === 'todos') return true
  if (filter === 'otros') return category === 'grain' || category === 'herb' || category === 'other'
  return category === filter
}

/** View mode: market season vs local (Santa Cruz) production season. */
export type ViewMode = 'mercado' | 'local'

export const MODE_LABEL: Record<ViewMode, string> = {
  mercado: 'Mercado',
  local: 'Producción cruceña',
}
