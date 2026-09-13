<script lang="ts">
  import type { ReferenceSeason } from '../../data/types'
  import { formatReferenceRanges, REFERENCE_SEASON_ARIA_ES } from '../../domain/referenceSeason'

  interface Props {
    referenceSeason: ReferenceSeason
  }

  let { referenceSeason }: Props = $props()
</script>

<!--
  Estimated-season badge (§104). Renders IN ADDITION TO the evidence badge —
  an estimate-only product keeps "Datos insuficientes" next to this. The
  dashed outline is the estimate's texture channel: it must never look like
  an observed season class.
-->
<span class="badge" title={REFERENCE_SEASON_ARIA_ES}>
  <span class="approx" aria-hidden="true">≈</span>
  Temporada estimada (bibliografía): {formatReferenceRanges(referenceSeason.ranges)}
  <span class="visually-hidden">. {REFERENCE_SEASON_ARIA_ES}</span>
</span>

<style>
  .badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.4;
    padding: 1px var(--space-2);
    border-radius: 999px;
    border: 1px dashed var(--color-border);
    color: var(--color-text-muted);
    background: transparent;
  }

  .approx {
    font-weight: 700;
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
