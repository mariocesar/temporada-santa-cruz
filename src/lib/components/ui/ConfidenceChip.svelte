<script lang="ts">
  import type { ProductSeasonSummary } from '../../data/types'
  import { CONFIDENCE_TEXT } from '../../i18n/labels'

  interface Props {
    summary: ProductSeasonSummary
  }

  let { summary }: Props = $props()
</script>

{#if summary.insufficientEvidence}
  <span class="chip insufficient">Datos insuficientes</span>
{:else}
  <span class="chip level-{summary.confidenceLabel}">
    Confianza {CONFIDENCE_TEXT[summary.confidenceLabel].toLowerCase()}
  </span>
{/if}

<style>
  .chip {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.3;
    padding: 1px var(--space-2);
    border-radius: 999px;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    background: var(--color-surface);
    white-space: nowrap;
  }

  .level-alta {
    border-color: #b9cfae;
    background: #eef4e8;
    color: #3c5a33;
  }

  .level-media {
    border-color: #d9c68e;
    background: #f8f1dd;
    color: #6b5716;
  }

  .insufficient {
    border-color: #ddb6ab;
    background: #f9ece8;
    color: #8a2d1f;
  }
</style>
