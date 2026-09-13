/**
 * Illustration registry — provenance for artwork, the same way sources.json
 * is provenance for data (docs/design-references/NOTES.md, illustration
 * policy §4). Every image the UI can show records who made it, when, under
 * what licence, and where it came from, so the owner can search and replace
 * any piece of art by editing one entry.
 *
 * `kind: 'original'` entries are drawn in this repo and carry their geometry
 * in ./glyphs.ts. `kind: 'historical'` entries are genuine public-domain
 * plates (policy Tier 1) and carry a `file` instead; none are curated yet —
 * the owner picks those.
 */

import { GLYPHS } from './glyphs'

export interface IllustrationEntry {
  productId: string
  kind: 'original' | 'historical'
  /** What the drawing depicts, in the product's own terms. */
  title: string
  /** Species drawn — a glyph must never depict the wrong one (policy §5). */
  scientificName: string
  artist: string
  year: number
  license: string
  /** Where the original lives. Required for historical plates. */
  sourceUrl?: string
  /** Asset file, historical plates only; originals are vector geometry. */
  file?: string
  note?: string
}

const OWN_ARTIST = 'Temporada Santa Cruz (obra original)'
const OWN_LICENSE = 'CC BY 4.0'
const OWN_YEAR = 2026

function own(productId: string, title: string, scientificName: string): IllustrationEntry {
  return {
    productId,
    kind: 'original',
    title,
    scientificName,
    artist: OWN_ARTIST,
    year: OWN_YEAR,
    license: OWN_LICENSE,
    note: 'Dibujo vectorial original de línea; no es una lámina histórica.',
  }
}

export const ILLUSTRATIONS: ReadonlyArray<IllustrationEntry> = [
  own('achachairu', 'Achachairú', 'Garcinia humilis'),
  own('papaya', 'Papaya', 'Carica papaya'),
  own('pina', 'Piña', 'Ananas comosus'),
  own('mandarina', 'Mandarina', 'Citrus reticulata'),
  own('naranja', 'Naranja', 'Citrus sinensis'),
  own('sandia', 'Sandía', 'Citrullus lanatus'),
  own('frutilla', 'Frutilla', 'Fragaria × ananassa'),
  own('tomate', 'Tomate', 'Solanum lycopersicum'),
  own('guineo', 'Guineo', 'Musa acuminata'),
  own('uva', 'Uva', 'Vitis vinifera'),
  own('yuca', 'Yuca', 'Manihot esculenta'),
  own('palta', 'Palta', 'Persea americana'),
  own('mango', 'Mango', 'Mangifera indica'),
  own('limon', 'Limón', 'Citrus aurantiifolia'),
  own('durazno', 'Durazno', 'Prunus persica'),
]

/** Registry entry for a product, or null when no art is curated for it. */
export function illustrationFor(productId: string): IllustrationEntry | null {
  return ILLUSTRATIONS.find((entry) => entry.productId === productId) ?? null
}

/**
 * Registry entries whose art the UI can actually render right now. An
 * `original` entry needs geometry in GLYPHS; a `historical` entry needs a
 * file. Anything else is a registry bookkeeping error, not renderable art.
 */
export function renderableIllustrations(): ReadonlyArray<IllustrationEntry> {
  return ILLUSTRATIONS.filter((entry) =>
    entry.kind === 'original' ? entry.productId in GLYPHS : entry.file != null,
  )
}

/** Distinct art credits for the sources section (policy §4). */
export interface ArtCredit {
  artist: string
  year: number
  license: string
  count: number
  kind: IllustrationEntry['kind']
  sourceUrl?: string
}

export function artCredits(): ReadonlyArray<ArtCredit> {
  const byKey = new Map<string, ArtCredit>()
  for (const entry of renderableIllustrations()) {
    const key = `${entry.artist}|${entry.year}|${entry.license}|${entry.sourceUrl ?? ''}`
    const existing = byKey.get(key)
    if (existing) {
      existing.count += 1
    } else {
      byKey.set(key, {
        artist: entry.artist,
        year: entry.year,
        license: entry.license,
        kind: entry.kind,
        sourceUrl: entry.sourceUrl,
        count: 1,
      })
    }
  }
  return [...byKey.values()]
}
