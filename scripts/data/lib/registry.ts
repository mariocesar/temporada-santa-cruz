/**
 * Registry loading and raw-string normalization tables.
 *
 * Matching is diacritic- and case-insensitive, but the matched RAW string is
 * always preserved next to the canonical value (PROJECT.md §26).
 */

import path from 'node:path'
import type {
  AvailabilityLevel,
  DataSource,
  MarketUnit,
  Origin,
  Product,
} from '../../../src/lib/data/types'
import type { PhenologyEntry } from '../schemas'
import { PATHS, readJson } from './io'

export interface UnitDef {
  id: string
  canonical: string
  aliases: string[]
  knownWeightKg?: number
  conversionConfidence?: number
}

export interface Registries {
  products: Product[]
  origins: Origin[]
  units: UnitDef[]
  sources: DataSource[]
  /** Curated reference-season windows (§104); display-only downstream. */
  phenology: PhenologyEntry[]
  productByAlias: Map<string, Product>
  originByAlias: Map<string, Origin>
  unitByAlias: Map<string, UnitDef>
  sourceById: Map<string, DataSource>
}

/** Fold a raw string for alias matching: trim, lowercase, strip diacritics. */
export function foldKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ')
}

function buildAliasMap<T>(
  items: T[],
  keysOf: (item: T) => string[],
  what: string,
): Map<string, T> {
  const map = new Map<string, T>()
  for (const item of items) {
    for (const key of keysOf(item).map(foldKey)) {
      if (key === '') continue
      const existing = map.get(key)
      if (existing && existing !== item) {
        throw new Error(`Ambiguous ${what} alias ${JSON.stringify(key)} maps to two entries`)
      }
      map.set(key, item)
    }
  }
  return map
}

/** Assemble alias indexes from registry contents (throws on ambiguity). */
export function buildRegistries(
  products: Product[],
  origins: Origin[],
  units: UnitDef[],
  sources: DataSource[],
  phenology: PhenologyEntry[] = [],
): Registries {
  return {
    products,
    origins,
    units,
    sources,
    phenology,
    productByAlias: buildAliasMap(products, (p) => [p.nameEs, ...p.aliases], 'product'),
    originByAlias: buildAliasMap(origins, (o) => [o.label, ...(o.aliases ?? [])], 'origin'),
    unitByAlias: buildAliasMap(units, (u) => [u.canonical, ...u.aliases], 'unit'),
    sourceById: new Map(sources.map((s) => [s.id, s])),
  }
}

export function loadRegistries(): Registries {
  return buildRegistries(
    readJson<Product[]>(path.join(PATHS.metadata, 'products.json')),
    readJson<Origin[]>(path.join(PATHS.metadata, 'origins.json')),
    readJson<UnitDef[]>(path.join(PATHS.metadata, 'units.json')),
    readJson<DataSource[]>(path.join(PATHS.metadata, 'sources.json')),
    readJson<PhenologyEntry[]>(path.join(PATHS.metadata, 'phenology.json')),
  )
}

/**
 * Cross-checks for the phenology registry (§104): every entry must point at
 * a known product and cite known, non-market, non-synthetic sources; one
 * entry per product. Window shapes/bounds are the zod schema's job.
 */
export function phenologyErrors(registries: Registries): string[] {
  const errors: string[] = []
  const productIds = new Set(registries.products.map((p) => p.id))
  const seen = new Set<string>()
  for (const entry of registries.phenology) {
    const where = `phenology.json: ${entry.productId}`
    if (!productIds.has(entry.productId)) {
      errors.push(`${where}: unknown product (add it to data/metadata/products.json)`)
    }
    if (seen.has(entry.productId)) {
      errors.push(`${where}: duplicate entry for product`)
    }
    seen.add(entry.productId)
    for (const sourceId of entry.sourceIds) {
      const source = registries.sourceById.get(sourceId)
      if (!source) {
        errors.push(`${where}: unknown source ${JSON.stringify(sourceId)}`)
        continue
      }
      if (source.sourceType === 'market') {
        errors.push(
          `${where}: market source ${sourceId} cannot back a reference season (§104)`,
        )
      }
      if (source.synthetic) {
        errors.push(`${where}: synthetic source ${sourceId} cannot back a reference season`)
      }
    }
  }
  return errors
}

/** Availability raw spellings → canonical level; null = unrecognized. */
const AVAILABILITY_ALIASES: Record<string, AvailabilityLevel> = {
  '': 'unknown',
  'desconocida': 'unknown',
  'desconocido': 'unknown',
  's/d': 'unknown',
  'e': 'scarce',
  'escasa': 'scarce',
  'escaso': 'scarce',
  'n': 'normal',
  'normal': 'normal',
  'a': 'abundant',
  'abundante': 'abundant',
}

export function normalizeAvailability(raw: string): AvailabilityLevel | null {
  return AVAILABILITY_ALIASES[foldKey(raw)] ?? null
}

/** Resolve a raw unit string to a MarketUnit, keeping the raw text. */
export function resolveUnit(raw: string, registries: Registries): MarketUnit | null {
  if (raw.trim() === '') return null
  const def = registries.unitByAlias.get(foldKey(raw))
  if (!def) return null
  const unit: MarketUnit = { raw, canonical: def.canonical }
  if (def.knownWeightKg !== undefined) unit.knownWeightKg = def.knownWeightKg
  if (def.conversionConfidence !== undefined) unit.conversionConfidence = def.conversionConfidence
  return unit
}

/** The original-evidence source for a record (mirrors collapse, §67). */
export function originalSourceOf(sourceId: string, registries: Registries): DataSource {
  const source = registries.sourceById.get(sourceId)
  if (!source) throw new Error(`Unknown source: ${sourceId}`)
  if (source.kind === 'mirror') {
    if (!source.mirrorOf) throw new Error(`Mirror source ${sourceId} lacks mirrorOf`)
    const original = registries.sourceById.get(source.mirrorOf)
    if (!original) throw new Error(`Mirror ${sourceId} points at unknown source ${source.mirrorOf}`)
    if (original.kind === 'mirror') {
      throw new Error(`Mirror chains are not allowed: ${sourceId} → ${source.mirrorOf}`)
    }
    return original
  }
  return source
}
