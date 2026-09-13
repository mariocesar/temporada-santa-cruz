<script lang="ts">
  import { filterViews, sortViews, SORT_OPTIONS, type ProductView } from '../../data/views'
  import { MONTH_NAMES_ES, monthOfWeekBin } from '../../domain/months'
  import type { DashboardState } from '../../stores/dashboard.svelte'
  import { CATEGORY_FILTERS, MODE_LABEL, type ViewMode } from '../../i18n/labels'
  import { productHue } from '../../ui/palette'
  import ProductArt from '../ui/ProductArt.svelte'
  import SegmentedControl from '../ui/SegmentedControl.svelte'
  import Timeline from '../charts/Timeline.svelte'

  interface Props {
    views: ReadonlyArray<ProductView>
    dash: DashboardState
    /**
     * Products at their peak in the reference week — the poster's marginal
     * drawings (NOTES §7). Pure ornament restating the "Ahora" section
     * below; never a claim of its own.
     */
    featured?: ReadonlyArray<ProductView>
    /** Latest observation date across the dataset (§47), pre-formatted. */
    dataUpdatedAt?: string | null
    /** Mixed real+demo dataset: mark products with synthetic records (§45). */
    markSynthetic?: boolean
    onselect: (slug: string) => void
  }

  let {
    views,
    dash,
    featured = [],
    dataUpdatedAt = null,
    markSynthetic = false,
    onselect,
  }: Props = $props()

  // The lámina is the landing experience: one mode toggle stays in view
  // (the market/local distinction must be explicit where the curves are
  // read, §13); search, category and sort live behind one quiet control.
  const MODE_OPTIONS: ReadonlyArray<{ value: ViewMode; label: string }> = [
    { value: 'mercado', label: MODE_LABEL.mercado },
    { value: 'local', label: MODE_LABEL.local },
  ]

  let filtersOpen = $state(false)

  const filtersActive = $derived(
    dash.query !== '' || dash.category !== 'todos' || dash.sort !== 'inicio',
  )
  const showFilters = $derived(filtersOpen || filtersActive)

  const filtered = $derived(filterViews(views, dash.query, dash.category))
  const visible = $derived(sortViews(filtered, dash.sort, dash.mode, dash.referenceWeek))

  // Marginal drawings flank the cascade in its side gutters, pasted onto
  // the page like plates in an almanac: left column takes the even picks,
  // right column the odd ones.
  const MAX_MARGIN_ART = 4
  const marginArt = $derived(featured.slice(0, MAX_MARGIN_ART))
  const leftArt = $derived(marginArt.filter((_, i) => i % 2 === 0))
  const rightArt = $derived(marginArt.filter((_, i) => i % 2 === 1))

  /**
   * Poster view: the whole year on one screen, the way the owner-vetted
   * reference reads (docs/design-references/NOTES.md §1). It changes
   * nothing about the encoding — same curves, same honesty devices — only
   * how much room the cascade gets.
   */
  let poster = $state(false)
  let viewportHeight = $state(900)

  // Chrome above and below the cascade in poster view: masthead, both
  // month axes, the legend line, and the page padding.
  const POSTER_CHROME_PX = 290
  const POSTER_ROW_GAP = 10

  const posterRowHeight = $derived(
    Math.max(
      26,
      Math.min(
        64,
        Math.floor((viewportHeight - POSTER_CHROME_PX) / Math.max(1, visible.length)) -
          POSTER_ROW_GAP,
      ),
    ),
  )

  const referenceMonth = $derived(monthOfWeekBin(dash.referenceWeek))

  // The page behind the poster must not scroll under it.
  $effect(() => {
    if (!poster) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  })

  function clearFilters() {
    dash.query = ''
    dash.category = 'todos'
  }
</script>

<svelte:window
  bind:innerHeight={viewportHeight}
  onkeydown={(event) => {
    if (poster && event.key === 'Escape') poster = false
  }}
/>

<section class="explorer" class:poster aria-labelledby="explorer-title">
  <div class="head">
    <div>
      {#if poster}
        <p class="kicker">Santa Cruz de la Sierra · Bolivia</p>
        <h2 id="explorer-title">El año entero</h2>
        <p class="poster-note">
          {MODE_LABEL[dash.mode]} · semana {dash.referenceWeek} ·
          {MONTH_NAMES_ES[referenceMonth - 1]}
        </p>
      {:else}
        <h2 id="explorer-title" class="visually-hidden">El año entero</h2>
      {/if}
    </div>

    <div class="head-controls">
      {#if !poster}
        <SegmentedControl
          options={MODE_OPTIONS}
          value={dash.mode}
          label="Tipo de temporada"
          onChange={(mode) => (dash.mode = mode)}
        />
        <button
          type="button"
          class="quiet-toggle"
          aria-expanded={showFilters}
          onclick={() => (filtersOpen = !showFilters)}
        >
          Buscar y filtrar
        </button>
      {/if}
      <button
        type="button"
        class="quiet-toggle"
        aria-pressed={poster}
        onclick={() => (poster = !poster)}
      >
        {poster ? 'Salir de la lámina' : 'Ver como lámina'}
      </button>
    </div>
  </div>

  {#if showFilters && !poster}
    <div class="controls">
      <p class="search">
        <label class="visually-hidden" for="product-search">Buscar producto</label>
        <input
          id="product-search"
          type="search"
          placeholder="Buscar producto (nombre o alias)…"
          autocomplete="off"
          bind:value={dash.query}
        />
      </p>

      <SegmentedControl
        options={CATEGORY_FILTERS}
        value={dash.category}
        label="Filtrar por categoría"
        onChange={(category) => (dash.category = category)}
      />

      <p class="sort">
        <label for="timeline-sort">Ordenar por</label>
        <select id="timeline-sort" bind:value={dash.sort}>
          {#each SORT_OPTIONS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </p>
    </div>
  {/if}

  {#if visible.length === 0}
    <div class="empty">
      <p>No hay productos que coincidan con la búsqueda o el filtro.</p>
      <button type="button" onclick={clearFilters}>Limpiar filtros</button>
    </div>
  {:else}
    <div class="stage" class:with-art={!poster && marginArt.length > 0}>
      {#if !poster && marginArt.length > 0}
        <div class="margin-art left" aria-hidden="true">
          {#each leftArt as view, i (view.product.id)}
            <span class="plate" style="--rot: {i % 2 === 0 ? -3 : 2}deg">
              <ProductArt
                productId={view.product.id}
                hue={productHue(view.product)}
                size={104}
              />
            </span>
          {/each}
        </div>
      {/if}

      <Timeline
        views={visible}
        mode={dash.mode}
        referenceWeek={dash.referenceWeek}
        selectedSlug={dash.selectedSlug}
        rowHeight={poster ? posterRowHeight : 42}
        rowGap={poster ? POSTER_ROW_GAP : 24}
        {markSynthetic}
        {onselect}
      />

      {#if !poster && marginArt.length > 0}
        <div class="margin-art right" aria-hidden="true">
          {#each rightArt as view, i (view.product.id)}
            <span class="plate" style="--rot: {i % 2 === 0 ? 2.5 : -2}deg">
              <ProductArt
                productId={view.product.id}
                hue={productHue(view.product)}
                size={104}
              />
            </span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if !poster}
    <p class="colophon">
      {#if dataUpdatedAt}
        <span>Datos actualizados hasta: {dataUpdatedAt}</span>
      {/if}
      <a href="#metodologia">Metodología</a>
      <a href="#fuentes">Fuentes de datos</a>
    </p>
  {/if}
</section>

<style>
  /* The lámina is the hero: it escapes the article column and takes the
     width a poster deserves, art in the gutters at desktop widths. */
  .explorer {
    margin-bottom: var(--space-8);
    margin-inline: calc(50% - 50vw);
    padding-inline: max(var(--space-4), calc(50vw - 40rem));
  }

  /* The poster takes the screen: one page, the whole year, no competing
     chrome. Escape or the toggle returns to the dashboard. */
  .explorer.poster {
    position: fixed;
    inset: 0;
    z-index: 60;
    margin: 0;
    overflow: auto;
    overscroll-behavior: contain;
    background: var(--color-bg);
    padding: var(--space-6) clamp(var(--space-4), 4vw, var(--space-8));
    animation: poster-in 240ms ease both;
  }

  @keyframes poster-in {
    from {
      opacity: 0;
    }
  }

  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-2);
  }

  .explorer.poster .head {
    margin-bottom: var(--space-4);
  }

  h2 {
    font-size: 1.5rem;
    margin: 0;
  }

  .explorer.poster h2 {
    font-size: clamp(1.75rem, 3.4vw, 2.75rem);
    line-height: 1.05;
    color: var(--color-display);
  }

  .kicker {
    font-variant-caps: all-small-caps;
    letter-spacing: 0.14em;
    font-weight: 500;
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    margin: 0 0 var(--space-1);
  }

  .poster-note {
    margin: var(--space-1) 0 0;
    font-size: 0.9375rem;
    color: var(--color-text-muted);
  }

  .head-controls {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  .quiet-toggle {
    appearance: none;
    flex: none;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-accent);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-chip);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
    transition: border-color 160ms ease, color 160ms ease;
  }

  .quiet-toggle:hover {
    border-color: var(--color-accent);
  }

  .quiet-toggle[aria-expanded='true'] {
    border-color: var(--color-accent);
    background: color-mix(in oklab, var(--color-accent) 8%, var(--color-surface));
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .search {
    margin: 0;
    flex: 1 1 14rem;
    max-width: 22rem;
  }

  input[type='search'] {
    width: 100%;
    font: inherit;
    font-size: 0.9375rem;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-surface);
    color: var(--color-text);
  }

  .sort {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  select {
    font: inherit;
    font-size: 0.875rem;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    background: var(--color-surface);
    color: var(--color-text);
  }

  /* Cascade with art gutters (NOTES §7): drawings sit in the whitespace
     flanking the chart, soft, never over the data. */
  .stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  @media (min-width: 78rem) {
    .stage.with-art {
      grid-template-columns: 7.5rem minmax(0, 1fr) 7.5rem;
      column-gap: var(--space-4);
    }
  }

  .margin-art {
    display: none;
  }

  @media (min-width: 78rem) {
    .margin-art {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      padding-block: var(--space-8);
    }
  }

  .margin-art.right {
    padding-top: var(--space-8);
  }

  /* Plates pasted into the almanac: a slight hand-set rotation, washed so
     they read as marginalia rather than data. */
  .plate {
    display: block;
    opacity: 0.8;
    transform: rotate(var(--rot, 0deg));
  }

  .empty {
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: 0.5rem;
    padding: var(--space-6);
    text-align: center;
    color: var(--color-text-muted);
  }

  .empty p {
    margin: 0 0 var(--space-3);
  }

  .empty button {
    appearance: none;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-accent);
    background: transparent;
    border: 1px solid var(--color-accent);
    border-radius: 0.375rem;
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
  }

  .colophon {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-1) var(--space-6);
    margin: var(--space-4) 0 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .colophon a {
    color: var(--color-accent);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
</style>
