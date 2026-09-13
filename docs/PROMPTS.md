# Session kickoff prompts

Copy-paste prompts for starting execution sessions. CLAUDE.md auto-loads and
points the session at `docs/PLAN.md` and `PROJECT.md`, so these stay short.

## Orchestration notes

- The Workflow tool only activates on **explicit opt-in in the prompt**.
  These prompts already include the phrase "use multi-agent workflows" where
  fan-out pays — keep it when editing them. Alternatives: include the keyword
  `ultracode` for maximum orchestration on every substantive task, or add a
  token budget directive like `+300k` to scale workflow depth.
- Project subagents with tuned model/effort live in `.claude/agents/`:
  `data-transcriber` (haiku/low), `source-scout` (sonnet/medium),
  `verifier` (inherit/high). The orchestration policy is in CLAUDE.md.
- Default workflow size guideline is medium (<15 agents per workflow);
  change it via "Dynamic workflow size" in `/config` if a session needs more.

## Generic (recommended default)

> Continue the Temporada Santa Cruz project. Read docs/PLAN.md, identify the
> first incomplete phase, and execute it fully to its exit criteria. Work
> autonomously (PROJECT.md §100): make logical commits, keep `bun run check`,
> `bun run test`, and `bun run build` green, update the PLAN.md checkboxes,
> and push when done. Use multi-agent workflows and the project subagents in
> .claude/agents/ where fan-out genuinely pays (verification, audits,
> per-item sweeps), per the orchestration policy in CLAUDE.md. Finish with a
> report: what changed, current real/demo data status, and the next
> highest-value task.

## Phase 1 — Domain model and data pipeline

> Continue Temporada Santa Cruz: execute Phase 1 of docs/PLAN.md (domain
> model and data pipeline). Prove the full flow — raw observation →
> normalized → weekly aggregation → season score → confidence → public JSON →
> loadable by the Svelte app — end to end with the marked demo seed dataset.
> Pure domain modules must be tested (ISO weeks incl. 53, cyclic smoothing,
> presence, relative price, local share, scores, confidence, classification,
> circular ranges). All weights/thresholds go in the methodology-constants
> module. After implementing, run a multi-agent verification workflow using
> the `verifier` subagent over the domain modules' adversarial edge cases
> (week 53, Dec→Jan wraparound, single-year data, incompatible units, empty
> inputs) and fix what it refutes. Commit logically, keep checks green,
> update PLAN.md, push.

## Phase 2 — Functional dashboard

> Continue Temporada Santa Cruz: execute Phase 2 of docs/PLAN.md (functional
> dashboard). Build "Ahora" with the Mercado/Producción cruceña toggle,
> search and category filters, the annual SVG timeline (Svelte-rendered,
> encoding season + local + confidence), the product detail panel with
> evidence and provenance, methodology/sources sections, and URL-param state.
> Functionality before polish; verify at 390/768/1280/1600 px. Close with a
> multi-agent review workflow (correctness + the market/local distinction +
> URL-state behavior), verifying findings with the `verifier` subagent before
> fixing them. Commit logically, keep checks green, update PLAN.md, push.

## Phase 3 — Polish

> Continue Temporada Santa Cruz: execute Phase 3 of docs/PLAN.md (polish).
> Before any design work, read docs/design-references/NOTES.md (owner-vetted
> references: ridgeline month layout, produce-derived palette, botanical
> illustration language) and ask me for any additional screenshots; derive
> the design system from those notes within the PROJECT.md §9 direction
> (editorial, agricultural, warm — not SaaS, not a clone). Then: typography
> and design system, full WCAG AA pass, reduced motion, touch-friendly
> tooltip equivalents, empty states, and complete the documentation set:
> README, CONTRIBUTING, docs/METHODOLOGY.md, docs/DATA_SOURCES.md,
> docs/DATA_CONTRIBUTION.md. Run the audit as a multi-agent workflow — one
> agent per dimension (keyboard, contrast, screen-reader/chart summaries,
> reduced motion, touch targets, each breakpoint) — then verify and fix
> confirmed findings. Commit logically, keep checks green, update PLAN.md,
> push.

## Phase 4 — Productionize and deploy

> Continue Temporada Santa Cruz: execute Phase 4 of docs/PLAN.md. Create the
> GitHub Pages deploy workflow (Bun, frozen lockfile, check + test + data
> validation + build, official Pages actions, VITE_BASE_PATH derived from the
> repo name), configure Pages via gh (source: GitHub Actions), deploy, and
> verify asset paths and reload behavior at the live URL. Meet the full §88
> definition of done. Update PLAN.md, push.

## Phase 5 — First real-data milestone

> Continue Temporada Santa Cruz: execute Phase 5 of docs/PLAN.md. Research
> and fetch legitimately accessible CAO/SIPREM, SIIP, and INE materials
> (authorized in PROJECT.md §103). Orchestrate this with multi-agent
> workflows: fan out `source-scout` per source/year for the inventory sweep,
> then `data-transcriber` per report for extraction, then `verifier` per
> batch before anything enters data/raw — nothing unverified reaches the
> pipeline. Inventory which report dates/years exist per source, document
> gaps honestly (missing reports ≠ absence), import observations for the ten
> §101 priority products with full provenance, then re-derive and replace
> demo records where real coverage exists. Finish with an honest coverage
> report per product.

## Utility

> Review the current state of Temporada Santa Cruz against docs/PLAN.md and
> PROJECT.md §88 (definition of done). Report gaps, broken checks, and the
> single highest-value next task. Do not build anything yet.
