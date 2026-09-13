<script lang="ts">
  // Phase 1 shell: proves the pipeline's generated JSON loads in the app
  // (raw → normalized → derived → public JSON → UI). The functional
  // dashboard is Phase 2 (docs/PLAN.md).
  import { loadDataset, type Dataset } from './lib/data/loader'

  const CONFIDENCE_TEXT: Record<string, string> = {
    muy_baja: 'Confianza muy baja',
    baja: 'Confianza baja',
    media: 'Confianza media',
    alta: 'Confianza alta',
  }

  let dataset = $state<Dataset | null>(null)
  let error = $state<string | null>(null)

  $effect(() => {
    loadDataset()
      .then((d) => {
        dataset = d
      })
      .catch((e: unknown) => {
        error = e instanceof Error ? e.message : String(e)
      })
  })

  const dataUpdatedAt = $derived(
    dataset?.index.dataUpdatedAt
      ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'long', timeZone: 'UTC' }).format(
          new Date(`${dataset.index.dataUpdatedAt}T00:00:00Z`),
        )
      : null,
  )
</script>

<main>
  {#if dataset?.index.containsDemoData}
    <p class="demo-banner" role="status">
      DATOS DE DEMOSTRACIÓN — los valores mostrados son sintéticos y no
      describen ningún mercado real.
    </p>
  {/if}

  <header>
    <h1>Temporada Santa Cruz</h1>
    <p class="subtitle">
      Cuándo comprar frutas y verduras en Santa Cruz — basado en oferta,
      precios, procedencia y cosechas reales.
    </p>
  </header>

  {#if error}
    <p class="status error">No se pudieron cargar los datos: {error}</p>
  {:else if !dataset}
    <p class="status">Cargando datos…</p>
  {:else}
    <section aria-label="Estado del conjunto de datos">
      <p class="status">
        {dataset.products.length} productos ·
        {dataset.index.observationCount} observaciones ·
        {#if dataUpdatedAt}datos actualizados hasta {dataUpdatedAt}{/if}
      </p>
      <ul class="products">
        {#each dataset.summaries as summary (summary.productId)}
          {@const product = dataset.products.find((p) => p.id === summary.productId)}
          <li>
            <span class="name">{product?.nameEs ?? summary.productId}</span>
            {#if summary.insufficientEvidence}
              <span class="badge insufficient">Datos insuficientes</span>
            {:else}
              <span class="badge">{CONFIDENCE_TEXT[summary.confidenceLabel]}</span>
            {/if}
          </li>
        {/each}
      </ul>
      <p class="status">El panel interactivo llega en la siguiente fase.</p>
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 42rem;
    margin: 0 auto;
    padding: var(--space-8) var(--space-4);
  }

  h1 {
    font-size: 2rem;
    line-height: 1.2;
    margin: 0 0 var(--space-2);
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 1.125rem;
    margin: 0;
  }

  .status {
    margin-top: var(--space-6);
    color: var(--color-text-muted);
  }

  .error {
    color: #8a2d1f;
  }

  .demo-banner {
    background: #fdeeca;
    border: 1px solid #e5c574;
    color: #6b4d05;
    font-weight: 600;
    font-size: 0.875rem;
    letter-spacing: 0.02em;
    padding: var(--space-2) var(--space-3);
    border-radius: 0.375rem;
    margin: 0 0 var(--space-6);
  }

  .products {
    list-style: none;
    margin: var(--space-4) 0 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }

  .products li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    padding: var(--space-2) var(--space-3);
  }

  .name {
    font-weight: 600;
  }

  .badge {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }

  .badge.insufficient {
    color: #8a2d1f;
    font-weight: 600;
  }
</style>
