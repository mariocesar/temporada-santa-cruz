<script lang="ts">
  import { rangesFromMask } from '../../domain/cyclic'
  import { WEEK_BINS } from '../../domain/methodology'
  import { MONTH_NAMES_ES, formatRangesAsMonths, monthOfWeekBin } from '../../domain/months'
  import { formatReferenceRanges, REFERENCE_SEASON_ARIA_ES } from '../../domain/referenceSeason'
  import { stateAt, type ProductView } from '../../data/views'
  import { CONFIDENCE_TEXT, SEASON_STATE_LABEL, type ViewMode } from '../../i18n/labels'
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

<div class="timeline season-{mode}">
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
          <span class="name-text">{view.product.nameEs}</span>
          <ConfidenceChip summary={view.summary} />
        </button>
        <div class="strip-cell" class:selected={view.product.slug === selectedSlug}>
          <SeasonStrip
            primary={primarySeries(view)}
            secondary={secondarySeries(view)}
            reference={view.summary.referenceSeason?.ranges ?? []}
            markerWeek={referenceWeek}
            insufficient={view.summary.insufficientEvidence}
            label={describeRow(view)}
            onhoverweek={handleHover(view)}
          />
        </div>
      {/each}
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
        <svg viewBox="0 0 42 12" aria-hidden="true">
          <rect x="0" y="0" width="14" height="12" class="lg-occasional" />
          <rect x="14" y="0" width="14" height="12" class="lg-in" />
          <rect x="28" y="0" width="14" height="12" class="lg-peak" />
        </svg>
      </dt>
      <dd>Ocasional · En temporada · Pico ({mode === 'local' ? 'producción cruceña' : 'mercado'})</dd>
    </div>
    <div class="legend-item">
      <dt>
        <svg viewBox="0 0 42 12" aria-hidden="true">
          <rect x="0" y="8" width="42" height="4" class="lg-secondary" />
        </svg>
      </dt>
      <dd>
        Línea inferior: {mode === 'local' ? 'temporada de mercado' : 'producción cruceña en temporada'}
      </dd>
    </div>
    <div class="legend-item">
      <dt>
        <svg viewBox="0 0 42 12" aria-hidden="true">
          <line x1="21" y1="0" x2="21" y2="12" class="lg-marker" />
        </svg>
      </dt>
      <dd>Semana de referencia</dd>
    </div>
    <div class="legend-item">
      <dt>
        <svg viewBox="0 0 42 12" aria-hidden="true">
          <line x1="2" y1="6" x2="40" y2="6" class="lg-insufficient" />
        </svg>
      </dt>
      <dd>Sin datos esa semana (los productos con evidencia insuficiente no se clasifican)</dd>
    </div>
    {#if anyReferenceSeason}
      <div class="legend-item">
        <dt>
          <svg viewBox="0 0 42 12" aria-hidden="true">
            <rect x="1" y="1" width="40" height="10" class="lg-reference-outline" />
            <line x1="8" y1="11" x2="18" y2="1" class="lg-reference-hatch" />
            <line x1="18" y1="11" x2="28" y2="1" class="lg-reference-hatch" />
            <line x1="28" y1="11" x2="38" y2="1" class="lg-reference-hatch" />
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

  /* Palette comes from the global .season-mercado / .season-local classes
     (app.css) — the hue changes with the mode so the active concept is
     unmistakable (§13, §16). */

  .scroller {
    overflow-x: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(11rem, max-content) minmax(30rem, 1fr);
    align-items: center;
    row-gap: 4px;
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

  .name-text {
    font-weight: 600;
  }

  .name:hover .name-text {
    color: var(--color-accent);
    text-decoration: underline;
  }

  .name.selected .name-text {
    color: var(--color-accent);
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
    height: 12px;
    display: block;
  }

  .lg-occasional {
    fill: var(--season-occasional);
  }

  .lg-in {
    fill: var(--season-in);
  }

  .lg-peak {
    fill: var(--season-peak);
  }

  .lg-secondary {
    fill: var(--season-secondary);
  }

  .lg-marker {
    stroke: var(--color-text);
    stroke-width: 1.5;
    stroke-dasharray: 2 3;
  }

  .lg-insufficient {
    stroke: var(--color-border);
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
