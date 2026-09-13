<!--
  Demo-data banner (PROJECT.md §45, §79): shown whenever the published
  dataset contains ANY synthetic record. Synthetic data must be impossible
  to mistake for researched fact. In the mixed real+demo state the copy
  narrows its claim and points at the per-product DE EJEMPLO markers.
  Display copy says "de ejemplo" (plain Spanish), never "sintético" —
  §103: non-technical viewers read SINTÉTICA as artificial produce.
-->
<script lang="ts">
  interface Props {
    /** True when real and synthetic records coexist in the dataset. */
    partial?: boolean
  }

  let { partial = false }: Props = $props()
</script>

<p class="demo-banner" role="status">
  {#if partial}
    <strong>ALGUNOS DATOS SON DE EJEMPLO</strong> — todavía no hay observaciones reales
    detrás de algunos valores; los productos afectados llevan la marca DE EJEMPLO.
  {:else}
    <strong>DATOS DE EJEMPLO</strong> — los valores mostrados son de ejemplo y no
    describen ningún mercado real.
  {/if}
</p>

<style>
  /* Unmistakable but not the headline: a centered notice ribbon in the
     same warning voice, sized to its words instead of the full page. */
  .demo-banner {
    display: table;
    margin: 0 auto var(--space-2);
    max-width: 46rem;
    text-align: center;
    background: #fdeeca;
    border: 1px solid #e5c574;
    color: #6b4d05;
    font-size: 0.8125rem;
    letter-spacing: 0.01em;
    padding: var(--space-1) var(--space-4);
    border-radius: var(--radius-chip);
  }
</style>
