# Temporada Santa Cruz

Public open-data dashboard: produce seasonality for Santa Cruz de la Sierra,
Bolivia. Static Svelte 5 SPA deployed to GitHub Pages. UI text in Spanish
(Bolivian terminology); code, types, docs, and commits in English.

## Session start

1. Read `docs/PLAN.md` first — current phase, checkboxes, and exit criteria
   live there. Update it as you complete work.
2. `PROJECT.md` is the full specification. §103 records decisions already
   confirmed with the owner — do not re-ask them.
3. Ready-to-use session prompts are in `docs/PROMPTS.md`.

## Commands

- `bun run dev` · `bun run build` · `bun run preview`
- `bun run check` — svelte-check + tsc
- `bun run test` — Vitest (from Phase 1)
- `bun run data` — validate → normalize → derive → build into `public/data/`
  (from Phase 1)

`check`, `test`, and `build` must pass before any phase is called done. Keep
the repo in a working state after every significant milestone; commit in
logical units (PROJECT.md §83) and push when a phase completes.

## Multi-agent orchestration

Execution sessions should use Workflow/subagent orchestration where fan-out
genuinely pays. The kickoff prompts in `docs/PROMPTS.md` carry the explicit
opt-in the harness requires — keep that language when adapting them.

- **Fan out for:** source reconnaissance sweeps (per source/year), bulk
  report transcription (per report), adversarial verification of findings
  and extractions, accessibility/review audits (per dimension), domain-math
  edge-case verification.
- **Stay single-agent for:** integrative work — domain modeling, UI
  composition, design decisions. Parallel agents that must mutate files use
  worktree isolation.
- **Right-size models and effort** via the project agents in
  `.claude/agents/`: `data-transcriber` (haiku, low) for mechanical
  extraction; `source-scout` (sonnet, medium) for scoped recon;
  `verifier` (inherit, high) for adversarial checks. Inline `agent()` calls
  follow the same ladder: cheap/low for mechanical stages, inherit for
  default work, high effort only for verify/judge stages.
- **Nothing extracted enters `data/raw/` unverified:** every transcription
  batch gets a verifier pass before the pipeline consumes it.
- Scale orchestration to the phase, not the maximum: a handful of agents
  with one verify pass is the norm; deep fan-out is for Phase 5 data work.

## Hard constraints

- Stack is exactly Bun + Vite + Svelte 5 (runes) + TypeScript strict. No
  SvelteKit, React, routers, SSR, backends, databases, or auth.
- Never conflate the three core concepts: Disponible / En temporada /
  Temporada local.
- Three data layers: raw → normalized → derived. Raw values are never
  destroyed or overwritten; every derived value must trace back to
  observations and source IDs.
- Synthetic/demo data must be unmistakably marked and gated behind
  `ALLOW_DEMO_DATA`; it must never read as researched fact.
- A missing source report is NOT evidence a product was absent.
- Model weights, availability mappings, and thresholds live in one documented
  methodology-constants module — no magic numbers scattered in code.
- Confidence is independent from the seasonality score; prefer
  "Datos insuficientes" over invented certainty.
- Never hard-code asset URLs starting with `/`; use Vite asset handling or
  `import.meta.env.BASE_URL`. CI sets `VITE_BASE_PATH` (see `vite.config.ts`).
- ISO weeks internally (handle week 53); the calendar is cyclic —
  December and January are adjacent.
