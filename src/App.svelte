<script lang="ts">
  import { loadDataset, type Dataset } from './lib/data/loader'
  import { buildProductViews, stateAt, type ProductView } from './lib/data/views'
  import { MONTH_NAMES_ES, monthOfWeekBin } from './lib/domain/months'
  import { DashboardState, todayWeekBin } from './lib/stores/dashboard.svelte'
  import { parseParams } from './lib/stores/urlState'
  import AhoraSection from './lib/components/dashboard/AhoraSection.svelte'
  import DemoBanner from './lib/components/dashboard/DemoBanner.svelte'
  import ExplorerSection from './lib/components/dashboard/ExplorerSection.svelte'
  import SiteHeader from './lib/components/dashboard/SiteHeader.svelte'
  import MethodologySection from './lib/components/methodology/MethodologySection.svelte'
  import SourcesSection from './lib/components/methodology/SourcesSection.svelte'
  import ProductDetail from './lib/components/products/ProductDetail.svelte'

  let dataset = $state<Dataset | null>(null)
  let views = $state<ProductView[]>([])
  let dash = $state<DashboardState | null>(null)
  let error = $state<string | null>(null)

  let slugs: ReadonlySet<string> = new Set()

  $effect(() => {
    loadDataset()
      .then((loaded) => {
        const built = buildProductViews(loaded.products, loaded.summaries, loaded.seasonality)
        slugs = new Set(built.map((v) => v.product.slug))
        dataset = loaded
        views = built
        dash = new DashboardState(location.search, slugs, todayWeekBin())
      })
      .catch((e: unknown) => {
        error = e instanceof Error ? e.message : String(e)
      })
  })

  // Shareable state ↔ URL (§74). replaceState keeps the history clean; a
  // reload or shared link restores the exact dashboard state. The write is
  // trailing-debounced (typing in search would otherwise hit Safari's
  // history-API rate limit, which THROWS) and guarded: app state must never
  // depend on the URL write succeeding.
  const URL_SYNC_DEBOUNCE_MS = 250
  $effect(() => {
    if (!dash) return
    const search = dash.searchString
    const timer = setTimeout(() => {
      if (search !== location.search) {
        try {
          history.replaceState(null, '', `${location.pathname}${search}${location.hash}`)
        } catch {
          // Rate-limited history write: skipping one URL update is harmless.
        }
      }
    }, URL_SYNC_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  })

  const selectedView = $derived(
    dash?.selectedSlug != null
      ? (views.find((v) => v.product.slug === dash?.selectedSlug) ?? null)
      : null,
  )

  /**
   * Cover art for the masthead: the products at their peak in the reference
   * week, falling back to those simply in season. This restates the "Ahora"
   * section rather than adding a claim, and products below the evidence
   * thresholds are never eligible (stateAt keeps them at `sin_datos`).
   */
  const featured = $derived.by(() => {
    if (!dash) return []
    const at = (state: string) =>
      views.filter((v) => stateAt(v, dash!.mode, dash!.referenceWeek) === state)
    const peak = at('pico')
    return peak.length > 0 ? peak : at('en_temporada')
  })

  const featuredCaption = $derived.by(() => {
    if (!dash || featured.length === 0) return ''
    const peak = stateAt(featured[0]!, dash.mode, dash.referenceWeek) === 'pico'
    const when = dash.isToday
      ? 'esta semana'
      : `en ${MONTH_NAMES_ES[monthOfWeekBin(dash.referenceWeek) - 1]}`
    return peak ? `En su pico ${when}` : `En temporada ${when}`
  })

  const dataUpdatedAt = $derived(
    dataset?.index.dataUpdatedAt
      ? new Intl.DateTimeFormat('es-BO', { dateStyle: 'long', timeZone: 'UTC' }).format(
          new Date(`${dataset.index.dataUpdatedAt}T00:00:00Z`),
        )
      : null,
  )

  function select(slug: string) {
    if (dash) dash.selectedSlug = slug
  }

  function closeDetail() {
    if (dash) dash.selectedSlug = null
  }
</script>

<svelte:window
  onpopstate={() => {
    if (dash) dash.applyParams(parseParams(location.search, slugs))
  }}
/>

<main>
  {#if dataset?.index.containsDemoData}
    <DemoBanner />
  {/if}

  <SiteHeader {dataUpdatedAt} {featured} {featuredCaption} />

  {#if error}
    <section class="state-box" aria-live="assertive">
      <h2>No se pudieron cargar los datos</h2>
      <p>{error}</p>
      <p class="muted">
        Si el problema persiste, el conjunto de datos publicado puede estar
        dañado o ausente. Intenta recargar la página.
      </p>
    </section>
  {:else if !dataset || !dash}
    <p class="loading" role="status">Cargando datos…</p>
  {:else}
    <AhoraSection {views} {dash} onselect={select} />
    <ExplorerSection {views} {dash} onselect={select} />

    {#if selectedView}
      <ProductDetail
        view={selectedView}
        sources={dataset.sources}
        referenceWeek={dash.referenceWeek}
        onclose={closeDetail}
      />
    {/if}
  {/if}

  <MethodologySection />
  {#if dataset}
    <SourcesSection sources={dataset.sources} />
  {/if}

  <footer>
    <p>
      Temporada Santa Cruz — código bajo licencia MIT, datos curados bajo
      CC BY 4.0.
      <a
        href="https://github.com/mariocesar/temporada-santa-cruz"
        target="_blank"
        rel="noopener noreferrer">Código y datos en GitHub</a
      >.
    </p>
    {#if dataUpdatedAt}
      <p class="muted">Datos actualizados hasta: {dataUpdatedAt}.</p>
    {/if}
    {#if dataset?.index.containsEstimatedSeasons}
      <p class="muted">
        ≈ Algunas temporadas son estimaciones según bibliografía citada y no
        provienen de observaciones de mercado; esos productos mantienen la
        etiqueta «Datos insuficientes».
      </p>
    {/if}
  </footer>
</main>

<style>
  main {
    max-width: 72rem;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4) var(--space-8);
  }

  .loading {
    color: var(--color-text-muted);
    margin: var(--space-8) 0;
  }

  .state-box {
    background: var(--color-surface);
    border: 1px solid #ddb6ab;
    border-radius: 0.5rem;
    padding: var(--space-6);
    margin: var(--space-6) 0;
    max-width: 36rem;
  }

  .state-box h2 {
    font-size: 1.125rem;
    margin: 0 0 var(--space-2);
    color: #8a2d1f;
  }

  .state-box p {
    margin: 0 0 var(--space-2);
  }

  footer {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-4);
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  footer p {
    margin: 0 0 var(--space-1);
  }

  footer a {
    color: var(--color-accent);
  }

  .muted {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }
</style>
