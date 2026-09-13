# Temporada Santa Cruz

**Cuándo comprar frutas y verduras en Santa Cruz — basado en oferta, precios,
procedencia y cosechas reales.**

A public, open-data web dashboard about produce seasonality in Santa Cruz de
la Sierra, Bolivia: what is in season now, when each product peaks, when it is
cheapest, where it comes from, and — always — how confident the data allows us
to be.

> **Status: bootstrap.** The application shell exists; the data pipeline and
> dashboard are being built. See [docs/PLAN.md](docs/PLAN.md) for the
> execution plan and [PROJECT.md](PROJECT.md) for the full specification.

## Stack

Bun · Vite · Svelte 5 (runes) · TypeScript · GitHub Pages

## Develop

```bash
bun install
bun run dev      # local dev server
bun run check    # svelte-check + tsc
bun run build    # production build to dist/
```

The Vite base path defaults to `/`. For GitHub Pages project deployments the
CI workflow sets `VITE_BASE_PATH="/temporada-santa-cruz/"`; a future custom
domain sets it back to `/`. See `vite.config.ts`.

## License

- Code: [MIT](LICENSE)
- Curated and derived datasets: [CC BY 4.0](LICENSE-DATA.md)
- Raw source material remains subject to its original publishers' terms.
