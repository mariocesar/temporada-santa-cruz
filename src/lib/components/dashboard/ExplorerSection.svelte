<script lang="ts">
  import { filterViews, sortViews, SORT_OPTIONS, type ProductView, type SortKey } from '../../data/views'
  import type { DashboardState } from '../../stores/dashboard.svelte'
  import { CATEGORY_FILTERS } from '../../i18n/labels'
  import SegmentedControl from '../ui/SegmentedControl.svelte'
  import Timeline from '../charts/Timeline.svelte'

  interface Props {
    views: ReadonlyArray<ProductView>
    dash: DashboardState
    onselect: (slug: string) => void
  }

  let { views, dash, onselect }: Props = $props()

  const filtered = $derived(filterViews(views, dash.query, dash.category))
  const visible = $derived(sortViews(filtered, dash.sort, dash.mode, dash.referenceWeek))

  function clearFilters() {
    dash.query = ''
    dash.category = 'todos'
  }
</script>

<section class="explorer" aria-labelledby="explorer-title">
  <h2 id="explorer-title">Explorar todo el año</h2>

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
      {onselect}
    />
  {/if}
</section>

<style>
  .explorer {
    margin-bottom: var(--space-8);
  }

  h2 {
    font-size: 1.5rem;
    margin: 0 0 var(--space-4);
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
