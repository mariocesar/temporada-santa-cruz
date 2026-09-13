# Execution plan

This is the working plan for building Temporada Santa Cruz. The full product
specification lives in [PROJECT.md](../PROJECT.md); this document sequences it
into executable phases with exit criteria. Update it as phases complete.

**Status: Phases 0–3 and 5 complete (2026-09-13). Phase 4's brand/design-
system layer and the demo "delight" pass landed the same day (owner
directive: demo state first, then "focus on the visual story and look",
desktop first) — see the Phase 4 checklist; its deferred audit/docs work
(WCAG AA, touch tooltips, documentation set, Tier 1 illustrations) remains.
Phase 6 (first real data) is in progress: source recon underway.**

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

## Phase 3 — Functional dashboard (§85) ✅ (done 2026-09-13)

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

Reference-season integration (§104), landed 2026-09-13:

- [x] Timeline "estimada (referencia)" bucket — outlined/hatched band drawn
      from `referenceSeason.ranges` only (dashed outline + diagonal hatch in
      a neutral `--season-reference` channel; no solid fill; cyclic ranges
      split into two segments across the year edge). Conditional legend
      entry, row text equivalents, and tooltip line carry the "no proviene
      de observaciones de mercado" language.
- [x] Reference-season citation in the product detail panel: the badge/note
      block (both branches, via one snippet) now lists each cited source —
      linked name, publisher, and "consultada el …" access date — resolved
      from `referenceSeason.sourceIds`; estimate-only products get an honest
      "Sin observaciones de mercado registradas" sources section.
- [x] Estimate-only products: excluded from "Ahora" current-week claims
      (state stays `sin_datos`; no `SeasonState` extension), and the
      default "Nombre" sort partitions insufficient-evidence products after
      observed ones (an estimate never raises prominence — regression test
      added). The "Ahora" rest line counts them: "(≈ N con temporada
      estimada según bibliografía)".

Exit criteria met: every §88 UI behavior works with the seed dataset;
re-verified after the reference-season integration in a real browser at
390 / 768 / 1280 / 1600 px (hatched bands on mango — Nov→Jan wraparound —
and limón; palta stays estimate-free), plus a two-verifier adversarial pass
over the band geometry and the exclusion/sorting invariants.

## Phase 4 — Polish (§86) — brand/design-system layer done 2026-09-13

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

Done (demo-state directive, 2026-09-13):

- [x] Design tokens + editorial typography: Alegreya / Alegreya Sans
      (self-hosted via Fontsource), warm paper/ink palette, deep leaf-green
      display voice, place kicker, serif display headings.
- [x] Produce-derived per-product palette (`src/lib/ui/palette.ts`),
      validated (lightness band, chroma floor, ≥3:1 vs chart track;
      adjacency relieved by name-chip direct labels — documented).
- [x] Ridgeline timeline per NOTES: volume-shaped Catmull-Rom curves from
      the smoothed weekly scores with cyclic Dec→Jan continuation, filled
      curve = active concept, light silhouette = the other concept, tinted
      name chips, month gridlines + axis top and bottom, reworked legend.
      Honesty devices preserved: dashed no-data baseline, §104 hatch band,
      "Datos insuficientes" chips.
- [x] Cascade default sort "Inicio de temporada" (longest-range start
      week anchors; estimates never supply an anchor; insufficient last).
- [x] Ahora cards (hue selvage, serif names), detail panel (hue top bar,
      hue-tinted origin bars and price line), sections restyled.
- [x] Verified in a real browser at 390 / 768 / 1280 px (+1600 px layout
      unchanged from 1280), both modes; `check`, `test`, `build` green.

Demo "delight" pass (owner directive, 2026-09-13: MVP, visual story and
look, desktop first, glyphs not to be over-polished):

- [x] Illustration system, Tier 2 of the NOTES.md policy. Owner picked
      single-stroke **ink line art** (seed-catalogue engraving) over solid
      silhouettes and two-tone. 15 original glyphs on a shared 48×48 grid
      (`src/lib/ui/illustrations/glyphs.ts`), a `ProductGlyph.svelte` that
      keeps hairlines hairlines at any size, and
      `illustrations/registry.ts` carrying artist/year/licence/species per
      entry so any piece can be swapped by editing one line — and so Tier 1
      historical plates drop in later without a code change. Art credits
      surface in the sources section (policy §4). Iterated against a dev
      contact sheet (`scripts/dev/glyph-sheet.ts`) until the set read as a
      set: papaya and palta halved, limón a cut wheel, sandía a wedge.
- [x] Ridgelines read as volume, not slabs: headroom scales with the row
      (no more saturating at the ceiling), a vertical gradient makes the
      fill dense at the baseline and airy at the crest, and runs that end
      at a data gap return to the baseline on a short ramp instead of a
      vertical cliff — a cliff read as "the season dropped to zero that
      week", a claim the data never made. Runs of one or two weeks now draw
      as a stem and a dot: an isolated observation is a point, not a
      plateau.
- [x] Motion: curves rise out of the baseline staggered down the cascade
      and replay when the Mercado ↔ Producción toggle swaps concepts; Ahora
      cards stagger in; the detail panel slides. Every resting state IS the
      finished state, honesty devices never animate, and reduced motion
      zeroes delay as well as duration.
- [x] Poster/full-screen mode for the annual timeline ("Ver como lámina"),
      per the owner's reference: the whole year on one page, rows sized to
      the viewport so all 15 products fit, Escape to exit. Encoding
      untouched.
- [x] Almanac masthead: kicker, serif display title, and botanical
      marginalia that are the products at their peak in the reference week
      — the cover art turns over with the year, restating "Ahora" rather
      than adding a claim.
- [x] Desktop presentation pass: "Pico de temporada" as a feature row, the
      three core concepts as cards rather than fine print.

Remaining for Phase 4 exit (deferred by owner directive — demo first):
full WCAG AA audit (multi-agent, per dimension), touch-tooltip review,
a mobile presentation pass, README/CONTRIBUTING/METHODOLOGY/DATA_SOURCES/
DATA_CONTRIBUTION docs, and Tier 1 public-domain illustration sourcing for
owner picks. The owner still owes the reference screenshot drop
(`sf-farmers-market-seasons.png`).

## Phase 5 — Productionize and deploy (§87) ✅ (done 2026-09-13)

A minimal deploy workflow already existed from Phase 0. Completed:

- [x] `bun run test` and `bun run data:validate` steps added to
      `.github/workflows/deploy.yml` (§80).
- [x] PR validation folded into the same workflow (§81 "avoid duplication"):
      `pull_request` trigger runs the full ladder, skips Pages artifact +
      deploy, and gets its own cancellable concurrency group; deploys to
      main stay serialized and uncancellable.
- [x] Verified live after a green run: asset paths under
      `/temporada-santa-cruz/`, `data/index.json` 200, deep-link
      (`?producto=…`) reload 200 at
      `https://mariocesar.github.io/temporada-santa-cruz/`.

Exit criteria: CI + deployment portion of §88 met. The remaining §88 items
(README/docs set, WCAG audit) live in the deferred Phase 4 checklist; the
dataset is still the marked demo seed until Phase 6 lands.

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
