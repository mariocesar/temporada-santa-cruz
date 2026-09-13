/**
 * Dataset loader: fetches the application-ready JSON produced by the data
 * pipeline (public/data/). Paths are BASE_URL-aware — never hard-code URLs
 * starting with `/` (PROJECT.md §5).
 */

import type {
  DataSource,
  DatasetIndex,
  Product,
  ProductSeasonSummary,
  WeeklySeasonality,
} from './types'

function dataUrl(file: string): string {
  return `${import.meta.env.BASE_URL}data/${file}`
}

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(dataUrl(file))
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${file} (HTTP ${response.status})`)
  }
  return (await response.json()) as T
}

export function loadDatasetIndex(): Promise<DatasetIndex> {
  return fetchJson<DatasetIndex>('index.json')
}

export function loadProducts(): Promise<Product[]> {
  return fetchJson<Product[]>('products.json')
}

export function loadSeasonality(): Promise<WeeklySeasonality[]> {
  return fetchJson<WeeklySeasonality[]>('seasonality.json')
}

export function loadSummaries(): Promise<ProductSeasonSummary[]> {
  return fetchJson<ProductSeasonSummary[]>('summaries.json')
}

export function loadSources(): Promise<DataSource[]> {
  return fetchJson<DataSource[]>('sources.json')
}

export interface Dataset {
  index: DatasetIndex
  products: Product[]
  summaries: ProductSeasonSummary[]
}

/** Core dataset for the dashboard shell (weekly detail loads on demand). */
export async function loadDataset(): Promise<Dataset> {
  const [index, products, summaries] = await Promise.all([
    loadDatasetIndex(),
    loadProducts(),
    loadSummaries(),
  ])
  return { index, products, summaries }
}
