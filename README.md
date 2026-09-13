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
%%{init: {"flowchart": {"wrappingWidth": 340, "nodeSpacing": 28, "rankSpacing": 34}} }%%
flowchart TB
    P0["<b>Phase 0 · Bootstrap</b><br/>Bun · Vite · Svelte 5 · TypeScript · Pages CI"]
    P1["<b>Phase 1 · Domain model and data pipeline</b><br/>methodology constants · pure domain modules · marked synthetic seed"]
    G1{{"<b>adversarial verification</b> · ISO week 53 · Dec→Jan wraparound · dedup · provenance"}}
    P2["<b>Phase 2 · Reference seasons</b><br/>source-scout sweep → cited phenology registry, display-only"]
    G2{{"<b>adversarial verification</b> · every citation re-read against the primary text"}}
    P3["<b>Phase 3 · Functional dashboard</b><br/>Ahora · annual timeline<br/>detail panel · URL state · sources"]
    G3{{"<b>multi-agent review</b> · 14 confirmed findings fixed · re-checked 390 → 1600 px"}}
    P4["<b>Phase 4 · Polish — current</b><br/>design system · accessibility · documentation"]
    P5["Phase 5 · Productionize and deploy"]
    P6["Phase 6 · First real data<br/>CAO/SIPREM · SIIP · INE"]

    P0 --> P1 --> G1 --> P2 --> G2 --> P3 --> G3 --> P4 --> P5 --> P6

    subgraph PIPE["Data workflow — three layers, never collapsed"]
      direction TB
      RAW[("data/raw · observation CSV, never overwritten")]
      NRM[("data/normalized · canonical units, origins, IDs")]
      DRV[("data/generated · weekly scores + confidence")]
      PUB[("public/data · versioned JSON")]
      RAW -->|"validate · normalize"| NRM -->|derive| DRV -->|build| PUB
    end

    P2 -.->|"display-only, never scored"| DRV
    PUB -.->|"loaded by"| P3

    classDef phase fill:#f7efe2,stroke:#9c6b2f,stroke-width:1px,color:#2a1f12
    classDef gate fill:#e7efe3,stroke:#4d7a3e,stroke-width:1px,color:#1d2a17
    classDef future fill:#f1f0ed,stroke:#9b9790,stroke-width:1px,color:#33312d,stroke-dasharray:4 3
    classDef store fill:#ecf0f3,stroke:#5b6b7d,stroke-width:1px,color:#1c242d
    class P0,P1,P2,P3,P4 phase
    class G1,G2,G3 gate
    class P5,P6 future
    class RAW,NRM,DRV,PUB store
    style PIPE fill:#f8fafb,stroke:#c6d0d9,color:#56626d
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
