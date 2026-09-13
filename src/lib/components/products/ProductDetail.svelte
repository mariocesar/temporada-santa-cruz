<script lang="ts">
  import type { DataSource } from '../../data/types'
  import {
    confidenceExplanation,
    localShareOfKnown,
    signalContributions,
    stateAt,
    type ProductView,
  } from '../../data/views'
  import { formatRangesAsMonths, MONTH_NAMES_ES, monthOfWeekBin } from '../../domain/months'
  import { CATEGORY_LABEL, CONFIDENCE_TEXT, SEASON_STATE_LABEL } from '../../i18n/labels'
  import ConfidenceChip from '../ui/ConfidenceChip.svelte'
  import MonthAxis from '../charts/MonthAxis.svelte'
  import SeasonStrip from '../charts/SeasonStrip.svelte'

  interface Props {
    view: ProductView
    sources: ReadonlyArray<DataSource>
    referenceWeek: number
    onclose: () => void
  }

  let { view, sources, referenceWeek, onclose }: Props = $props()

  let closeButton = $state<HTMLButtonElement | null>(null)
  $effect(() => {
    closeButton?.focus()
  })

  const longDate = new Intl.DateTimeFormat('es-BO', { dateStyle: 'long', timeZone: 'UTC' })
  const monthYear = new Intl.DateTimeFormat('es-BO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  function fmtDate(iso: string | undefined, formatter: Intl.DateTimeFormat): string | null {
    if (!iso) return null
    return formatter.format(new Date(`${iso}T00:00:00Z`))
  }

  const summary = $derived(view.summary)
  const product = $derived(view.product)

  const marketState = $derived(stateAt(view, 'mercado', referenceWeek))
  const localState = $derived(stateAt(view, 'local', referenceWeek))

  const localShare = $derived(localShareOfKnown(summary))
  const signals = $derived(signalContributions(view))

  const productSources = $derived(
    summary.sourceIds
      .map((id) => sources.find((s) => s.id === id))
      .filter((s): s is DataSource => s !== undefined),
  )

  // Relative-price sparkline (§54): only when units are comparable, and it
  // plots the derived price SIGNAL (1 = precios bajos para el año), never
  // nominal Bs values across years.
  const PRICE_W = 364
  const PRICE_H = 56
  const pricePath = $derived.by(() => {
    if (!summary.priceComparable) return null
    const segments: string[] = []
    let current: string[] = []
    view.weekly.forEach((w, i) => {
      const score = w?.relativePriceScore ?? null
      if (score === null) {
        if (current.length > 1) segments.push(`M ${current.join(' L ')}`)
        current = []
        return
      }
      const x = i * 7 + 3.5
      const y = 4 + (1 - score) * (PRICE_H - 8)
      current.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    })
    if (current.length > 1) segments.push(`M ${current.join(' L ')}`)
    return segments.length > 0 ? segments.join(' ') : null
  })

  const stats = $derived(
    [
      { label: 'Observaciones', value: String(summary.observationCount) },
      { label: 'Años con datos', value: String(summary.yearsCovered) },
      { label: 'Fuentes independientes', value: String(summary.evidence.independentSources) },
      {
        label: 'Primera observación',
        value: fmtDate(summary.firstObservation, longDate),
      },
      {
        label: 'Última observación',
        value: fmtDate(summary.lastObservation, monthYear),
      },
      {
        label: 'Cobertura del año',
        value: `${Math.round(summary.evidence.weekCoverage * 100)} % de las semanas`,
      },
    ].filter((s): s is { label: string; value: string } => s.value !== null),
  )
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') onclose()
  }}
/>

<button class="backdrop" aria-label="Cerrar panel de producto" onclick={onclose}></button>

<div class="panel" role="dialog" aria-modal="false" aria-labelledby="detail-title">
  <header class="panel-head">
    <div>
      <h2 id="detail-title">{product.nameEs}</h2>
      {#if product.scientificName}
        <p class="scientific">{product.scientificName}</p>
      {/if}
      <p class="identity">
        {CATEGORY_LABEL[product.category]}
        {#if product.varieties && product.varieties.length > 0}
          · Variedades: {product.varieties.join(', ')}
        {/if}
      </p>
      {#if product.aliases.length > 1}
        <p class="identity">También: {product.aliases.join(', ')}</p>
      {/if}
    </div>
    <button
      type="button"
      class="close"
      onclick={onclose}
      bind:this={closeButton}
      aria-label="Cerrar panel"
    >
      ✕
    </button>
  </header>

  {#if summary.containsSyntheticData}
    <p class="synthetic-chip" role="status">
      Incluye datos sintéticos de demostración — no describe un mercado real.
    </p>
  {/if}

  <section aria-labelledby="detail-now">
    <h3 id="detail-now">
      Semana {referenceWeek} · {MONTH_NAMES_ES[monthOfWeekBin(referenceWeek) - 1]}
    </h3>
    <p>
      Mercado: <strong>{SEASON_STATE_LABEL[marketState]}</strong><br />
      Producción cruceña: <strong>{SEASON_STATE_LABEL[localState]}</strong>
    </p>
  </section>

  {#if summary.insufficientEvidence}
    <section aria-labelledby="detail-insufficient">
      <h3 id="detail-insufficient">Datos insuficientes</h3>
      <p>
        La evidencia disponible no alcanza para clasificar la temporada de este
        producto. {confidenceExplanation(summary)}
      </p>
    </section>
  {:else}
    <section aria-labelledby="detail-summary">
      <h3 id="detail-summary">Resumen</h3>
      <p>
        {#if summary.marketSeasonRanges.length > 0}
          Mejor disponibilidad en mercado: <strong>{formatRangesAsMonths(summary.marketSeasonRanges)}</strong>.
        {/if}
        {#if summary.localSeasonRanges.length > 0}
          Temporada de producción cruceña: <strong>{formatRangesAsMonths(summary.localSeasonRanges)}</strong>.
        {/if}
        {#if localShare !== null}
          El {Math.round(localShare * 100)} % de las observaciones con procedencia
          conocida proviene del departamento de Santa Cruz.
        {/if}
      </p>
    </section>

    <section aria-labelledby="detail-timeline">
      <h3 id="detail-timeline">Temporada a lo largo del año</h3>
      <MonthAxis />
      <div class="strip-block season-mercado">
        <p class="strip-label">Mercado</p>
        <SeasonStrip
          primary={view.marketSeries}
          markerWeek={referenceWeek}
          height={20}
          label={`Temporada de mercado: ${summary.marketSeasonRanges.length > 0 ? formatRangesAsMonths(summary.marketSeasonRanges) : 'sin temporada marcada'}`}
        />
      </div>
      <div class="strip-block season-local">
        <p class="strip-label">Producción cruceña</p>
        <SeasonStrip
          primary={view.localSeries}
          markerWeek={referenceWeek}
          height={20}
          label={`Temporada de producción cruceña: ${summary.localSeasonRanges.length > 0 ? formatRangesAsMonths(summary.localSeasonRanges) : 'sin temporada marcada'}`}
        />
      </div>
    </section>
  {/if}

  <section aria-labelledby="detail-observations">
    <h3 id="detail-observations">Observaciones históricas</h3>
    <dl class="stats">
      {#each stats as stat (stat.label)}
        <div>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section aria-labelledby="detail-origin">
    <h3 id="detail-origin">Procedencia</h3>
    {#if summary.primaryOrigins.length > 0}
      <ul class="origins">
        {#each summary.primaryOrigins as origin (origin.originId)}
          <li>
            <span class="origin-label">
              {origin.label}
              {#if origin.isLocal}<span class="local-tag">Santa Cruz</span>{/if}
            </span>
            <span class="origin-bar" aria-hidden="true">
              <span class="origin-fill" style="width: {Math.round(origin.share * 100)}%"></span>
            </span>
            <span class="origin-share">{Math.round(origin.share * 100)} %</span>
          </li>
        {/each}
      </ul>
      {#if summary.evidence.originKnownRatio !== null}
        <p class="note">
          Porcentajes sobre las observaciones con procedencia conocida
          ({Math.round(summary.evidence.originKnownRatio * 100)} % del total).
        </p>
      {/if}
    {:else}
      <p class="note">Sin datos de procedencia para este producto.</p>
    {/if}
  </section>

  <section aria-labelledby="detail-price">
    <h3 id="detail-price">Comportamiento de precio</h3>
    {#if pricePath}
      <svg
        class="price-chart"
        viewBox="0 0 {PRICE_W} {PRICE_H}"
        preserveAspectRatio="none"
        role="img"
        aria-label="Señal de precio relativo por semana del año. Valores altos indican precios por debajo de lo normal del año (mayor oferta)."
      >
        <path d={pricePath} />
      </svg>
      <p class="note">
        Señal de precio relativo por semana: alto = precios por debajo de lo normal
        del propio año (mayor oferta). No son precios nominales.
      </p>
    {:else}
      <p class="note">
        No se calcula una tendencia de precio porque las unidades históricas no
        son comparables.
      </p>
    {/if}
  </section>

  <section aria-labelledby="detail-evidence">
    <h3 id="detail-evidence">Señales que aportaron evidencia</h3>
    <ul class="signals">
      {#each signals as signal (signal.key)}
        <li class:off={!signal.contributed}>
          <span aria-hidden="true">{signal.contributed ? '✓' : '—'}</span>
          {signal.label}
          <span class="visually-hidden">{signal.contributed ? 'aportó' : 'no aportó'}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="detail-confidence">
    <h3 id="detail-confidence">Confianza</h3>
    <p class="confidence-line">
      <ConfidenceChip {summary} />
      {#if !summary.insufficientEvidence}
        <span class="visually-hidden">Nivel: {CONFIDENCE_TEXT[summary.confidenceLabel]}.</span>
      {/if}
    </p>
    <p class="note">{confidenceExplanation(summary)}</p>
  </section>

  <section aria-labelledby="detail-sources">
    <h3 id="detail-sources">Fuentes de estos datos</h3>
    <ul class="sources">
      {#each productSources as source (source.id)}
        <li>
          {#if source.url}
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>
          {:else}
            {source.name}
          {/if}
          {#if source.synthetic}
            <span class="synthetic-tag">SINTÉTICA</span>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="note">
      Ver la sección <a href="#fuentes" onclick={onclose}>Fuentes</a> para el
      detalle de cada una.
    </p>
  </section>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    background: rgb(43 39 33 / 0.35);
    border: none;
    cursor: default;
    padding: 0;
    appearance: none;
  }

  .panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 21;
    width: min(28rem, 100%);
    overflow-y: auto;
    background: var(--color-bg);
    border-left: 1px solid var(--color-border);
    padding: var(--space-6) var(--space-4) var(--space-8);
    box-shadow: -8px 0 32px rgb(0 0 0 / 0.12);
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  h2 {
    font-size: 1.5rem;
    margin: 0;
  }

  .scientific {
    font-style: italic;
    color: var(--color-text-muted);
    margin: 0;
  }

  .identity {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin: var(--space-1) 0 0;
  }

  .close {
    appearance: none;
    font: inherit;
    font-size: 1rem;
    line-height: 1;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    width: 2rem;
    height: 2rem;
    flex: 0 0 auto;
    cursor: pointer;
    color: var(--color-text-muted);
  }

  .close:hover {
    color: var(--color-text);
    border-color: var(--color-text-muted);
  }

  .synthetic-chip {
    background: #fdeeca;
    border: 1px solid #e5c574;
    color: #6b4d05;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: var(--space-2) var(--space-3);
    border-radius: 0.375rem;
    margin: 0 0 var(--space-4);
  }

  section {
    margin-bottom: var(--space-6);
  }

  h3 {
    font-size: 1rem;
    margin: 0 0 var(--space-2);
  }

  .strip-block {
    margin-top: var(--space-2);
  }

  .strip-label {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin: 0 0 2px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
    margin: 0;
  }

  .stats dt {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .stats dd {
    margin: 0;
    font-weight: 600;
  }

  .origins {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }

  .origins li {
    display: grid;
    grid-template-columns: minmax(8rem, max-content) 1fr max-content;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.875rem;
  }

  .local-tag {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #3c5a33;
    background: #eef4e8;
    border: 1px solid #b9cfae;
    border-radius: 999px;
    padding: 0 var(--space-2);
    margin-left: var(--space-1);
  }

  .origin-bar {
    display: block;
    height: 0.5rem;
    background: var(--season-track);
    border-radius: 999px;
    overflow: hidden;
  }

  .origin-fill {
    display: block;
    height: 100%;
    background: var(--color-accent);
    border-radius: 999px;
  }

  .origin-share {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
  }

  .price-chart {
    width: 100%;
    height: 56px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
  }

  .price-chart path {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }

  .signals {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-1);
    font-size: 0.9375rem;
  }

  .signals li.off {
    color: var(--color-text-muted);
  }

  .confidence-line {
    margin: 0 0 var(--space-2);
  }

  .sources {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-1);
    font-size: 0.9375rem;
  }

  .sources a,
  .note a {
    color: var(--color-accent);
  }

  .synthetic-tag {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #6b4d05;
    background: #fdeeca;
    border: 1px solid #e5c574;
    border-radius: 999px;
    padding: 0 var(--space-2);
    margin-left: var(--space-1);
  }

  .note {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    margin: var(--space-2) 0 0;
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
