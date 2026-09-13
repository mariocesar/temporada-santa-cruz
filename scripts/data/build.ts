/**
 * `bun run data:build` — assemble the compact application-ready dataset in
 * public/data/ from the generated layer.
 *
 * DEMO-DATA GUARD (§79): if any published record is synthetic, the build
 * fails unless ALLOW_DEMO_DATA=true acknowledges a demo deployment. The
 * published index also carries containsDemoData so the UI can show the
 * DATOS DE DEMOSTRACIÓN banner.
 */

import fs from 'node:fs'
import path from 'node:path'
import type {
  DataSource,
  DatasetIndex,
  MarketObservation,
  ProductSeasonSummary,
  WeeklySeasonality,
} from '../../src/lib/data/types'
import { fail, ok, PATHS, readJson, ROOT, writeJson } from './lib/io'
import { loadRegistries } from './lib/registry'

for (const [file, hint] of [
  [path.join(PATHS.normalized, 'observations.json'), 'data:normalize'],
  [path.join(PATHS.generated, 'seasonality.json'), 'data:derive'],
  [path.join(PATHS.generated, 'summaries.json'), 'data:derive'],
] as const) {
  if (!fs.existsSync(file)) {
    fail(`missing ${path.relative(ROOT, file)} — run \`bun run ${hint}\` first`)
  }
}

const registries = loadRegistries()
const observations = readJson<MarketObservation[]>(path.join(PATHS.normalized, 'observations.json'))
const seasonality = readJson<WeeklySeasonality[]>(path.join(PATHS.generated, 'seasonality.json'))
const summaries = readJson<ProductSeasonSummary[]>(path.join(PATHS.generated, 'summaries.json'))

const containsDemoData = observations.some((o) => o.synthetic)
const allDataSynthetic = observations.length > 0 && observations.every((o) => o.synthetic)
const containsEstimatedSeasons = summaries.some((s) => s.referenceSeason !== undefined)

if (containsDemoData && process.env.ALLOW_DEMO_DATA !== 'true') {
  fail(
    'The dataset contains SYNTHETIC demo records. Refusing to build public data.\n' +
      '  Set ALLOW_DEMO_DATA=true to acknowledge a demo build (the UI will show\n' +
      '  the DATOS DE DEMOSTRACIÓN banner). Real deployments must not need it.',
  )
}

// Sources: publish the registry, EXCEPT synthetic sources that no published
// observation references — a retired demo source (§45) must not keep a card
// in the public dataset. Real sources stay listed even without observations
// (SIIP/INE document the model's context and open leads, §56–57).
const referencedSourceIds = new Set<string>(
  observations.flatMap((o) => [o.sourceId, o.originalSourceId]),
)
const sources: DataSource[] = registries.sources.filter(
  (s) => !s.synthetic || referencedSourceIds.has(s.id),
)

const dates = observations.map((o) => o.observedAt).sort()
const index: DatasetIndex = {
  dataUpdatedAt: dates.length > 0 ? dates[dates.length - 1]! : null,
  productCount: registries.products.length,
  observationCount: observations.length,
  sourceCount: new Set(observations.map((o) => o.originalSourceId)).size,
  containsDemoData,
  allDataSynthetic,
  containsEstimatedSeasons,
  files: {
    products: 'products.json',
    seasonality: 'seasonality.json',
    summaries: 'summaries.json',
    sources: 'sources.json',
  },
  // v2: sourceType taxonomy, optional referenceSeason on summaries, and
  // containsEstimatedSeasons on this index (§104).
  // v3: allDataSynthetic distinguishes the all-demo dataset from the mixed
  // real+demo state so the UI can scope its synthetic marking.
  schemaVersion: 3,
}

writeJson(path.join(PATHS.publicData, 'products.json'), registries.products)
writeJson(path.join(PATHS.publicData, 'seasonality.json'), seasonality)
writeJson(path.join(PATHS.publicData, 'summaries.json'), summaries)
writeJson(path.join(PATHS.publicData, 'sources.json'), sources)
writeJson(path.join(PATHS.publicData, 'index.json'), index)

ok(`public dataset → public/data/ (${index.observationCount} observations, updated ${index.dataUpdatedAt})`)
if (containsDemoData) {
  ok('ALLOW_DEMO_DATA=true acknowledged — dataset is marked containsDemoData')
}
