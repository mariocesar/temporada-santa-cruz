<script lang="ts">
  import {
    EVIDENCE,
    LOCAL_SCORE_WEIGHTS,
    MARKET_SCORE_WEIGHTS,
    SEASON_CLASS_THRESHOLDS,
  } from '../../domain/methodology'

  // The displayed numbers come straight from the methodology constants —
  // the single source of truth — so prose can never drift from the model.
  const pct = (v: number) => `${Math.round(v * 100)} %`
</script>

<section id="metodologia" class="methodology" aria-labelledby="methodology-title">
  <h2 id="methodology-title">Metodología</h2>
  <p class="intro">
    Este panel se construye solo con datos históricos públicos de mercados de
    Santa Cruz. Distingue tres conceptos que nunca se mezclan:
  </p>

  <dl class="concepts">
    <div>
      <dt>Disponible</dt>
      <dd>El producto aparece habitualmente en los mercados de Santa Cruz.</dd>
    </div>
    <div>
      <dt>En temporada</dt>
      <dd>
        El producto está históricamente abundante o barato en relación con sus
        propias condiciones normales de mercado.
      </dd>
    </div>
    <div>
      <dt>Temporada local</dt>
      <dd>
        La oferta proviene principalmente de productores del departamento de
        Santa Cruz.
      </dd>
    </div>
  </dl>

  <h3>¿Qué significa "en temporada"?</h3>
  <p>
    Que un producto esté <em>en temporada de mercado</em> significa que, según los
    reportes históricos, en esas semanas suele haber más oferta y mejores precios
    que en el resto del año <strong>para ese mismo producto</strong>. Una fruta
    importada puede estar disponible todo el año sin tener temporada local; un
    banano puede estar siempre disponible y aun así tener semanas de mayor oferta.
  </p>

  <h3>¿Qué significa "local"?</h3>
  <p>
    <em>Producción cruceña</em> significa que la procedencia registrada de la
    oferta es el departamento de Santa Cruz (incluidos, por ejemplo, los Valles
    Cruceños o el Norte Integrado). Un producto puede estar en temporada de
    mercado con oferta traída de otros departamentos o países: por eso ambos
    conceptos se muestran por separado.
  </p>

  <h3>¿Cómo calculamos la temporada?</h3>
  <p>Para cada producto y semana del año (semanas ISO, con el año tratado como un ciclo donde diciembre y enero son adyacentes) combinamos señales de los reportes históricos:</p>
  <ul>
    <li>
      <strong>Presencia en mercado</strong> — en cuántos de los años observados el
      producto aparece reportado esa semana ({pct(MARKET_SCORE_WEIGHTS.presence)} del
      puntaje de mercado).
    </li>
    <li>
      <strong>Nivel de oferta</strong> — la clasificación Escasa / Normal /
      Abundante de los reportes ({pct(MARKET_SCORE_WEIGHTS.availability)}).
    </li>
    <li>
      <strong>Precio relativo</strong> — el precio de la semana comparado con lo
      normal del mismo año, solo entre unidades comparables
      ({pct(MARKET_SCORE_WEIGHTS.price)}).
    </li>
    <li>
      <strong>Procedencia</strong> — para la temporada local, qué fracción de la
      oferta con origen conocido es cruceña ({pct(LOCAL_SCORE_WEIGHTS.localShare)} del
      puntaje local).
    </li>
    <li>
      <strong>Calendario de cosecha</strong> — cuando exista, el calendario
      agrícola actúa como señal complementaria ({pct(LOCAL_SCORE_WEIGHTS.harvest)}).
    </li>
  </ul>
  <p>
    El puntaje semanal se suaviza a lo largo del ciclo anual y se clasifica:
    <strong>pico</strong> desde {pct(SEASON_CLASS_THRESHOLDS.peakMin)},
    <strong>en temporada</strong> desde {pct(SEASON_CLASS_THRESHOLDS.inSeasonMin)} y
    <strong>oferta ocasional</strong> desde {pct(SEASON_CLASS_THRESHOLDS.occasionalMin)}.
    "Entrando" y "saliendo" se detectan comparando semanas vecinas.
  </p>

  <h3>¿Qué significa la confianza?</h3>
  <p>
    La confianza es independiente del puntaje de temporada: mide cuánta evidencia
    hay, no qué tan fuerte es la temporada. Depende de la cantidad de
    observaciones, los años cubiertos, las fuentes independientes, la cobertura de
    procedencia y qué tanto coinciden los años entre sí. Con menos de
    {EVIDENCE.minObservations} observaciones o menos de {EVIDENCE.minYears} años de
    datos preferimos decir <strong>"Datos insuficientes"</strong> antes que
    inventar certeza. Que falte un reporte no es evidencia de que un producto
    estuvo ausente.
  </p>

  <h3>Limitaciones</h3>
  <ul>
    <li>Faltan reportes históricos: hay semanas y años sin datos.</li>
    <li>La cobertura de mercados de las fuentes cambió con el tiempo.</li>
    <li>Unidades históricas inconsistentes (caja, bolsa, cien) que no siempre se pueden comparar.</li>
    <li>Los datos censales agrícolas disponibles son antiguos.</li>
    <li>Bloqueos, eventos logísticos y shocks de precios distorsionan semanas puntuales.</li>
    <li>La oferta importada puede confundirse con oferta local cuando la procedencia no fue registrada.</li>
    <li>La procedencia es incompleta en parte de las observaciones.</li>
  </ul>

  <p class="technical">
    Detalle técnico completo: constantes del modelo, pesos y umbrales están
    documentados en el
    <a
      href="https://github.com/mariocesar/temporada-santa-cruz"
      target="_blank"
      rel="noopener noreferrer">repositorio del proyecto</a
    >.
  </p>
</section>

<style>
  .methodology {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-6);
    margin-bottom: var(--space-8);
    max-width: 48rem;
  }

  h2 {
    font-size: 1.5rem;
    margin: 0 0 var(--space-3);
  }

  h3 {
    font-size: 1.0625rem;
    margin: var(--space-6) 0 var(--space-2);
  }

  .intro {
    color: var(--color-text-muted);
  }

  .concepts {
    display: grid;
    gap: var(--space-3);
    margin: var(--space-4) 0;
  }

  .concepts dt {
    font-weight: 700;
  }

  .concepts dd {
    margin: 0;
    color: var(--color-text-muted);
  }

  ul {
    padding-left: 1.25rem;
    display: grid;
    gap: var(--space-1);
  }

  a {
    color: var(--color-accent);
  }

  .technical {
    margin-top: var(--space-4);
    font-size: 0.9375rem;
    color: var(--color-text-muted);
  }
</style>
