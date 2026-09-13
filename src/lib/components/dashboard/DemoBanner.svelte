<!--
  Demo-data banner (PROJECT.md §45, §79): shown whenever the published
  dataset contains ANY synthetic record. Synthetic data must be impossible
  to mistake for researched fact. In the mixed real+demo state the copy
  narrows its claim and points at the per-product SINTÉTICA markers.
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
    <strong>DATOS PARCIALMENTE SINTÉTICOS</strong> — algunos valores son sintéticos de
    demostración y no describen ningún mercado real; los productos afectados llevan la
    marca SINTÉTICA.
  {:else}
    <strong>DATOS DE DEMOSTRACIÓN</strong> — los valores mostrados son sintéticos y no
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
