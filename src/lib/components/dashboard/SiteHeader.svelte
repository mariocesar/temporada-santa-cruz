<script lang="ts">
  interface Props {
    /** Latest observation date across the dataset (§47), pre-formatted. */
    dataUpdatedAt: string | null
  }

  let { dataUpdatedAt }: Props = $props()
</script>

<header class="site-header">
  <p class="kicker">Santa Cruz de la Sierra · Bolivia</p>
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
  {#if dataUpdatedAt}
    <p class="meta">Datos actualizados hasta: {dataUpdatedAt}</p>
  {/if}
</header>

<style>
  .site-header {
    margin-bottom: var(--space-8);
    padding-top: var(--space-4);
  }

  /* The place kicker is part of the owner-vetted reference language
     (docs/design-references/NOTES.md §8): letterspaced small caps above
     the display title. */
  .kicker {
    font-variant-caps: all-small-caps;
    letter-spacing: 0.14em;
    font-weight: 500;
    font-size: 1rem;
    color: var(--color-text-muted);
    margin: 0 0 var(--space-1);
  }

  .title-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-2) var(--space-6);
  }

  h1 {
    font-size: clamp(2.25rem, 5.5vw, 3.25rem);
    font-weight: 800;
    line-height: 1.08;
    margin: 0 0 var(--space-3);
    color: var(--color-display);
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 1.0625rem;
    max-width: 42rem;
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
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin: var(--space-3) 0 0;
  }
</style>
