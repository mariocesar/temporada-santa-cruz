/**
 * `bun run data:derive` — normalized observations → derived weekly
 * seasonality and product summaries (data/generated/).
 */

import path from 'node:path'
import type { MarketObservation } from '../../src/lib/data/types'
import { fail, ok, PATHS, readJson, ROOT, writeJson } from './lib/io'
import { deriveDataset } from './lib/pipeline'
import { loadRegistries } from './lib/registry'
import fs from 'node:fs'

const normalizedFile = path.join(PATHS.normalized, 'observations.json')
if (!fs.existsSync(normalizedFile)) {
  fail(`missing ${path.relative(ROOT, normalizedFile)} — run \`bun run data:normalize\` first`)
}

const registries = loadRegistries()
const observations = readJson<MarketObservation[]>(normalizedFile)

const { seasonality, summaries } = deriveDataset(observations, registries)

writeJson(path.join(PATHS.generated, 'seasonality.json'), seasonality)
writeJson(path.join(PATHS.generated, 'summaries.json'), summaries)

const insufficient = summaries.filter((s) => s.insufficientEvidence).map((s) => s.productId)
ok(`${seasonality.length} weekly rows, ${summaries.length} product summaries → data/generated/`)
if (insufficient.length > 0) {
  ok(`insufficient evidence (published as "Datos insuficientes"): ${insufficient.join(', ')}`)
}
