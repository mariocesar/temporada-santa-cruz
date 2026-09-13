/**
 * `bun run data:normalize` — raw CSVs → data/normalized/observations.json.
 * Canonical values are stored BESIDE raw strings; raw is never destroyed.
 */

import path from 'node:path'
import { parseCsvRecords } from './lib/csv'
import { fail, listCsvFiles, ok, PATHS, readText, ROOT, writeJson } from './lib/io'
import { normalizeObservations, type LocatedRow } from './lib/pipeline'
import { loadRegistries } from './lib/registry'
import { RAW_CSV_COLUMNS, rawCsvRowSchema } from './schemas'

const registries = loadRegistries()
const rows: LocatedRow[] = []

for (const file of listCsvFiles(PATHS.raw)) {
  const rel = path.relative(ROOT, file)
  const { header, records } = parseCsvRecords(readText(file))
  if (header.join(',') !== RAW_CSV_COLUMNS.join(',')) {
    fail(`${rel}: unexpected CSV header — run \`bun run data:validate\` for details`)
  }
  records.forEach((record, i) => {
    const parsed = rawCsvRowSchema.safeParse(record)
    if (!parsed.success) {
      fail(`${rel}:${i + 2}: schema error — run \`bun run data:validate\` for details`)
    }
    rows.push({ row: parsed.data, location: `${rel}:${i + 2}` })
  })
}

const { observations, errors } = normalizeObservations(rows, registries)
if (errors.length > 0) {
  for (const e of errors) console.error(`  ✖ ${e}`)
  fail('normalization failed; fix the raw data or registries')
}

const out = path.join(PATHS.normalized, 'observations.json')
writeJson(out, observations)
ok(`${observations.length} normalized observations → ${path.relative(ROOT, out)}`)
