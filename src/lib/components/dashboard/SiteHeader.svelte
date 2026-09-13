<script lang="ts">
  /**
   * The masthead is the poster's title block (docs/design-references
   * NOTES §8): centered letterspaced place kicker, serif display title,
   * one quiet line — and nothing else. Everything that used to crowd it
   * (explainer paragraph, section links, dataset date, cover art) now
   * lives with the lámina below or in the page footer; the botanical
   * marginalia moved into the cascade's gutters where the reference
   * keeps them.
   */
</script>

<header class="site-header">
  <p class="kicker">Santa Cruz de la Sierra · Bolivia</p>
  <h1>Temporada Santa Cruz</h1>
  <p class="subtitle">
    Cuándo cada fruta y verdura llega con abundancia a los mercados, y cuándo
    la cosecha es cruceña.
  </p>
</header>

<style>
  .site-header {
    text-align: center;
    padding-top: var(--space-6);
    margin-bottom: var(--space-6);
  }

  /* The place kicker is part of the owner-vetted reference language
     (docs/design-references/NOTES.md §8): letterspaced small caps above
     the display title. */
  .kicker {
    font-variant-caps: all-small-caps;
    letter-spacing: 0.16em;
    font-weight: 500;
    font-size: 1rem;
    color: var(--color-text-muted);
    margin: 0 0 var(--space-1);
  }

  h1 {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1.04;
    margin: 0 0 var(--space-2);
    color: var(--color-display);
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 1.0625rem;
    max-width: 34rem;
    margin: 0 auto;
  }
</style>
