/**
 * `bun run seed:demo` — regenerate the SYNTHETIC demo seed dataset
 * (data/raw/demo/observations.csv).
 *
 * Everything this script emits is INVENTED. It exists only so the UI and
 * pipeline can be developed before real CAO/SIPREM, SIIP and INE material
 * is ingested (PROJECT.md §45). All rows belong to sources flagged
 * `synthetic: true`; the published dataset carries containsDemoData and the
 * UI shows the DATOS DE DEMOSTRACIÓN banner.
 *
 * The generator is DETERMINISTIC (seeded PRNG): re-running it reproduces
 * the committed CSV byte for byte.
 *
 * Deliberate showcase cases:
 * - achachairú: short, pronounced Dec→Feb season crossing the year boundary
 * - uva: single-year sparse data → "Datos insuficientes" + non-local origin
 * - yuca/guineo: package units only → no comparable price trend (§54)
 * - durazno: local Valles Cruceños season vs. off-season imports
 * - one report lands in ISO week 53 (2020-12-28) → exercises the bin fold
 */

import path from 'node:path'
import { cyclicWeekDistance } from '../../../src/lib/domain/cyclic'
import { weekBinOf } from '../../../src/lib/domain/isoWeek'
import { toCsv } from '../lib/csv'
import { ok, PATHS, ROOT, writeText } from '../lib/io'
import { RAW_CSV_COLUMNS } from '../schemas'

// --- Deterministic PRNG (mulberry32) ---------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260913)

function pick<T>(options: ReadonlyArray<readonly [T, number]>): T {
  const total = options.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [value, weight] of options) {
    r -= weight
    if (r <= 0) return value
  }
  return options[options.length - 1]![0]
}

// --- Synthetic product profiles ---------------------------------------------

interface Profile {
  /** Raw spellings emitted for product_raw (weighted). */
  spellings: ReadonlyArray<readonly [string, number]>
  peakWeek: number
  /** Half-width of the quadratic seasonal bump, in weeks. */
  width: number
  presenceFloor: number
  presencePeak: number
  /** Availability score floor off-season (staples stay "normal"). */
  availabilityFloor: number
  /** origin_raw spellings, weighted; '' = unknown origin. */
  origins: ReadonlyArray<readonly [string, number]>
  /** Optional distinct origin mix when the local season is off. */
  originsOff?: ReadonlyArray<readonly [string, number]>
  wholesaleUnit: string
  wholesaleBase: number
  retailUnit: string
  retailBase: number
  varieties?: ReadonlyArray<readonly [string, number]>
  /** Restrict emission (e.g. uva: single sparse year). */
  emit?: (isoYear: number, bin: number, sourceId: string) => boolean
}

const PROFILES: Record<string, Profile> = {
  achachairu: {
    spellings: [['Achachairú', 8], ['Achacha', 2]],
    peakWeek: 1, width: 8, presenceFloor: 0, presencePeak: 0.98, availabilityFloor: 0.05,
    origins: [['Santa Cruz', 5], ['Sta. Cruz', 2], ['Norte Integrado', 2], ['', 2]],
    wholesaleUnit: 'ciento', wholesaleBase: 55, retailUnit: 'unidad', retailBase: 1.1,
  },
  papaya: {
    spellings: [['Papaya', 1]],
    peakWeek: 10, width: 26, presenceFloor: 0.85, presencePeak: 0.98, availabilityFloor: 0.5,
    origins: [['Santa Cruz', 4], ['Norte Integrado', 3], ['Beni', 1], ['', 2]],
    wholesaleUnit: 'kg', wholesaleBase: 4.2, retailUnit: 'kg', retailBase: 7,
  },
  pina: {
    spellings: [['Piña', 1]],
    peakWeek: 50, width: 16, presenceFloor: 0.7, presencePeak: 0.95, availabilityFloor: 0.35,
    origins: [['Santa Cruz', 3], ['Norte Integrado', 3], ['Beni', 1], ['', 3]],
    wholesaleUnit: 'unidad', wholesaleBase: 7, retailUnit: 'unidad', retailBase: 12,
  },
  mandarina: {
    spellings: [['Mandarina', 1]],
    peakWeek: 22, width: 14, presenceFloor: 0.06, presencePeak: 0.97, availabilityFloor: 0.08,
    origins: [['Santa Cruz', 3], ['Valles Cruceños', 2], ['Cochabamba', 3], ['Cbba.', 1], ['', 2]],
    wholesaleUnit: 'ciento', wholesaleBase: 28, retailUnit: 'unidad', retailBase: 0.5,
    varieties: [['Criolla', 5], ['Ponkan', 3], ['', 4]],
  },
  naranja: {
    spellings: [['Naranja', 1]],
    peakWeek: 26, width: 17, presenceFloor: 0.12, presencePeak: 0.96, availabilityFloor: 0.12,
    origins: [['Santa Cruz', 3], ['Norte Integrado', 2], ['Cochabamba', 3], ['', 2]],
    wholesaleUnit: 'ciento', wholesaleBase: 40, retailUnit: 'unidad', retailBase: 0.7,
    varieties: [['Criolla', 4], ['Valencia', 3], ['', 5]],
  },
  sandia: {
    spellings: [['Sandía', 1]],
    peakWeek: 50, width: 11, presenceFloor: 0.05, presencePeak: 0.95, availabilityFloor: 0.06,
    origins: [['Santa Cruz', 6], ['Valles Cruceños', 1], ['', 3]],
    wholesaleUnit: 'unidad', wholesaleBase: 14, retailUnit: 'unidad', retailBase: 22,
  },
  durazno: {
    spellings: [['Durazno', 1]],
    peakWeek: 2, width: 10, presenceFloor: 0.12, presencePeak: 0.95, availabilityFloor: 0.1,
    origins: [['Valles Cruceños', 4], ['Comarapa', 2], ['Mairana', 1], ['', 2]],
    originsOff: [['Argentina', 5], ['Chile', 2], ['', 3]],
    wholesaleUnit: 'kg', wholesaleBase: 9, retailUnit: 'kg', retailBase: 15,
  },
  frutilla: {
    spellings: [['Frutilla', 7], ['Fresa', 3]],
    peakWeek: 34, width: 11, presenceFloor: 0.06, presencePeak: 0.92, availabilityFloor: 0.06,
    origins: [['Comarapa', 5], ['Valles Cruceños', 2], ['Cochabamba', 1], ['', 2]],
    wholesaleUnit: 'kg', wholesaleBase: 12, retailUnit: 'kg', retailBase: 20,
  },
  uva: {
    spellings: [['Uva', 1]],
    peakWeek: 7, width: 7, presenceFloor: 0, presencePeak: 0.9, availabilityFloor: 0.05,
    origins: [['Tarija', 7], ['Santa Cruz', 1], ['', 2]],
    wholesaleUnit: 'kg', wholesaleBase: 15, retailUnit: 'kg', retailBase: 24,
    varieties: [['Moscatel', 6], ['', 4]],
    // Deliberately sparse: one year only, a handful of observations →
    // the product must publish as "Datos insuficientes".
    emit: (isoYear, bin, sourceId) =>
      sourceId === 'demo-mayorista' && isoYear === 2025 && bin >= 2 && bin <= 12,
  },
  guineo: {
    spellings: [['Guineo', 7], ['Banano', 3]],
    peakWeek: 20, width: 26, presenceFloor: 0.9, presencePeak: 0.99, availabilityFloor: 0.55,
    origins: [['Norte Integrado', 4], ['Santa Cruz', 2], ['Cochabamba', 2], ['', 2]],
    wholesaleUnit: 'chipa', wholesaleBase: 30, retailUnit: 'docena', retailBase: 8,
  },
  tomate: {
    spellings: [['Tomate', 1]],
    peakWeek: 28, width: 18, presenceFloor: 0.85, presencePeak: 0.98, availabilityFloor: 0.45,
    origins: [['Santa Cruz', 3], ['Valles Cruceños', 2], ['Cochabamba', 3], ['', 2]],
    wholesaleUnit: 'kg', wholesaleBase: 5.5, retailUnit: 'kg', retailBase: 9,
  },
  yuca: {
    spellings: [['Yuca', 1]],
    peakWeek: 16, width: 22, presenceFloor: 0.8, presencePeak: 0.97, availabilityFloor: 0.45,
    // Package unit only → historical prices are NOT comparable (§54 case).
    origins: [['Santa Cruz', 5], ['Norte Integrado', 3], ['', 2]],
    wholesaleUnit: 'bolsa', wholesaleBase: 45, retailUnit: 'arroba', retailBase: 18,
  },
}

// --- Report calendars -------------------------------------------------------

const DAY = 86_400_000

function* dates(startIso: string, endIso: string, stepDays: number): Generator<string> {
  const end = Date.parse(endIso + 'T00:00:00Z')
  for (let t = Date.parse(startIso + 'T00:00:00Z'); t <= end; t += stepDays * DAY) {
    yield new Date(t).toISOString().slice(0, 10)
  }
}

interface SourceSpec {
  id: string
  reportPrefix: string
  market: string
  /** 'A'/'N'/'E' vs full words — exercises the availability normalizer. */
  availabilityStyle: 'letter' | 'word'
  priceKind: 'wholesale' | 'retail'
  reportDates: string[]
  /** Probability a scheduled report is missing (coverage gaps are normal). */
  gapProbability: number
}

const SOURCES: SourceSpec[] = [
  {
    id: 'demo-mayorista',
    reportPrefix: 'demo-may',
    market: 'Mercado Abasto',
    availabilityStyle: 'letter',
    priceKind: 'wholesale',
    // Biweekly Mondays; 2020-12-28 lands in ISO week 53 of 2020.
    reportDates: [...dates('2020-07-13', '2026-08-31', 14)],
    gapProbability: 0.07,
  },
  {
    id: 'demo-minorista',
    reportPrefix: 'demo-min',
    market: 'Mercado Los Pozos',
    availabilityStyle: 'word',
    priceKind: 'retail',
    reportDates: [...dates('2023-01-09', '2026-08-31', 28)],
    gapProbability: 0.05,
  },
]

// --- Row synthesis ----------------------------------------------------------

function intensity(profile: Profile, bin: number): number {
  const d = cyclicWeekDistance(bin, profile.peakWeek)
  return Math.max(0, 1 - (d / profile.width) ** 2)
}

function availabilityLevel(profile: Profile, s: number): 'A' | 'N' | 'E' {
  const score = profile.availabilityFloor + (1 - profile.availabilityFloor) * s + (rand() - 0.5) * 0.24
  if (score > 0.72) return 'A'
  if (score < 0.38) return 'E'
  return 'N'
}

const AVAILABILITY_WORDS = { A: 'Abundante', N: 'Normal', E: 'Escasa' } as const

function price(base: number, s: number): string {
  const value = base * (1.3 - 0.5 * s) * (1 + (rand() - 0.5) * 0.16)
  return value.toFixed(2)
}

const rows: string[][] = []

for (const source of SOURCES) {
  for (const date of source.reportDates) {
    if (rand() < source.gapProbability) continue // missing report ≠ absence
    const reportId = `${source.reportPrefix}-${date}`
    const { isoYear, bin } = weekBinOf(date)
    for (const profile of Object.values(PROFILES)) {
      if (profile.emit && !profile.emit(isoYear, bin, source.id)) continue
      const s = intensity(profile, bin)
      const presence = profile.presenceFloor + (profile.presencePeak - profile.presenceFloor) * s
      if (rand() >= presence) continue

      const inLocalSeason = s >= 0.3
      const originPool = !inLocalSeason && profile.originsOff ? profile.originsOff : profile.origins
      const originRaw = pick(originPool)
      const variety = profile.varieties ? pick(profile.varieties) : ''
      const quality = source.priceKind === 'wholesale' ? pick([['Primera', 7], ['Segunda', 2], ['', 3]] as const) : ''
      const level = availabilityLevel(profile, s)
      const availability = source.availabilityStyle === 'letter' ? level : AVAILABILITY_WORDS[level]

      const wholesale = source.priceKind === 'wholesale'
      rows.push([
        date,
        source.id,
        reportId,
        source.market,
        pick(profile.spellings),
        originRaw,
        variety,
        quality,
        availability,
        wholesale ? price(profile.wholesaleBase, s) : '',
        wholesale ? profile.wholesaleUnit : '',
        wholesale ? '' : price(profile.retailBase, s),
        wholesale ? '' : profile.retailUnit,
      ])
    }
  }
}

const out = path.join(PATHS.raw, 'demo', 'observations.csv')
writeText(out, toCsv([RAW_CSV_COLUMNS as unknown as string[], ...rows]))
ok(`${rows.length} SYNTHETIC demo rows → ${path.relative(ROOT, out)}`)
ok('remember: this data is invented; it must never be presented as fact')
