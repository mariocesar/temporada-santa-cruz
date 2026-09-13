<script lang="ts">
  import { rangesFromMask } from '../../domain/cyclic'
  import { WEEK_BINS } from '../../domain/methodology'
  import { MONTH_NAMES_ES, formatRangesAsMonths, monthOfWeekBin } from '../../domain/months'
  import { formatReferenceRanges, REFERENCE_SEASON_ARIA_ES } from '../../domain/referenceSeason'
  import { stateAt, type ProductView } from '../../data/views'
  import { CONFIDENCE_TEXT, MODE_LABEL, SEASON_STATE_LABEL, type ViewMode } from '../../i18n/labels'
  import { productHue } from '../../ui/palette'
  import ConfidenceChip from '../ui/ConfidenceChip.svelte'
  import MonthAxis from './MonthAxis.svelte'
  import SeasonStrip from './SeasonStrip.svelte'

  interface Props {
    views: ReadonlyArray<ProductView>
    mode: ViewMode
    referenceWeek: number
    selectedSlug: string | null
    onselect: (slug: string) => void
  }

  let { views, mode, referenceWeek, selectedSlug, onselect }: Props = $props()

  interface Hover {
    view: ProductView
    week: number
    x: number
    y: number
  }

  let hover = $state<Hover | null>(null)

  function primarySeries(view: ProductView): ReadonlyArray<number | null> {
    return mode === 'local' ? view.localSeries : view.marketSeries
  }

  function secondarySeries(view: ProductView): ReadonlyArray<number | null> {
    return mode === 'local' ? view.marketSeries : view.localSeries
  }

  function peakRangesLabel(view: ProductView): string {
    const mask = new Array<boolean>(WEEK_BINS).fill(false)
    for (const week of view.summary.peakWeeks) {
      if (week >= 1 && week <= WEEK_BINS) mask[week - 1] = true
    }
    const ranges = rangesFromMask(mask)
    return ranges.length > 0 ? formatRangesAsMonths(ranges) : ''
  }

  /** Text equivalent for one row (§11): the chart must not be color-only. */
  function describeRow(view: ProductView): string {
    const s = view.summary
    const estimate = s.referenceSeason
      ? ` Temporada estimada según bibliografía: ${formatReferenceRanges(s.referenceSeason.ranges)} — no proviene de observaciones de mercado.`
      : ''
    if (s.insufficientEvidence) {
      return `${view.product.nameEs}: datos insuficientes para clasificar la temporada.${estimate}`
    }
    const parts: string[] = []
    if (s.marketSeasonRanges.length > 0) {
      parts.push(`temporada de mercado: ${formatRangesAsMonths(s.marketSeasonRanges)}`)
    }
    if (s.localSeasonRanges.length > 0) {
      parts.push(`producción cruceña: ${formatRangesAsMonths(s.localSeasonRanges)}`)
    }
    const peaks = peakRangesLabel(view)
    if (peaks !== '') parts.push(`pico de mercado: ${peaks}`)
    const noDataWeeks = primarySeries(view).filter((v) => v === null).length
    if (noDataWeeks > 0) {
      parts.push(`sin datos en ${noDataWeeks} ${noDataWeeks === 1 ? 'semana' : 'semanas'}`)
    }
    parts.push(`confianza ${CONFIDENCE_TEXT[s.confidenceLabel].toLowerCase()}`)
    return `${view.product.nameEs} — ${parts.join('; ')}.${estimate}`
  }

  function handleHover(view: ProductView) {
    return (week: number | null, x: number, y: number) => {
      hover = week === null ? null : { view, week, x, y }
    }
  }

  const hoverWeekly = $derived(hover ? hover.view.weekly[hover.week - 1] : null)

  const anyReferenceSeason = $derived(views.some((v) => v.summary.referenceSeason))

  // Keep the tooltip inside the viewport: flip to the left of the cursor on
  // the right half of the screen.
  const tooltipStyle = $derived(
    hover
      ? `left: ${hover.x}px; top: ${hover.y + 16}px;` +
        (hover.x > window.innerWidth * 0.55 ? 'transform: translateX(-100%);' : '')
      : '',
  )
</script>

<div class="timeline">
  <div class="scroller">
    <div class="grid">
      <div class="corner" aria-hidden="true"></div>
      <div class="axis-cell"><MonthAxis /></div>

      {#each views as view (view.product.id)}
        <button
          type="button"
          class="name"
          class:selected={view.product.slug === selectedSlug}
          onclick={() => onselect(view.product.slug)}
        >
          <span class="name-chip" style="--hue: {productHue(view.product)}">
            {view.product.nameEs}
          </span>
          <ConfidenceChip summary={view.summary} />
        </button>
        <div class="strip-cell" class:selected={view.product.slug === selectedSlug}>
          <SeasonStrip
            primary={primarySeries(view)}
            secondary={secondarySeries(view)}
            reference={view.summary.referenceSeason?.ranges ?? []}
            markerWeek={referenceWeek}
            insufficient={view.summary.insufficientEvidence}
            hue={productHue(view.product)}
            height={44}
            label={describeRow(view)}
            onhoverweek={handleHover(view)}
          />
        </div>
      {/each}

      <div class="corner bottom" aria-hidden="true"></div>
      <div class="axis-cell bottom"><MonthAxis /></div>
    </div>
  </div>

  {#if hover}
    <div class="tooltip" style={tooltipStyle} role="presentation">
      <p class="tooltip-title">
        {hover.view.product.nameEs}
        <span class="tooltip-week">
          Semana {hover.week} · {MONTH_NAMES_ES[monthOfWeekBin(hover.week) - 1]}
        </span>
      </p>
      {#if hover.view.summary.insufficientEvidence}
        <p class="tooltip-row">Datos insuficientes para clasificar la temporada</p>
      {:else}
        <p class="tooltip-row">
          Mercado: <strong>{SEASON_STATE_LABEL[stateAt(hover.view, 'mercado', hover.week)]}</strong>
        </p>
        <p class="tooltip-row">
          Producción cruceña:
          <strong>{SEASON_STATE_LABEL[stateAt(hover.view, 'local', hover.week)]}</strong>
        </p>
        <p class="tooltip-row">
          Confianza: {CONFIDENCE_TEXT[hover.view.summary.confidenceLabel]}
        </p>
      {/if}
      {#if hover.view.summary.referenceSeason}
        <p class="tooltip-row muted">
          ≈ Estimada (bibliografía): {formatReferenceRanges(hover.view.summary.referenceSeason.ranges)}
        </p>
      {/if}
      {#if hoverWeekly && hoverWeekly.observations > 0}
        <p class="tooltip-row muted">
          {hoverWeekly.observations}
          {hoverWeekly.observations === 1 ? 'observación' : 'observaciones'} esta semana
          {#if hoverWeekly.years > 1}en {hoverWeekly.years} años{/if}
        </p>
        {#if hoverWeekly.localShare !== null}
          <p class="tooltip-row muted">
            Origen local: {Math.round(hoverWeekly.localShare * 100)} %
          </p>
        {/if}
      {/if}
    </div>
  {/if}

  <dl class="legend">
    <div class="legend-item">
      <dt>
        <svg viewBox="0 0 42 14" aria-hidden="true">
          <path class="lg-ridge" d="M 1,13 C 8,13 10,3 16,3 C 24,3 26,10 33,12 L 41,13 Z" />
        </svg>
      </dt>
      <dd>
        Curva rellena: {MODE_LABEL[mode].toLowerCase()} — la altura es el puntaje
        semanal (el pico de la curva es el pico de temporada)
      </dd>
    </div>
    <div class="legend-item">
      <dt>
        <svg viewBox="0 0 42 14" aria-hidden="true">
          <path class="lg-silhouette" d="M 1,13 C 8,13 10,3 16,3 C 24,3 26,10 33,12 L 41,13 Z" />
        </svg>
      </dt>
      <dd>
        Silueta clara: {MODE_LABEL[mode === 'local' ? 'mercado' : 'local'].toLowerCase()},
        detrás de la curva
      </dd>
    </div>
    <div class="legend-item">
      <dt>
        <svg viewBox="0 0 42 14" aria-hidden="true">
          <line x1="21" y1="0" x2="21" y2="14" class="lg-marker" />
        </svg>
      </dt>
      <dd>Semana de referencia</dd>
    </div>
    <div class="legend-item">
      <dt>
        <svg viewBox="0 0 42 14" aria-hidden="true">
          <line x1="2" y1="12" x2="40" y2="12" class="lg-insufficient" />
        </svg>
      </dt>
      <dd>Sin datos esa semana (los productos con evidencia insuficiente no se clasifican)</dd>
    </div>
    {#if anyReferenceSeason}
      <div class="legend-item">
        <dt>
          <svg viewBox="0 0 42 14" aria-hidden="true">
            <rect x="1" y="1" width="40" height="12" class="lg-reference-outline" />
            <line x1="8" y1="13" x2="20" y2="1" class="lg-reference-hatch" />
            <line x1="18" y1="13" x2="30" y2="1" class="lg-reference-hatch" />
            <line x1="28" y1="13" x2="40" y2="1" class="lg-reference-hatch" />
          </svg>
        </dt>
        <dd>≈ {REFERENCE_SEASON_ARIA_ES}</dd>
      </div>
    {/if}
  </dl>
</div>

<style>
  .timeline {
    position: relative;
  }

  /* Every curve wears its product's own produce-derived hue
     (src/lib/ui/palette.ts); the active concept is named in the section
     header and the legend below, and the mode toggle swaps which concept
     is the filled curve (§13, §16). */

  .scroller {
    overflow-x: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(11rem, max-content) minmax(30rem, 1fr);
    align-items: end;
    row-gap: 5px;
    min-width: 42rem;
  }

  .corner,
  .name {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--color-bg);
  }

  .axis-cell {
    padding-left: var(--space-2);
  }

  .axis-cell.bottom {
    padding-top: 2px;
  }

  .name {
    appearance: none;
    border: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2) var(--space-1) 0;
    color: var(--color-text);
    border-radius: 0.25rem;
  }

  /* Name chips (NOTES §5): the label lives with the data, tinted by the
     product's hue. */
  .name-chip {
    font-weight: 600;
    font-size: 0.9375rem;
    line-height: 1.35;
    padding: 0 var(--space-2);
    border-radius: var(--radius-chip);
    border: 1px solid color-mix(in oklab, var(--hue) 55%, var(--color-bg));
    background: color-mix(in oklab, var(--hue) 10%, var(--color-bg));
    white-space: nowrap;
  }

  .name:hover .name-chip {
    border-color: var(--hue);
  }

  .name.selected .name-chip {
    border-color: var(--hue);
    box-shadow: inset 0 0 0 1px var(--hue);
  }

  .strip-cell {
    padding-left: var(--space-2);
  }

  .strip-cell.selected :global(svg) {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }

  .tooltip {
    position: fixed;
    z-index: 10;
    pointer-events: none;
    background: var(--color-text);
    color: var(--color-bg);
    border-radius: 0.375rem;
    padding: var(--space-2) var(--space-3);
    font-size: 0.8125rem;
    line-height: 1.45;
    max-width: 18rem;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
  }

  .tooltip p {
    margin: 0;
  }

  .tooltip-title {
    font-weight: 700;
    margin-bottom: 2px;
  }

  .tooltip-week {
    display: block;
    font-weight: 400;
    opacity: 0.75;
  }

  .tooltip .muted {
    opacity: 0.75;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-6);
    margin: var(--space-4) 0 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .legend-item dt {
    margin: 0;
  }

  .legend-item dd {
    margin: 0;
  }

  .legend svg {
    width: 42px;
    height: 14px;
    display: block;
  }

  /* Legend swatches demonstrate the encoding with one neutral produce
     amber — real rows each wear their own hue. */
  .lg-ridge {
    fill: #b36a1f;
    fill-opacity: 0.82;
    stroke: #b36a1f;
    stroke-width: 1;
  }

  .lg-silhouette {
    fill: color-mix(in oklab, #b36a1f 26%, var(--color-bg));
  }

  .lg-marker {
    stroke: var(--color-text);
    stroke-width: 1.5;
    stroke-dasharray: 2 3;
  }

  .lg-insufficient {
    stroke: var(--season-reference);
    stroke-opacity: 0.7;
    stroke-width: 2;
    stroke-dasharray: 4 5;
  }

  .lg-reference-outline {
    fill: none;
    stroke: var(--season-reference);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }

  .lg-reference-hatch {
    stroke: var(--season-reference);
    stroke-width: 1;
    opacity: 0.55;
  }
</style>
