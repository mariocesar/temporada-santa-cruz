# Importers

Importer contract (PROJECT.md §42–43): each importer converts ONE source's
material (PDF extraction, HTML table, downloaded spreadsheet…) into the
common raw CSV format consumed by the pipeline:

```
observed_at,source_id,report_id,market,product_raw,origin_raw,variety_raw,quality,availability,wholesale_price,wholesale_unit,retail_price,retail_unit
```

Rules:

- **Raw strings verbatim.** `product_raw`, `origin_raw`, `variety_raw` and
  the unit cells are transcribed exactly as printed. Normalization happens
  later, against the registries in `data/metadata/`.
- **`report_id`** identifies the source document (e.g. `cao-2024-w15`). It
  feeds deterministic observation IDs, deduplication, and the report
  coverage index — a missing report is never treated as product absence.
- **`source_id`** must exist in `data/metadata/sources.json`. Mirrors get
  their own `mirror` entry pointing at the original via `mirrorOf`; the
  pipeline collapses mirrored rows automatically.
- Output lands under `data/raw/<source>/` and must pass
  `bun run data:validate`.
- PDF extraction is offline work. Manual transcription to CSV is a fully
  supported path (§43); document the acquisition per report in the source
  registry notes.

Planned importers (Phase 5): `cao.ts`, `siip.ts`, `ine.ts`.

The only current "importer" is the demo seed generator
(`scripts/data/seed/generate-demo.ts`), which emits SYNTHETIC data under
`data/raw/demo/` from sources flagged `synthetic: true`.
