# Execution plan

This is the working plan for building Temporada Santa Cruz. The full product
specification lives in [PROJECT.md](../PROJECT.md); this document sequences it
into executable phases with exit criteria. Update it as phases complete.

**Status: Phase 1 complete; Phase 2 (functional dashboard) is next.**

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

## Phase 2 — Functional dashboard (§85)

1. Data loader consuming `public/data/*.json` with freshness metadata (§47).
2. Dashboard state module (`src/lib/stores/dashboard.svelte.ts`) + URL search
   param sync (§49, §74).
3. "Ahora" section: current-week classification (Pico / En temporada /
   Entrando / Saliendo), Mercado ↔ Producción cruceña toggle (§13, §40).
4. Search (names + aliases) and category filters (§14).
5. Annual timeline: SVG rendered by Svelte, months over ISO weeks, encoding
   for availability/season/peak + market vs local + confidence (§15–16).
6. Product detail panel: identity, summary, timeline, observations,
   origin, price behavior, evidence, confidence explanation (§17).
7. Methodology + sources sections (§18, §56–57).
8. Empty/error states (§78), month-explorer navigation (§75–76).

Exit: every §88 UI behavior works with the seed dataset on desktop and mobile
widths (390 / 768 / 1280 / 1600 px).

## Phase 3 — Polish (§86)

Typography and design system, spacing, responsive charts, accessibility pass
(WCAG AA, §11), reduced motion, touch equivalents for tooltips (§72–73),
README, CONTRIBUTING, `docs/METHODOLOGY.md`, `docs/DATA_SOURCES.md`,
`docs/DATA_CONTRIBUTION.md` (§62–63, §94).

**Visual direction input:** owner-provided design references live in
`docs/design-references/NOTES.md` — read them before beginning design-system
work, and ask the owner for any additional screenshots they want to add.
References refine, not override, the §9 direction (editorial, agricultural,
warm; not SaaS), and the §1 "not a clone" constraint stands.

## Phase 4 — Productionize and deploy (§87)

A minimal deploy workflow already exists from Phase 0. Complete it:

1. Add `bun run test` and `bun run data:validate` steps to
   `.github/workflows/deploy.yml` once those commands exist (§80).
2. PR validation workflow if not redundant (§81).
3. Verify deployed asset paths and reload behavior at
   `https://mariocesar.github.io/temporada-santa-cruz/`.

Exit: §88 definition of done, deployed.

## Phase 5 — First real-data milestone (§101)

Per the confirmed data-sourcing decision, research and fetch legitimately
accessible CAO/SIPREM, SIIP, and INE materials directly:

1. Map what exists: report dates, formats, mirrors, coverage per year.
2. Build a report inventory (which weeks have reports vs gaps — missing
   reports are NOT absence evidence, §30).
3. Import observations for the initial ten products (§101); document
   acquisition per source; manual CSV transcription is acceptable (§43).
4. Re-derive; replace demo records with real ones where covered.

Exit: honest coverage report; confidence labels reflect real evidence.

---

## Standing constraints

- Keep the repo in a working state after every significant milestone; logical
  commits per §83.
- `bun run check`, `bun run test`, `bun run build` must pass before each
  phase is called done.
- Never present synthetic data as observed; never conflate Disponible /
  En temporada / Temporada local.
