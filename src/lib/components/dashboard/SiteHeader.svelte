<script lang="ts">
  /**
   * The masthead is the poster (docs/design-references/NOTES.md §7–§8):
   * letterspaced place kicker, serif display title, and botanical drawings
   * in the margin.
   *
   * The marginalia are not stock ornament — they are the products at their
   * peak in the reference week, so the cover art turns over with the year.
   * They restate what the "Ahora" section says below; they never assert
   * anything on their own, and products without evidence never appear.
   */
  import type { ProductView } from '../../data/views'
  import { productHue } from '../../ui/palette'
  import ProductGlyph from '../ui/ProductGlyph.svelte'

  interface Props {
    /** Latest observation date across the dataset (§47), pre-formatted. */
    dataUpdatedAt: string | null
    /** Products at peak in the reference week; empty until data loads. */
    featured?: ReadonlyArray<ProductView>
    /** Caption tying the drawings to the week they describe. */
    featuredCaption?: string
  }

  let { dataUpdatedAt, featured = [], featuredCaption = '' }: Props = $props()

  const MAX_FEATURED = 5
  const shown = $derived(featured.slice(0, MAX_FEATURED))

  const artLabel = $derived(
    shown.length > 0
      ? `Ilustraciones de ${shown.map((v) => v.product.nameEs).join(', ')}`
      : '',
  )
</script>

<header class="site-header">
  <div class="masthead">
    <div class="masthead-text">
      <p class="kicker">Santa Cruz de la Sierra · Bolivia</p>
      <h1>Temporada Santa Cruz</h1>
      <p class="subtitle">
        Descubre cuándo los productos llegan con mayor abundancia a los mercados de
        Santa Cruz, cuándo provienen de productores cruceños y qué tan confiables
        son los datos.
      </p>
      <nav aria-label="Secciones informativas">
        <a href="#metodologia">Metodología</a>
        <a href="#fuentes">Fuentes</a>
      </nav>
    </div>

    {#if shown.length > 0}
      <figure class="masthead-art">
        {#if featuredCaption !== ''}
          <figcaption>{featuredCaption}</figcaption>
        {/if}
        <div class="art-row" role="img" aria-label={artLabel}>
          {#each shown as view, i (view.product.id)}
            <span
              class="art-item"
              style="--i: {i}; --lift: {i % 2 === 1 ? -8 : 0}px; --rot: {(i - 2) * 2.5}deg"
            >
              <ProductGlyph
                productId={view.product.id}
                hue={productHue(view.product)}
                size={88}
                stroke={1.4}
                wash={0.13}
              />
            </span>
          {/each}
        </div>
      </figure>
    {/if}
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

  .masthead {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-6);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .masthead-text {
    flex: 1 1 22rem;
    min-width: 0;
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

  h1 {
    font-size: clamp(2.25rem, 5.5vw, 3.5rem);
    font-weight: 800;
    line-height: 1.04;
    margin: 0 0 var(--space-3);
    color: var(--color-display);
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 1.0625rem;
    max-width: 40rem;
    margin: 0;
  }

  nav {
    display: flex;
    gap: var(--space-4);
    margin-top: var(--space-3);
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

  .masthead-art {
    margin: 0;
    flex: 0 1 auto;
    text-align: right;
  }

  .art-row {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
  }

  /* Drawings sit on a hand-set baseline: alternating lift and a degree of
     rotation, the way plates are pasted into an almanac. */
  .art-item {
    display: block;
    opacity: 0.85;
    transform: translateY(var(--lift, 0px)) rotate(var(--rot, 0deg));
    animation: art-settle 620ms cubic-bezier(0.22, 0.7, 0.28, 1) both;
    animation-delay: calc(var(--i) * 80ms);
  }

  @keyframes art-settle {
    from {
      opacity: 0;
      transform: translateY(10px) rotate(0deg);
    }
  }

  figcaption {
    margin-bottom: var(--space-2);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    font-variant-caps: all-small-caps;
    letter-spacing: 0.09em;
  }

  .meta {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin: var(--space-3) 0 0;
  }

  @media (max-width: 40rem) {
    .masthead-art {
      text-align: left;
    }

    .art-row {
      justify-content: flex-start;
    }
  }
</style>
