<script lang="ts">
  /**
   * A product's best available artwork: the Tier 1 historical plate when
   * the registry curates one, the original ink glyph otherwise (NOTES.md
   * illustration policy — graceful omission is valid, the layout never
   * requires an image). Plates are served from public/illustrations under
   * the app's base path; never a hard-coded root URL.
   */
  import { illustrationFor } from '../../ui/illustrations/registry'
  import ProductGlyph from './ProductGlyph.svelte'

  interface Props {
    productId: string
    /** Produce hue, used by the glyph fallback only. */
    hue: string
    /** Rendered width in px (plates keep their own aspect ratio). */
    size?: number
    /**
     * 'blend' melts the scan's paper into the page (soft, reference-style);
     * 'card' keeps the scan's own sheet visible so the caller can frame it
     * as a pasted plate — shadows only make sense with a visible edge.
     */
    frame?: 'blend' | 'card'
    stroke?: number
    wash?: number
  }

  let { productId, hue, size = 96, frame = 'blend', stroke = 1.5, wash = 0.12 }: Props = $props()

  const entry = $derived(illustrationFor(productId))
  const plateFile = $derived(
    entry?.kind === 'historical' && entry.file != null ? entry.file : null,
  )
</script>

{#if plateFile !== null && entry !== null}
  <!-- multiply blends the scan's paper white into our own paper, so the
       plate sits ON the page like the reference's watercolors instead of
       floating in a white rectangle. -->
  <img
    class="plate-img"
    class:card={frame === 'card'}
    src="{import.meta.env.BASE_URL}{plateFile}"
    alt="{entry.title} — {entry.artist}, {entry.year}"
    title="{entry.artist}, {entry.year} · {entry.license}"
    width={size}
    loading="lazy"
    decoding="async"
  />
{:else}
  <ProductGlyph {productId} {hue} {size} {stroke} {wash} />
{/if}

<style>
  .plate-img {
    display: block;
    height: auto;
    mix-blend-mode: multiply;
    filter: saturate(0.94);
  }

  /* Card framing: the scan's own sheet stays visible (warmed slightly so
     bright-white scans sit with the page) and the caller draws the edge. */
  .plate-img.card {
    mix-blend-mode: normal;
    filter: saturate(0.94) sepia(0.07) brightness(0.99);
  }
</style>
