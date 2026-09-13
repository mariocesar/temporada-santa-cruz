<script lang="ts">
  interface Props {
    /** Latest observation date across the dataset (§47), pre-formatted. */
    dataUpdatedAt: string | null
  }

  let { dataUpdatedAt }: Props = $props()
</script>

<header class="site-header">
  <div class="title-row">
    <div>
      <h1>Temporada Santa Cruz</h1>
      <p class="subtitle">
        Descubre cuándo los productos llegan con mayor abundancia a los mercados de
        Santa Cruz, cuándo provienen de productores cruceños y qué tan confiables
        son los datos.
      </p>
    </div>
    <nav aria-label="Secciones informativas">
      <a href="#metodologia">Metodología</a>
      <a href="#fuentes">Fuentes</a>
    </nav>
  </div>
  <p class="meta">
    <span>Mercados de Santa Cruz de la Sierra, Bolivia</span>
    {#if dataUpdatedAt}
      <span aria-hidden="true">·</span>
      <span>Datos actualizados hasta: {dataUpdatedAt}</span>
    {/if}
  </p>
</header>

<style>
  .site-header {
    margin-bottom: var(--space-8);
  }

  .title-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-2) var(--space-6);
  }

  h1 {
    font-size: clamp(1.75rem, 4vw, 2.375rem);
    line-height: 1.15;
    margin: 0 0 var(--space-2);
    letter-spacing: -0.01em;
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 1.0625rem;
    max-width: 44rem;
    margin: 0;
  }

  nav {
    display: flex;
    gap: var(--space-4);
  }

  nav a {
    color: var(--color-accent);
    font-weight: 600;
    font-size: 0.9375rem;
    text-decoration: none;
  }

  nav a:hover {
    text-decoration: underline;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin: var(--space-3) 0 0;
  }
</style>
