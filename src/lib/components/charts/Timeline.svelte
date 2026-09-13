<script lang="ts">
  import { rangesFromMask } from '../../domain/cyclic'
  import { WEEK_BINS } from '../../domain/methodology'
  import { MONTH_NAMES_ES, formatRangesAsMonths, monthOfWeekBin } from '../../domain/months'
  import { formatReferenceRanges, REFERENCE_SEASON_ARIA_ES } from '../../domain/referenceSeason'
  import { cascadeStart, stateAt, type ProductView } from '../../data/views'
  import { CONFIDENCE_TEXT, MODE_LABEL, SEASON_STATE_LABEL, type ViewMode } from '../../i18n/labels'
  import { productHue } from '../../ui/palette'
  import ProductGlyph from '../ui/ProductGlyph.svelte'
  import MonthAxis from './MonthAxis.svelte'
  import SeasonStrip from './SeasonStrip.svelte'

  interface Props {
    views: ReadonlyArray<ProductView>
    mode: ViewMode
    referenceWeek: number
    selectedSlug: string | null
    /** Strip height per row; the poster view sizes rows to the viewport. */
    rowHeight?: number
    /** Vertical breathing room between rows, in px. */
    rowGap?: number
    /** Mixed real+demo dataset: mark rows with synthetic records (§45). */
    markSynthetic?: boolean
    onselect: (slug: string) => void
  }

  let {
    views,
    mode,
    referenceWeek,
    selectedSlug,
    rowHeight = 54,
    rowGap = 14,
    markSynthetic = false,
    onselect,
  }: Props = $props()

  interface Hover {
    view: ProductView
    week: number
    x: number
    y: number
  }

  let hover = $state<Hover | null>(null)

  /**
   * The row under the pointer or keyboard focus. Bringing one row forward
   * (and easing the others back) is what lets a reader follow a single
   * product across a dense cascade; it changes no encoding.
   */
  let focusedId = $state<string | null>(null)

  /** Rows rise in sequence, so the cascade arrives as a cascade. */
  const ROW_STAGGER_MS = 55

  /**
   * Ridgeline overlap (NOTES §2): crests may rise this far into the row
   * above, the way the reference poster's bells share their whitespace.
   * Later rows paint on top; hover hit areas stay inside each row box, so
   * the overlap is purely visual and never changes a row's claim.
   */
  const rise = $derived(Math.round(rowHeight * 0.55))

  /**
   * Products below the evidence thresholds draw no curve — just the dashed
   * no-evidence baseline and the §104 hatch band — so their rows need only
   * enough height for those honesty devices, not a full ridge's headroom.
   */
  const compactHeight = $derived(Math.max(22, Math.round(rowHeight * 0.5)))

  function stripHeight(view: ProductView): number {
    return view.summary.insufficientEvidence ? compactHeight : rowHeight
  }

  function stripRise(view: ProductView): number {
    return view.summary.insufficientEvidence ? 0 : rise
  }

  /**
   * Name chips live where the season begins (NOTES §5): anchored at the
   * cascade-anchor week of the active mode. Products without an anchor
   * (insufficient evidence, no season in this mode) label at the year's
   * start. Clamped so long names never run off the canvas.
   */
  function chipLeftPct(view: ProductView): number {
    const anchor = cascadeStart(view, mode) ?? 1
    return Math.min(78, ((anchor - 1) / WEEK_BINS) * 100)
  }

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
    const synthetic =
      markSynthetic && s.containsSyntheticData
        ? ' Incluye datos sintéticos de demostración.'
        : ''
    if (s.insufficientEvidence) {
      return `${view.product.nameEs}: datos insuficientes para clasificar la temporada.${estimate}${synthetic}`
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
    return `${view.product.nameEs} — ${parts.join('; ')}.${estimate}${synthetic}`
  }

  function handleHover(view: ProductView) {
    return (week: number | null, x: number, y: number) => {
      hover = week === null ? null : { view, week, x, y }
      focusedId = week === null ? null : view.product.id
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
    <div class="rows" style="--row-gap: {rowGap}px">
      <!-- The gap under the axis absorbs the first ridge's overlap rise,
           so no crest ever climbs over the month labels. -->
      <div class="axis-cell" style="margin-bottom: {Math.max(0, rise - rowGap)}px">
        <MonthAxis />
      </div>

      {#each views as view, rowIndex (view.product.id)}
        <!-- Pointer handlers here only drive the hover dim; the strip
             itself carries the row's semantics and text equivalent. -->
        <div
          class="row"
          role="presentation"
          class:dimmed={focusedId !== null && focusedId !== view.product.id}
          style="height: {stripHeight(view)}px"
          onpointerenter={() => (focusedId = view.product.id)}
          onpointerleave={() => (focusedId = null)}
        >
          <SeasonStrip
            primary={primarySeries(view)}
            secondary={secondarySeries(view)}
            reference={view.summary.referenceSeason?.ranges ?? []}
            markerWeek={referenceWeek}
            insufficient={view.summary.insufficientEvidence}
            hue={productHue(view.product)}
            height={stripHeight(view)}
            overshoot={stripRise(view)}
            label={describeRow(view)}
            revealDelay={rowIndex * ROW_STAGGER_MS}
            revealKey={mode}
            onhoverweek={handleHover(view)}
          />
          <button
            type="button"
            class="name"
            class:selected={view.product.slug === selectedSlug}
            style="left: {chipLeftPct(view)}%"
            onclick={() => onselect(view.product.slug)}
            onfocus={() => (focusedId = view.product.id)}
            onblur={() => (focusedId = null)}
          >
            <span class="name-chip" style="--hue: {productHue(view.product)}">
              <ProductGlyph
                productId={view.product.id}
                hue={productHue(view.product)}
                size={18}
                stroke={1.15}
                wash={0.14}
              />
              {view.product.nameEs}
            </span>
            {#if markSynthetic && view.summary.containsSyntheticData}
              <span class="synthetic-tag" title="Incluye datos sintéticos de demostración"
                >SINTÉTICA</span
              >
            {/if}
            {#if view.summary.insufficientEvidence}
              <span class="insufficient-note">Datos insuficientes</span>
            {/if}
          </button>
        </div>
      {/each}

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
      {#if markSynthetic && hover.view.summary.containsSyntheticData}
        <p class="tooltip-row muted">Incluye datos sintéticos de demostración</p>
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

  <details class="reading">
    <summary>Cómo leer esta lámina</summary>
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
  </details>
</div>

<style>
  .timeline {
    position: relative;
  }

  /* Every curve wears its product's own produce-derived hue
     (src/lib/ui/palette.ts); the active concept is named in the legend
     below, and the mode toggle swaps which concept is the filled curve
     (§13, §16). */

  .scroller {
    overflow-x: auto;
    /* Crests of the first rows rise above their row boxes; never clip them. */
    overflow-y: visible;
  }

  /* Headroom for the first ridge's crest comes in as inline padding-top,
     sized to the overlap rise. */
  .rows {
    display: flex;
    flex-direction: column;
    row-gap: var(--row-gap, 14px);
    min-width: 42rem;
  }

  /* Month labels stay legible above any crest that climbs behind them. */
  .axis-cell {
    position: relative;
    z-index: 40;
  }

  .axis-cell.bottom {
    padding-top: 2px;
  }

  /* Positioned WITHOUT z-index on purpose: rows then paint in tree order
     (later rows in front — the joyplot overlap) while never becoming
     stacking contexts, which lets every name chip (z-index 2) float above
     ALL neighboring crests instead of being trapped under the next row. */
  .row {
    position: relative;
    transition: opacity 180ms ease;
  }

  .row.dimmed {
    opacity: 0.42;
  }

  /* Name chips (NOTES §5): the label lives with the data — anchored where
     the season starts, tinted by the product's hue, carrying the product's
     own drawing. Chips float above neighboring crests. */
  .name {
    appearance: none;
    border: none;
    background: none;
    font: inherit;
    cursor: pointer;
    position: absolute;
    bottom: 3px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0;
    color: var(--color-text);
    border-radius: var(--radius-chip);
  }

  .name-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-weight: 600;
    font-size: 0.9375rem;
    line-height: 1.35;
    padding: 1px var(--space-2) 1px var(--space-1);
    border-radius: var(--radius-chip);
    border: 1px solid color-mix(in oklab, var(--hue) 55%, var(--color-bg));
    background: color-mix(in oklab, var(--hue) 10%, var(--color-surface));
    white-space: nowrap;
    transition: border-color 160ms ease, background-color 160ms ease;
  }

  .name:hover .name-chip {
    border-color: var(--hue);
  }

  .name.selected .name-chip {
    border-color: var(--hue);
    box-shadow: inset 0 0 0 1px var(--hue);
  }

  /* Same warning voice as the demo banner and the detail panel's tag. */
  .synthetic-tag {
    flex: none;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #6b4d05;
    background: #fdeeca;
    border: 1px solid #e5c574;
    border-radius: 999px;
    padding: 0 var(--space-2);
  }

  /* The one confidence state that must stay on the lámina (§36): absence
     of evidence, named per product. Confidence levels for classified
     products live in the tooltip and the detail panel. */
  .insufficient-note {
    font-size: 0.75rem;
    font-weight: 600;
    color: #8a2d1f;
    white-space: nowrap;
  }

  .tooltip {
    position: fixed;
    z-index: 50;
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

  /* The encoding explanation is one click away instead of five sentences
     under the chart — the lámina explains itself through tooltips and the
     per-row text equivalents. */
  .reading {
    margin-top: var(--space-3);
  }

  .reading summary {
    display: inline-block;
    cursor: pointer;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    border-bottom: 1px dotted var(--color-text-muted);
  }

  .reading summary::-webkit-details-marker {
    display: none;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-6);
    margin: var(--space-3) 0 0;
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
