<script lang="ts">
  import type { DataSource } from '../../data/types'
  import { artCredits, renderableIllustrations } from '../../ui/illustrations/registry'

  interface Props {
    sources: ReadonlyArray<DataSource>
  }

  let { sources }: Props = $props()

  // Artwork gets the same provenance treatment as data
  // (docs/design-references/NOTES.md, illustration policy §4).
  const credits = artCredits()
  const renderable = renderableIllustrations()
  const artCount = renderable.length
  const historicalCount = renderable.filter((e) => e.kind === 'historical').length
  const originalCount = artCount - historicalCount

  function originalName(source: DataSource): string | null {
    if (source.kind !== 'mirror' || !source.mirrorOf) return null
    return sources.find((s) => s.id === source.mirrorOf)?.name ?? source.mirrorOf
  }
</script>

<section id="fuentes" class="sources-section" aria-labelledby="sources-title">
  <h2 id="sources-title">Fuentes de datos</h2>
  <p class="intro">
    Cada valor derivado del panel es trazable a observaciones de estas fuentes.
    Los espejos dan acceso a material original pero no cuentan como evidencia
    independiente.
  </p>

  <ul class="cards">
    {#each sources as source (source.id)}
      <li class="card">
        <h3>
          {source.name}
          {#if source.synthetic}
            <span class="synthetic-tag">DE EJEMPLO (DEMO)</span>
          {/if}
        </h3>
        <p class="publisher">{source.publisher}</p>
        {#if source.description}
          <p class="description">{source.description}</p>
        {/if}
        {#if source.coverageStart || source.coverageEnd}
          <p class="meta">
            Cobertura: {source.coverageStart ?? '…'} – {source.coverageEnd ?? '…'}
          </p>
        {/if}
        {#if originalName(source)}
          <p class="meta">Espejo de: {originalName(source)}</p>
        {/if}
        {#if source.methodologyNotes}
          <p class="meta">Uso en el modelo: {source.methodologyNotes}</p>
        {/if}
        {#if source.licenseNotes}
          <p class="meta">Licencia y límites: {source.licenseNotes}</p>
        {/if}
        {#if source.url}
          <p class="link">
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.url}
            </a>
          </p>
        {/if}
      </li>
    {/each}
  </ul>

  {#if credits.length > 0}
    <div class="art-credits">
      <h3 class="art-title">Ilustraciones</h3>
      <p>
        De las {artCount} ilustraciones botánicas del panel,
        {historicalCount}
        {historicalCount === 1 ? 'es una lámina histórica' : 'son láminas históricas'}
        de dominio público y {originalCount}
        {originalCount === 1 ? 'es un dibujo vectorial original' : 'son dibujos vectoriales originales'}.
        Son decorativas: no codifican temporada, confianza ni evidencia.
      </p>
      <ul>
        {#each credits as credit (`${credit.artist}|${credit.year}|${credit.license}|${credit.sourceUrl ?? ''}`)}
          <li>
            {credit.artist}, {credit.year} — {credit.license} ({credit.count}
            {credit.count === 1 ? 'lámina' : 'láminas'})
            {#if credit.sourceUrl}
              ·
              <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">
                Original
              </a>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .sources-section {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-6);
    margin-bottom: var(--space-8);
  }

  h2 {
    font-size: 1.5rem;
    margin: 0 0 var(--space-3);
  }

  .intro {
    color: var(--color-text-muted);
    max-width: 48rem;
  }

  .cards {
    list-style: none;
    margin: var(--space-4) 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: var(--space-4);
  }

  .card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    padding: var(--space-4);
  }

  h3 {
    font-size: 1rem;
    margin: 0 0 var(--space-1);
  }

  .synthetic-tag {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #6b4d05;
    background: #fdeeca;
    border: 1px solid #e5c574;
    border-radius: 999px;
    padding: 0 var(--space-2);
    margin-left: var(--space-1);
    vertical-align: middle;
    white-space: nowrap;
  }

  .publisher {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin: 0 0 var(--space-2);
  }

  .description {
    font-size: 0.9375rem;
    margin: 0 0 var(--space-2);
  }

  .meta {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    margin: 0 0 var(--space-1);
  }

  .link {
    margin: var(--space-2) 0 0;
    font-size: 0.8125rem;
    overflow-wrap: anywhere;
  }

  .link a {
    color: var(--color-accent);
  }

  .art-credits {
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    max-width: 44rem;
  }

  .art-title {
    font-size: 1rem;
    color: var(--color-text);
    margin: 0 0 var(--space-2);
  }

  .art-credits p {
    margin: 0 0 var(--space-2);
  }

  .art-credits ul {
    margin: 0;
    padding-left: var(--space-4);
  }

  .art-credits a {
    color: var(--color-accent);
  }
</style>
