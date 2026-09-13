# Temporada Santa Cruz

**Cuándo comprar frutas y verduras en Santa Cruz — basado en oferta, precios,
procedencia y cosechas reales.**

A public, open-data web dashboard about produce seasonality in Santa Cruz de
la Sierra, Bolivia: what is in season now, when each product peaks, when it is
cheapest, where it comes from, and — always — how confident the data allows us
to be.

> **Status: Phases 0–3 complete, Phase 4 (polish) in progress.** The data
> pipeline and the dashboard run end to end on a clearly-marked synthetic seed
> dataset; importing real market reports is Phase 6. See
> [docs/PLAN.md](docs/PLAN.md) for the execution plan and
> [PROJECT.md](PROJECT.md) for the full specification.

## Build workflow

The project is built one phase per session. Every phase that produces data or
domain logic is closed by an adversarial multi-agent pass before the next one
starts — nothing enters `data/raw/` or the scoring path unverified.

```mermaid
flowchart TB
    P0["Phase 0 · Bootstrap<br/>Bun + Vite + Svelte 5 + TypeScript<br/>Pages CI · licensing · execution plan"]
    P1["Phase 1 · Domain model and data pipeline<br/>methodology constants · pure domain modules<br/>deterministic synthetic seed, always marked"]
    G1{{"Adversarial verification<br/>ISO week 53 · Dec→Jan wraparound<br/>single-year data · dedup · provenance"}}
    P2["Phase 2 · Reference seasons<br/>source-scout agents sweep the bibliography<br/>display-only phenology registry"]
    G2{{"Adversarial verification<br/>every citation → month window,<br/>re-checked against the primary text"}}
    P3["Phase 3 · Functional dashboard<br/>Ahora · annual timeline · detail panel<br/>URL state · methodology and sources"]
    G3{{"Multi-agent review<br/>14 confirmed findings fixed<br/>re-verified at 390/768/1280/1600 px"}}
    P4["Phase 4 · Polish — current<br/>design tokens · accessibility · docs"]
    P5["Phase 5 · Productionize and deploy"]
    P6["Phase 6 · First real-data milestone<br/>CAO/SIPREM · SIIP · INE reports<br/>real observations replace the seed"]

    P0 --> P1 --> G1 --> P2 --> G2 --> P3 --> G3 --> P4 --> P5 --> P6

    subgraph PIPE["Data workflow — three layers, never collapsed"]
      direction LR
      RAW[("data/raw<br/>observation CSV<br/>never overwritten")]
      NRM[("data/normalized<br/>canonical units, origins,<br/>deterministic IDs")]
      DRV[("data/generated<br/>weekly scores<br/>+ confidence")]
      PUB[("public/data<br/>versioned JSON")]
      RAW -->|"validate · normalize"| NRM -->|derive| DRV -->|build| PUB
    end

    P1 -.->|builds| PIPE
    P2 -.->|"display-only, never scored"| DRV
    PUB -.->|loaded by| P3

    classDef phase fill:#f7efe2,stroke:#9c6b2f,stroke-width:1px,color:#2a1f12
    classDef gate fill:#e7efe3,stroke:#4d7a3e,stroke-width:1px,color:#1d2a17
    classDef future fill:#f1f0ed,stroke:#9b9790,stroke-width:1px,color:#33312d,stroke-dasharray:4 3
    classDef store fill:#ecf0f3,stroke:#5b6b7d,stroke-width:1px,color:#1c242d
    class P0,P1,P2,P3,P4 phase
    class G1,G2,G3 gate
    class P5,P6 future
    class RAW,NRM,DRV,PUB store
```

Two invariants hold across the whole diagram: raw observations are never
destroyed or overwritten, and every derived value traces back to the
observations and source IDs behind it. Bibliographic reference seasons attach
at the derive step for display only — they never touch a score, a confidence
value, or a current-week claim.

## Stack

Bun · Vite · Svelte 5 (runes) · TypeScript · GitHub Pages

## Develop

```bash
bun install
bun run dev      # local dev server
bun run check    # svelte-check + tsc
bun run test     # Vitest
bun run data     # validate → normalize → derive → build into public/data/
bun run build    # production build to dist/
```

The Vite base path defaults to `/`. For GitHub Pages project deployments the
CI workflow sets `VITE_BASE_PATH="/temporada-santa-cruz/"`; a future custom
domain sets it back to `/`. See `vite.config.ts`.

## License

- Code: [MIT](LICENSE)
- Curated and derived datasets: [CC BY 4.0](LICENSE-DATA.md)
- Raw source material remains subject to its original publishers' terms.
