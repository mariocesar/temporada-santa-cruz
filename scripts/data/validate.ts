/**
 * `bun run data:validate` — validate registries and raw CSVs (§44).
 * Fails loudly with file:line context; nothing is written.
 */

import path from 'node:path'
import { parseCsvRecords } from './lib/csv'
import { fail, listCsvFiles, ok, PATHS, readText, ROOT } from './lib/io'
import { normalizeObservations, type LocatedRow } from './lib/pipeline'
import { loadRegistries, originalSourceOf, phenologyErrors } from './lib/registry'
import {
  originsFileSchema,
  phenologyFileSchema,
  productsFileSchema,
  RAW_CSV_HEADERS,
  rawCsvRowSchema,
  sourcesFileSchema,
  unitsFileSchema,
} from './schemas'

const errors: string[] = []

// --- Registries -----------------------------------------------------------

const registryFiles = [
  ['products.json', productsFileSchema],
  ['origins.json', originsFileSchema],
  ['units.json', unitsFileSchema],
  ['sources.json', sourcesFileSchema],
  ['phenology.json', phenologyFileSchema],
] as const

for (const [name, schema] of registryFiles) {
  const file = path.join(PATHS.metadata, name)
  const parsed = schema.safeParse(JSON.parse(readText(file)))
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${name}: ${issue.path.join('.')}: ${issue.message}`)
    }
  }
}

let registries: ReturnType<typeof loadRegistries> | null = null
try {
  registries = loadRegistries() // throws on ambiguous aliases
} catch (e) {
  errors.push(String(e instanceof Error ? e.message : e))
}

if (registries) {
  for (const list of [registries.products, registries.origins, registries.units, registries.sources]) {
    const seen = new Set<string>()
    for (const item of list as Array<{ id: string }>) {
      if (seen.has(item.id)) errors.push(`duplicate registry id: ${item.id}`)
      seen.add(item.id)
    }
  }
  for (const source of registries.sources) {
    try {
      originalSourceOf(source.id, registries) // validates mirrorOf chains
    } catch (e) {
      errors.push(String(e instanceof Error ? e.message : e))
    }
    // Synthetic sources must be unmistakable; real sources must not look demo.
    if (source.synthetic && !source.name.includes('DEMO')) {
      errors.push(`synthetic source ${source.id} must carry "DEMO" in its name`)
    }
    if (!source.synthetic && /demo/i.test(source.id)) {
      errors.push(`source ${source.id} looks like demo data but is not flagged synthetic`)
    }
  }
  // Reference-season registry cross-checks (§104).
  errors.push(...phenologyErrors(registries))
}

// --- Raw CSVs -------------------------------------------------------------

const csvFiles = listCsvFiles(PATHS.raw)
if (csvFiles.length === 0) {
  errors.push(`no raw CSV files found under ${path.relative(ROOT, PATHS.raw)}`)
}

const rows: LocatedRow[] = []
for (const file of csvFiles) {
  const rel = path.relative(ROOT, file)
  let header: string[]
  let records: Array<Record<string, string>>
  try {
    ;({ header, records } = parseCsvRecords(readText(file)))
  } catch (e) {
    errors.push(`${rel}: ${e instanceof Error ? e.message : e}`)
    continue
  }
  if (!RAW_CSV_HEADERS.includes(header.join(','))) {
    errors.push(
      `${rel}: header mismatch\n  expected: ${RAW_CSV_HEADERS.join('\n        or: ')}\n  found:    ${header.join(',')}`,
    )
    continue
  }
  records.forEach((record, i) => {
    const location = `${rel}:${i + 2}` // +1 header, +1 one-based
    const parsed = rawCsvRowSchema.safeParse(record)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${location}: ${issue.path.join('.')}: ${issue.message}`)
      }
      return
    }
    rows.push({ row: parsed.data, location })
  })
}

// --- Cross-row rules (alias resolution, duplicates, mirrors) --------------

if (registries) {
  const result = normalizeObservations(rows, registries)
  errors.push(...result.errors)
  if (result.errors.length === 0) {
    ok(`${result.observations.length} observations across ${csvFiles.length} file(s) validate cleanly`)
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} validation error(s):\n`)
  for (const e of errors) console.error(`  ✖ ${e}`)
  fail('data validation failed')
}

ok('registries and raw data are valid')
