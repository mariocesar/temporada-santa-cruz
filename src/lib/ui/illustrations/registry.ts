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

/**
 * Tier 1 historical plate. Every entry below was curated 2026-09-13 via a
 * source-scout fan-out and an adversarial verifier pass: species line,
 * artist/date and licence template read off the provenance page, direct
 * file checked, synonymies confirmed against WFO where the plate uses a
 * historical name. Files live in public/illustrations (≈520 px, resized
 * from the archival scans).
 */
function plate(
  productId: string,
  title: string,
  scientificName: string,
  artist: string,
  year: number,
  license: string,
  sourceUrl: string,
  note?: string,
): IllustrationEntry {
  return {
    productId,
    kind: 'historical',
    title,
    scientificName,
    artist,
    year,
    license,
    sourceUrl,
    file: `illustrations/${productId}.jpg`,
    note,
  }
}

const USDA_LICENSE = 'Dominio público (obra del gobierno de EE. UU., colección de acuarelas pomológicas del USDA)'

export const ILLUSTRATIONS: ReadonlyArray<IllustrationEntry> = [
  own('achachairu', 'Achachairú', 'Garcinia humilis'),
  plate(
    'papaya',
    'Papaya',
    'Carica papaya',
    'Köhler’s Medizinal-Pflanzen (Franz Eugen Köhler)',
    1897,
    'Dominio público (publicada en 1897)',
    'https://commons.wikimedia.org/wiki/File:Carica_papaya_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-029.jpg',
  ),
  plate(
    'pina',
    'Piña',
    'Ananas comosus',
    'J. Marion Shull',
    1919,
    USDA_LICENSE,
    'https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00007369.jpg',
  ),
  plate(
    'mandarina',
    'Mandarina «Francis Heiney»',
    'Citrus reticulata',
    'Royal Charles Steadman',
    1918,
    USDA_LICENSE,
    'https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00006443.jpg',
  ),
  plate(
    'naranja',
    'Naranja «Homosassa»',
    'Citrus sinensis',
    'J. Marion Shull',
    1937,
    USDA_LICENSE,
    'https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00006405.jpg',
  ),
  plate(
    'sandia',
    'Sandía «Tom Watson»',
    'Citrullus lanatus',
    'Royal Charles Steadman',
    1916,
    USDA_LICENSE,
    'https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00007419.jpg',
  ),
  own('frutilla', 'Frutilla', 'Fragaria × ananassa'),
  plate(
    'tomate',
    'Tomate',
    'Solanum lycopersicum',
    'Flora de Filipinas (Francisco Manuel Blanco), lám. 43b',
    1883,
    'Dominio público (publicada 1880–1883)',
    'https://commons.wikimedia.org/wiki/File:Lycopersicum_philippinarum_Blanco1.43b.png',
    'Lámina rotulada «Solanum lycopersicum» (var. cerasiforme); el nombre histórico ' +
      '«Lycopersicum philippinarum» (Dunal) es sinónimo reconocido de Solanum lycopersicum (WFO).',
  ),
  own('guineo', 'Guineo', 'Musa acuminata'),
  plate(
    'uva',
    'Uva «Trifere du Japon»',
    'Vitis vinifera',
    'Amanda Almira Newton',
    1911,
    USDA_LICENSE,
    'https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00005820.jpg',
  ),
  plate(
    'yuca',
    'Yuca',
    'Manihot esculenta',
    'Köhler’s Medizinal-Pflanzen (Franz Eugen Köhler)',
    1897,
    'Dominio público (publicada en 1897)',
    'https://commons.wikimedia.org/wiki/File:Manihot_esculenta_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-090.jpg',
  ),
  plate(
    'palta',
    'Palta',
    'Persea americana',
    'Flora medica (D. N. F. Dietrich), lám. 42',
    1831,
    'Dominio público (publicada c. 1829–1831)',
    'https://commons.wikimedia.org/wiki/File:Flora_medica,_oder,_Abbildung_der_wichtigsten_officinellen_Pflanzen_(Pl._042)_(6031976663).jpg',
    'Lámina rotulada «Persea gratissima», sinónimo reconocido de Persea americana (WFO).',
  ),
  plate(
    'mango',
    'Mango',
    'Mangifera indica',
    'Walter Hood Fitch — Curtis’s Botanical Magazine, lám. 4510',
    1850,
    'Dominio público (publicada en 1850)',
    'https://commons.wikimedia.org/wiki/File:The_Botanical_Magazine._Mango.jpg',
  ),
  plate(
    'limon',
    'Limón «Cameron»',
    'Citrus aurantiifolia',
    'Ellen Isham Schutt',
    1909,
    USDA_LICENSE,
    'https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00006353.jpg',
  ),
  plate(
    'durazno',
    'Durazno «Berry»',
    'Prunus persica',
    'Deborah Griscom Passmore',
    1905,
    USDA_LICENSE,
    'https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00005183.jpg',
  ),
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
