<script lang="ts" generics="T extends string">
  interface Props {
    options: ReadonlyArray<{ value: T; label: string }>
    value: T
    /** Accessible name for the whole control. */
    label: string
    onChange: (value: T) => void
  }

  let { options, value, label, onChange }: Props = $props()
</script>

<div class="segmented" role="group" aria-label={label}>
  {#each options as option (option.value)}
    <button
      type="button"
      class:active={option.value === value}
      aria-pressed={option.value === value}
      onclick={() => onChange(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: inline-flex;
    flex-wrap: wrap;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    padding: 2px;
    gap: 2px;
  }

  button {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    padding: var(--space-1) var(--space-3);
    border-radius: 0.375rem;
    cursor: pointer;
  }

  button:hover {
    color: var(--color-text);
  }

  button.active {
    background: var(--color-accent);
    color: #fff;
  }
</style>
