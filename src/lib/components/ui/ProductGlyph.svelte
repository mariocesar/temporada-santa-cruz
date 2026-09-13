<script lang="ts">
  /**
   * One botanical line-art glyph (src/lib/ui/illustrations/glyphs.ts).
   *
   * Decoration only: a glyph never encodes season, confidence, or evidence,
   * and a product without curated art simply renders nothing — no layout
   * depends on an illustration existing (NOTES.md illustration policy §3).
   * Default `aria-hidden`; the product name is always written beside it.
   */
  import { GLYPH_VIEWBOX, glyphFor } from '../../ui/illustrations/glyphs'

  interface Props {
    productId: string
    /** Produce-derived hue; the glyph is drawn entirely in it. */
    hue?: string
    /** Rendered box in px (the grid is square). */
    size?: number
    /** Ink weight in device px — hairlines stay hairlines at any size. */
    stroke?: number
    /** Faint hue wash inside closed silhouettes, 0–1. */
    wash?: number
  }

  let {
    productId,
    hue = 'currentColor',
    size = 24,
    stroke = 1.5,
    wash = 0.1,
  }: Props = $props()

  const glyph = $derived(glyphFor(productId))

  // Clip paths are document-global; every instance needs its own id.
  const uid = $props.id()
  const clipId = $derived(`glyph-clip-${uid}`)
</script>

{#if glyph}
  <svg
    class="glyph"
    viewBox="0 0 {GLYPH_VIEWBOX} {GLYPH_VIEWBOX}"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
    style="--glyph-hue: {hue}; --glyph-stroke: {stroke}; --glyph-wash: {wash}"
  >
    {#if glyph.clip}
      <defs>
        <clipPath id={clipId}>
          <path d={glyph.shapes[0]} />
        </clipPath>
      </defs>
    {/if}

    {#each glyph.shapes as d, i (i)}
      <path class="shape" {d} />
    {/each}

    <g clip-path={glyph.clip ? `url(#${clipId})` : undefined}>
      {#each glyph.lines ?? [] as d, i (i)}
        <path class="line" {d} />
      {/each}
      {#each glyph.dots ?? [] as dot, i (i)}
        <circle class="dot" cx={dot[0]} cy={dot[1]} r={dot[2]} />
      {/each}
    </g>
  </svg>
{/if}

<style>
  .glyph {
    display: block;
    overflow: visible;
    stroke: var(--glyph-hue);
    stroke-width: var(--glyph-stroke);
    stroke-linecap: round;
    stroke-linejoin: round;
    /* Hairline ink at 16 px and at 120 px alike. */
    vector-effect: non-scaling-stroke;
  }

  .glyph :where(path, circle) {
    vector-effect: non-scaling-stroke;
  }

  .shape {
    fill: var(--glyph-hue);
    fill-opacity: var(--glyph-wash);
  }

  .line {
    fill: none;
  }

  .dot {
    fill: var(--glyph-hue);
    fill-opacity: 0.55;
    stroke: none;
  }
</style>
