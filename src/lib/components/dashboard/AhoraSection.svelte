<script lang="ts">
  import { formatRangesAsMonths, MONTH_NAMES_ES, MONTH_SHORT_ES, monthOfWeekBin, weekBinForMonth } from '../../domain/months'
  import { localShareOfKnown, stateAt, type ProductView } from '../../data/views'
  import type { DashboardState } from '../../stores/dashboard.svelte'
  import { CATEGORY_LABEL, MODE_LABEL, type ViewMode } from '../../i18n/labels'
  import type { SeasonState } from '../../data/types'
  import { productHue } from '../../ui/palette'
  import ConfidenceChip from '../ui/ConfidenceChip.svelte'
  import ProductGlyph from '../ui/ProductGlyph.svelte'
  import SegmentedControl from '../ui/SegmentedControl.svelte'

  interface Props {
    views: ReadonlyArray<ProductView>
    dash: DashboardState
    onselect: (slug: string) => void
  }

  let { views, dash, onselect }: Props = $props()

  const MODE_OPTIONS: ReadonlyArray<{ value: ViewMode; label: string }> = [
    { value: 'mercado', label: MODE_LABEL.mercado },
    { value: 'local', label: MODE_LABEL.local },
  ]

  const GROUPS: ReadonlyArray<{ state: SeasonState; title: string }> = [
    { state: 'pico', title: 'Pico de temporada' },
    { state: 'entrando', title: 'Entrando en temporada' },
    { state: 'en_temporada', title: 'En temporada' },
    { state: 'saliendo', title: 'Saliendo de temporada' },
  ]

  const referenceMonth = $derived(monthOfWeekBin(dash.referenceWeek))

  // Estimate-only products never appear in these groups: insufficient
  // evidence keeps stateAt at 'sin_datos' (§104) — a bibliography estimate
  // is a year-scale approximation, never a current-week claim.
  const grouped = $derived(
    GROUPS.map((group) => ({
      ...group,
      items: views.filter((v) => stateAt(v, dash.mode, dash.referenceWeek) === group.state),
    })),
  )

  const outCount = $derived(
    views.filter((v) => stateAt(v, dash.mode, dash.referenceWeek) === 'fuera').length,
  )
  const noDataViews = $derived(
    views.filter((v) => stateAt(v, dash.mode, dash.referenceWeek) === 'sin_datos'),
  )
  const noDataCount = $derived(noDataViews.length)
  const estimatedCount = $derived(noDataViews.filter((v) => v.summary.referenceSeason).length)
  const anyInSeason = $derived(grouped.some((g) => g.items.length > 0))

  function seasonMonths(view: ProductView): string {
    const ranges =
      dash.mode === 'local' ? view.summary.localSeasonRanges : view.summary.marketSeasonRanges
    return ranges.length > 0 ? formatRangesAsMonths(ranges) : ''
  }

  function localPercent(view: ProductView): number | null {
    const share = localShareOfKnown(view.summary)
    return share === null ? null : Math.round(share * 100)
  }
</script>

<section class="ahora" aria-labelledby="ahora-title">
  <div class="head">
    <h2 id="ahora-title">
      {#if dash.isToday}
        ¿Qué está de temporada ahora?
      {:else}
        ¿Qué está de temporada en {MONTH_NAMES_ES[referenceMonth - 1]}?
      {/if}
    </h2>
    <p class="week-note">
      Semana {dash.referenceWeek} · {MONTH_NAMES_ES[referenceMonth - 1]}
      {#if dash.isToday}(esta semana){/if}
      {#if dash.mode === 'local'}
        — mostrando <strong>producción cruceña</strong>
      {:else}
        — mostrando <strong>temporada de mercado</strong>
      {/if}
    </p>
  </div>

  <div class="controls">
    <SegmentedControl
      options={MODE_OPTIONS}
      value={dash.mode}
      label="Tipo de temporada"
      onChange={(mode) => (dash.mode = mode)}
    />

    <nav class="months" aria-label="Explorar por mes">
      <button
        type="button"
        class="month-btn today"
        class:active={dash.isToday}
        aria-pressed={dash.isToday}
        onclick={() => (dash.pinnedWeek = null)}
      >
        Hoy
      </button>
      {#each MONTH_SHORT_ES as short, i (short)}
        <button
          type="button"
          class="month-btn"
          class:active={!dash.isToday && referenceMonth === i + 1}
          aria-pressed={!dash.isToday && referenceMonth === i + 1}
          aria-label={MONTH_NAMES_ES[i]}
          onclick={() => (dash.pinnedWeek = weekBinForMonth(i + 1))}
        >
          {short}
        </button>
      {/each}
    </nav>
  </div>

  {#if !anyInSeason}
    <p class="empty">
      Ninguna temporada marcada para esta semana según los datos disponibles.
      Explora el año completo abajo.
    </p>
  {/if}

  {#each grouped as group (group.state)}
    {#if group.items.length > 0}
      <h3>{group.title} <span class="count">({group.items.length})</span></h3>
      <ul class="cards" class:feature={group.state === 'pico'}>
        {#each group.items as view, i (view.product.id)}
          <li>
            <button
              type="button"
              class="card"
              style="--hue: {productHue(view.product)}; --i: {i}"
              onclick={() => onselect(view.product.slug)}
            >
              <span class="card-head">
                <span class="card-title">
                  <span class="card-art" aria-hidden="true">
                    <ProductGlyph
                      productId={view.product.id}
                      hue={productHue(view.product)}
                      size={group.state === 'pico' ? 48 : 34}
                      stroke={1.25}
                      wash={0.12}
                    />
                  </span>
                  <span class="card-name">{view.product.nameEs}</span>
                </span>
                <span class="card-category">{CATEGORY_LABEL[view.product.category]}</span>
              </span>
              {#if seasonMonths(view) !== ''}
                <span class="card-season">
                  {dash.mode === 'local' ? 'Producción cruceña' : 'Temporada'}:
                  {seasonMonths(view)}
                </span>
              {/if}
              {#if dash.mode === 'local' && localPercent(view) !== null}
                <span class="card-season">
                  Origen cruceño: {localPercent(view)} % de las observaciones con
                  procedencia conocida (todo el año)
                </span>
              {/if}
              <ConfidenceChip summary={view.summary} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/each}

  {#if outCount > 0 || noDataCount > 0}
    <p class="rest">
      {#if outCount > 0}
        {outCount} {outCount === 1 ? 'producto' : 'productos'} fuera de temporada en esta semana{noDataCount > 0 ? ' · ' : ''}
      {/if}
      {#if noDataCount > 0}
        {noDataCount} sin datos suficientes{#if estimatedCount > 0}
          &nbsp;(≈ {estimatedCount} con temporada estimada según bibliografía, ver la línea de tiempo){/if}
      {/if}
    </p>
  {/if}
</section>

<style>
  .ahora {
    margin-bottom: var(--space-8);
  }

  h2 {
    font-size: 1.5rem;
    margin: 0;
  }

  .week-note {
    color: var(--color-text-muted);
    margin: var(--space-1) 0 0;
    font-size: 0.9375rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin: var(--space-4) 0;
  }

  .months {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  .month-btn {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    font: inherit;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    padding: var(--space-1) var(--space-2);
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .month-btn:hover {
    color: var(--color-text);
    background: var(--color-surface);
    border-color: var(--color-border);
  }

  .month-btn.active {
    background: var(--color-text);
    color: var(--color-bg);
  }

  .month-btn.today {
    font-weight: 700;
  }

  h3 {
    font-size: 1.0625rem;
    margin: var(--space-6) 0 var(--space-2);
  }

  .count {
    color: var(--color-text-muted);
    font-weight: 400;
  }

  .cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: var(--space-3);
  }

  /* Peak week is the answer most readers came for: those cards get the
     room, the bigger drawing, and a breath of the product's own hue. */
  .cards.feature {
    grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr));
  }

  .cards.feature .card {
    background: color-mix(in oklab, var(--hue) 5%, var(--color-surface));
    border-left-width: 6px;
    padding: var(--space-4);
    gap: var(--space-2);
  }

  .cards.feature .card-name {
    font-size: 1.375rem;
  }

  /* In the feature row the season itself is the headline information, not
     a caption under the name. */
  .cards.feature .card-season {
    font-size: 1rem;
    color: var(--color-text);
  }

  /* The produce hue enters as a woven left selvage — cards stay paper,
     the accent identifies, nothing floats on shadows. */
  .card {
    appearance: none;
    font: inherit;
    text-align: left;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-left: 4px solid color-mix(in oklab, var(--hue) 75%, var(--color-bg));
    border-radius: var(--radius);
    padding: var(--space-3);
    cursor: pointer;
    color: var(--color-text);
    transition: border-color 160ms ease, transform 160ms ease;
    animation: card-in 380ms cubic-bezier(0.22, 0.7, 0.28, 1) both;
    animation-delay: calc(var(--i, 0) * 45ms);
  }

  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  .card:hover {
    border-color: var(--hue);
    border-left-color: var(--hue);
    transform: translateY(-2px);
  }

  .card:hover .card-art {
    opacity: 1;
  }

  .card-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    width: 100%;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .card-art {
    flex: none;
    opacity: 0.8;
    transition: opacity 160ms ease;
  }

  .card-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.1875rem;
    line-height: 1.2;
  }

  .card-category {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }

  .card-season {
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  .empty,
  .rest {
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .rest {
    margin: var(--space-4) 0 0;
  }
</style>
