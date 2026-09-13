<script lang="ts">
  import { MONTH_SHORT_ES, monthAxisTicks } from '../../domain/months'

  // The 52-week grid spans 364 day-units (52 × 7); labels sit at each
  // month's start. Rendered as HTML so text never stretches with the SVG
  // strips below it.
  const ticks = monthAxisTicks()
</script>

<div class="axis" aria-hidden="true">
  {#each ticks as tick (tick.month)}
    <span class="tick" style="left: {(tick.x / 364) * 100}%">
      {MONTH_SHORT_ES[tick.month - 1]}
    </span>
  {/each}
</div>

<style>
  .axis {
    position: relative;
    height: 1.25rem;
    font-size: 0.6875rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .tick {
    position: absolute;
    top: 0;
    padding-left: 3px;
    border-left: 1px solid var(--color-border);
    line-height: 1.25rem;
    white-space: nowrap;
  }
</style>
