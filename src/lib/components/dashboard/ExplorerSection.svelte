<script lang="ts">
  import { filterViews, sortViews, SORT_OPTIONS, type ProductView } from '../../data/views'
  import { MONTH_NAMES_ES, monthOfWeekBin } from '../../domain/months'
  import type { DashboardState } from '../../stores/dashboard.svelte'
  import { CATEGORY_FILTERS, MODE_LABEL, type ViewMode } from '../../i18n/labels'
  import SegmentedControl from '../ui/SegmentedControl.svelte'
  import Timeline from '../charts/Timeline.svelte'

  interface Props {
    views: ReadonlyArray<ProductView>
    dash: DashboardState
    /** Mixed real+demo dataset: mark products with synthetic records (§45). */
    markSynthetic?: boolean
    onselect: (slug: string) => void
  }

  let { views, dash, markSynthetic = false, onselect }: Props = $props()

  // The mode toggle repeats here (shared state with "Ahora") so the active
  // concept — mercado vs producción cruceña — is explicit where the
  // timeline is actually read (§13: the state must be obvious).
  const MODE_OPTIONS: ReadonlyArray<{ value: ViewMode; label: string }> = [
    { value: 'mercado', label: MODE_LABEL.mercado },
    { value: 'local', label: MODE_LABEL.local },
  ]

  const filtered = $derived(filterViews(views, dash.query, dash.category))
  const visible = $derived(sortViews(filtered, dash.sort, dash.mode, dash.referenceWeek))

  /**
   * Poster view: the whole year on one screen, the way the owner-vetted
   * reference reads (docs/design-references/NOTES.md §1). It changes
   * nothing about the encoding — same curves, same honesty devices — only
   * how much room the cascade gets.
   */
  let poster = $state(false)
  let viewportHeight = $state(900)

  // Chrome above and below the cascade in poster view: masthead, control
  // bar, both month axes, legend, and the page padding.
  const POSTER_CHROME_PX = 390
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
      {/if}
      <h2 id="explorer-title">
        {#if poster}
          El año entero
        {:else}
          Explorar todo el año
        {/if}
      </h2>
      {#if poster}
        <p class="poster-note">
          {MODE_LABEL[dash.mode]} · semana {dash.referenceWeek} ·
          {MONTH_NAMES_ES[referenceMonth - 1]}
        </p>
      {/if}
    </div>

    <button
      type="button"
      class="poster-toggle"
      aria-pressed={poster}
      onclick={() => (poster = !poster)}
    >
      {poster ? 'Salir de la lámina' : 'Ver como lámina'}
    </button>
  </div>

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
      options={MODE_OPTIONS}
      value={dash.mode}
      label="Tipo de temporada"
      onChange={(mode) => (dash.mode = mode)}
    />

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

  {#if visible.length === 0}
    <div class="empty">
      <p>No hay productos que coincidan con la búsqueda o el filtro.</p>
      <button type="button" onclick={clearFilters}>Limpiar filtros</button>
    </div>
  {:else}
    <Timeline
      views={visible}
      mode={dash.mode}
      referenceWeek={dash.referenceWeek}
      selectedSlug={dash.selectedSlug}
      rowHeight={poster ? posterRowHeight : 54}
      rowGap={poster ? POSTER_ROW_GAP : 14}
      {markSynthetic}
      {onselect}
    />
  {/if}
</section>

<style>
  .explorer {
    margin-bottom: var(--space-8);
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

  .poster-toggle {
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

  .poster-toggle:hover {
    border-color: var(--color-accent);
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
