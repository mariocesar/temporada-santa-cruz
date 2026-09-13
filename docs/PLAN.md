# Execution plan

This is the working plan for building Temporada Santa Cruz. The full product
specification lives in [PROJECT.md](../PROJECT.md); this document sequences it
into executable phases with exit criteria. Update it as phases complete.

**Status: Phases 0–2 complete; Phase 3 (functional dashboard) core built
2026-09-13 — its reference-season integration points (timeline hatched
band, detail-panel citation, "Ahora" exclusion/sorting) are now unblocked
and are the next task.**

Note: the dashboard was built by a session already in flight when the
2026-09-13 renumbering inserted Phase 2; its checkboxes below reflect that.

Confirmed decisions (2026-09-13) are recorded in PROJECT.md §103.

---

## Phase 0 — Initialization ✅ (done)

- [x] Git repository, public GitHub repo `mariocesar/temporada-santa-cruz`
- [x] Vite + Svelte 5 + TypeScript scaffold running under Bun
- [x] Base-path-aware `vite.config.ts` (`VITE_BASE_PATH`)
- [x] Spanish HTML shell with SEO metadata, original favicon
- [x] MIT (code) + CC BY 4.0 (curated data) licensing
- [x] Minimal Pages deploy workflow (install → check → build → deploy on push
      to main); Pages configured with source "GitHub Actions" via `gh`
- [x] This plan

## Phase 1 — Domain model and data pipeline (PROJECT.md §84) ✅ (done)

Goal: prove `raw observation → normalized → weekly aggregation → season score
→ confidence → public JSON → Svelte UI` end-to-end with a tiny dataset.

- [x] Testing/validation toolchain: Vitest, Zod. Wire `bun run test`.
- [x] Domain types (`src/lib/data/types.ts` + shared with scripts):
      `Product`, `Origin`, `MarketObservation`, `MarketUnit`, `DataSource`,
      `WeeklySeasonality`, `ProductSeasonSummary`, cyclic `SeasonRange`.
- [x] Methodology constants module (`src/lib/domain/methodology.ts`):
      weights, availability mapping, season-classification thresholds,
      evidence thresholds (§29, §33, §36, §39).
- [x] Pure domain modules with tests (§60): ISO weeks (incl. week 53, folded
      to bin 52), cyclic smoothing, presence probability, relative price
      index, availability score, local share, market/local season scores,
      confidence, season classification, entering/leaving trend, circular
      week ranges.
- [x] Pipeline under `scripts/data/` (validate / normalize / derive / build,
      pure core in `lib/pipeline.ts`, importer contract documented), CSV
      intermediate format (§64 + `report_id`), deterministic observation IDs
      (§65), mirror-aware dedup (§66–67).
- [x] Source registry (`data/metadata/sources.json`) with CAO/SIPREM, SIIP,
      INE entries plus clearly-marked synthetic demo sources; product/origin/
      unit registries.
- [x] Deterministic demo seed generator (`bun run seed:demo`) for the §45
      products, every record `synthetic`; `ALLOW_DEMO_DATA` guards both
      `data:build` and `vite build` (§79).
- [x] `bun run data:validate | data:normalize | data:derive | data:build`
      and combined `bun run data`; outputs land in `public/data/`.
- [x] End-to-end proof: app shell loads the published JSON (demo banner,
      freshness from `dataUpdatedAt`, per-product confidence, uva gated as
      "Datos insuficientes"); verified in a real browser.
- [x] Multi-agent adversarial verification pass (verifier subagents) over
      week 53, Dec→Jan wraparound, single-year data, incompatible units,
      empty inputs, dedup/provenance.

Exit criteria met: all data commands run, tests pass, generated JSON is
loadable from the app, demo records are impossible to mistake for facts
(synthetic flags, DEMO source names, banner, and double build guard).

## Phase 2 — Reference seasons from phenology bibliography (§104) ✅ (done 2026-09-13)

Goal: products without market observations (palta, mango, …) show a
clearly-marked, display-only estimated season traced to cited literature;
nothing enters the observed scoring path. Design and owner decisions are
recorded in PROJECT.md §103–§104.

- [x] `sourceType` taxonomy (`market | census | literature`) on
      `sourceSchema` (`scripts/data/schemas.ts`) and `DataSource`
      (`src/lib/data/types.ts`); all five existing `sources.json` entries
      retro-typed (INE → `census`, formalizing its "prior only" prose
      flag); validation rule: literature sources require `url` and
      `accessedAt`.
- [x] `MONTH_WEEK_SPANS` month→week-bin table in `methodology.ts`; new pure
      module `src/lib/domain/referenceSeason.ts`: windows → cyclic mask →
      canonical merged ranges reusing `rangesFromMask` (incl. Oct–Feb
      wraparound and the 12-month-wrap → full-year collapse), basis derived
      from cited source types (throws on `market`), approximate Spanish
      formatting ("aprox. nov – ene", "todo el año (estimado)").
- [x] Curated registry `data/metadata/phenology.json` (productId, cyclic
      month/week windows, sourceIds, note, citation) with a strict zod
      schema, loaded via `loadRegistries()`; `phenologyErrors()`
      cross-check wired into `validate.ts` (unknown product/source,
      market-typed or synthetic sources rejected, duplicates).
- [x] Derive publishes an optional display-only `referenceSeason`
      (ranges + basis + sourceIds + note) on `ProductSeasonSummary` — no
      per-week scores, no smoothing, no `assertDerived` changes;
      `summary.sourceIds` stays observation-only. `build.ts` adds
      `containsEstimatedSeasons` to the index and bumps `schemaVersion`
      to 2.
- [x] Research via multi-agent workflow (7 `source-scout` + `verifier`
      pass per citation). Honest outcome: `products.json` gained palta
      (alias "aguacate"), mango, and limón; phenology entries ONLY for the
      two products with verifier-confirmed citable literature — mango
      (nov–ene, "Las Frutas en Bolivia", Editorial Riquezas 2011, ISBN
      978-99974-880-5-3) and limón (ene–abr, IBCE "Perfil de Mercado —
      Limón" 2010, §5.5). Palta stays estimate-free (only a trade-blog
      source surfaced — below the §103 literature bar); maracuyá,
      chirimoya, coco and cayú found no citable agronomy month data and
      were not added. Leads for future sessions: OAP/MDRyT "Serie
      Agrícola" interactive viewers and a Scribd "Calendario Agrícola
      Santa Cruz — Zona Valles" document (both access-restricted to
      simple fetching).
- [x] Shell proof (landed in the Phase-3 dashboard, which superseded the
      minimal App.svelte shell): "≈ Temporada estimada (bibliografía):
      aprox. nov – ene" badge in the product detail panel alongside —
      never replacing — "Datos insuficientes", with the §104 accessible
      description and per-entry note; footer dataset footnote when
      `containsEstimatedSeasons`. Verified in a real browser at 390 px
      and desktop widths (mango, limón, and palta-without-badge).
- [x] Tests (29 new): month-span invariants, wraparound + week-53
      non-authorability, range merging, formatting, `phenologyErrors`,
      schema rules, derive integration, and the anti-conflation regression
      (derive with vs without a phenology entry is deep-equal except
      `referenceSeason`).
- [x] Multi-agent verification pass: workflow `verifier` agents over every
      scout citation→window transcription, then a second `verifier` pass
      over the final curated repo entries (both CONFIRMED: verbatim
      quotes, retrievable URLs via HTTP 200, conservative windows,
      wraparound projection 11→1 ⇒ weeks 44→5).

Exit criteria met: estimate-only products render the estimated badge plus
"Datos insuficientes"; observed outputs are identical except the new
fields; every window traces to a real, dated, retrievable citation;
`check`, `test`, and `data` are green.

## Phase 3 — Functional dashboard (§85) — core built 2026-09-13

- [x] Data loader consuming `public/data/*.json` (products, summaries,
      seasonality, sources) with freshness metadata (§47).
- [x] Dashboard state module (`src/lib/stores/dashboard.svelte.ts`) + URL
      search param sync with validated codec (§49, §74): product, mode,
      category, q, week (53 folds to 52); debounced/guarded replaceState.
- [x] "Ahora" section: current-week classification (Pico / En temporada /
      Entrando / Saliendo), Mercado ↔ Producción cruceña toggle (§13, §40).
- [x] Search (names + aliases + varieties, accent-folded) and category
      filters (§14), sorting (§77).
- [x] Annual timeline: Svelte-rendered SVG, months over ISO weeks; intensity
      encodes season class, hue encodes the active concept, underline stripe
      shows the other concept, dashed marks for no-evidence weeks, per-row
      text equivalents, tooltips (§15–16, §73).
- [x] Product detail panel: identity, honest summary, dual strips,
      observations, origin shares (pipeline-aggregated `localShareOfKnown`),
      §54 price behavior, evidence signals, confidence explanation,
      provenance with synthetic tags (§17–18).
- [x] Methodology + sources sections (§18, §56–57), fed by the
      methodology-constants module.
- [x] Empty/error states (§78), month-explorer navigation (§75–76).
- [x] Verified at 390 / 768 / 1280 / 1600 px in a real browser; closing
      multi-agent review workflow (correctness + market/local distinction +
      URL state; 14 verifier-confirmed findings fixed).

Pending — unblocked now that Phase 2 is done (reference seasons, §104):

- [ ] Timeline "estimada (referencia)" bucket — outlined/hatched band
      (texture channel, never a sixth solid fill).
- [ ] Reference-season citation in the product detail panel.
- [ ] Estimate-only products: excluded from "Ahora" current-week claims
      (state stays `sin_datos`; no `SeasonState` extension), default-sorted
      after observed products.

Exit: every §88 UI behavior works with the seed dataset on desktop and mobile
widths (390 / 768 / 1280 / 1600 px) — met for the core; re-verify after the
reference-season integration lands.

## Phase 4 — Polish (§86)

Typography and design system, spacing, responsive charts, accessibility pass
(WCAG AA, §11), reduced motion, touch equivalents for tooltips (§72–73),
README, CONTRIBUTING, `docs/METHODOLOGY.md`, `docs/DATA_SOURCES.md`,
`docs/DATA_CONTRIBUTION.md` (§62–63, §94). `docs/METHODOLOGY.md` must also
explain "Temporada estimada según bibliografía" in plain Spanish: what it
is, why it is not evidence, and how market observations supersede it (§104).

**Visual direction input:** owner-provided design references live in
`docs/design-references/NOTES.md` — read them before beginning design-system
work, and ask the owner for any additional screenshots they want to add.
References refine, not override, the §9 direction (editorial, agricultural,
warm; not SaaS), and the §1 "not a clone" constraint stands.

## Phase 5 — Productionize and deploy (§87)

A minimal deploy workflow already exists from Phase 0. Complete it:

1. Add `bun run test` and `bun run data:validate` steps to
   `.github/workflows/deploy.yml` once those commands exist (§80).
2. PR validation workflow if not redundant (§81).
3. Verify deployed asset paths and reload behavior at
   `https://mariocesar.github.io/temporada-santa-cruz/`.

Exit: §88 definition of done, deployed.

## Phase 6 — First real-data milestone (§101)

Per the confirmed data-sourcing decision, research and fetch legitimately
accessible CAO/SIPREM, SIIP, and INE materials directly:

1. Map what exists: report dates, formats, mirrors, coverage per year.
2. Build a report inventory (which weeks have reports vs gaps — missing
   reports are NOT absence evidence, §30).
3. Import observations for the initial ten products (§101); document
   acquisition per source; manual CSV transcription is acceptable (§43).
4. Re-derive; replace demo records with real ones where covered.
5. Granular synthetic marking once real and demo records coexist
   (2026-09-13 review finding): conditional banner copy ("algunos valores
   son sintéticos…") driven by a build-emitted flag, plus per-product
   SINTÉTICA markers on Ahora cards and timeline rows (the detail panel
   already has one).

Exit: honest coverage report; confidence labels reflect real evidence.

---

## Standing constraints

- Keep the repo in a working state after every significant milestone; logical
  commits per §83.
- `bun run check`, `bun run test`, `bun run build` must pass before each
  phase is called done.
- Never present synthetic data as observed; never conflate Disponible /
  En temporada / Temporada local.
