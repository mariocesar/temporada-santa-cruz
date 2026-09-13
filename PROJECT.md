# Project: Temporada Santa Cruz

You are acting as the lead product engineer, data engineer, and frontend engineer for this project.

Your task is to CREATE the project, not merely describe how to create it.

Work autonomously, make sensible engineering decisions, and keep the repository in a working state after every significant milestone.

Do not stop after writing a plan. Execute the plan.

---

# 1. Product vision

Build a public web dashboard called:

**Temporada Santa Cruz**

Spanish subtitle:

**Cuándo comprar frutas y verduras en Santa Cruz — basado en oferta, precios, procedencia y cosechas reales.**

The project is inspired conceptually by:

https://news.ycombinator.com/item?id=49604581

However, this is NOT a clone of its printable visualization.

This project should be a modern, responsive, interactive web dashboard focused on:

**Santa Cruz de la Sierra, Bolivia and the agricultural regions that supply its food markets.**

The project's most important asset is the DATA, not the UI.

The dashboard should help answer:

1. What produce is currently in season?
2. When is a particular fruit or vegetable usually in season?
3. When is its peak season?
4. When is it usually cheapest?
5. When is it commonly available in Santa Cruz markets?
6. When is it actually produced within Santa Cruz department?
7. Where does the product usually come from?
8. How confident are we in the estimated season?
9. What historical evidence supports that conclusion?
10. How much of the result is direct observation versus inference?

The project must be transparent about uncertainty.

Never present inferred data as directly observed data.

---

# 2. Core distinction

The application must distinguish these concepts:

## Disponible

The product commonly appears in Santa Cruz markets.

## En temporada

The product is historically abundant and/or inexpensive relative to its own normal market conditions.

## Temporada local

The product is being supplied primarily from producers within Santa Cruz department.

These concepts MUST NOT be conflated.

Examples:

- imported apples can be available year-round without having a local Santa Cruz season
- bananas may be continuously available while still having periods of stronger local supply
- achachairú may have a short, very pronounced local season

This distinction is central to the product.

---

# 3. Technology constraints

Use exactly this core stack:

- Bun
- Vite
- Svelte 5
- TypeScript
- Git
- GitHub CLI (`gh`)
- GitHub Pages
- GitHub Actions

Use modern Svelte 5 conventions.

Prefer:

- runes
- `$state`
- `$derived`
- `$effect` only where actually needed
- snippets instead of legacy slots when appropriate
- small composable components
- TypeScript throughout

Avoid unnecessarily carrying over Svelte 3/4 patterns.

Do NOT introduce:

- SvelteKit
- Next.js
- React
- Vue
- server-side rendering
- a server backend
- Supabase
- Firebase
- external databases
- authentication

This is a client-side static web application.

---

# 4. Deployment architecture

The production target is GitHub Pages.

The app must build to:

`dist/`

Use GitHub Actions to deploy `dist/` to GitHub Pages.

Use Bun in CI.

The deployment workflow must:

1. check out repository
2. install Bun
3. run `bun install --frozen-lockfile`
4. run validation/tests
5. run the production build
6. configure GitHub Pages
7. upload `dist`
8. deploy to GitHub Pages

The workflow should trigger on:

- push to `main`
- manual `workflow_dispatch`

Use the official GitHub Pages actions.

---

# 5. Vite GitHub Pages base path

This project may be deployed at:

`https://USERNAME.github.io/REPOSITORY/`

Therefore the Vite base path must work correctly for project Pages.

Do NOT hard-code asset URLs beginning with `/`.

Determine the GitHub repository name from Git if possible.

Implement a robust Vite configuration.

It should support:

- local development at `/`
- GitHub Pages repository base path
- a future custom domain at `/`

An environment variable such as:

`VITE_BASE_PATH`

or equivalent build-time configuration is acceptable.

The GitHub Action can derive the repository name or explicitly provide the base path.

Document this clearly.

---

# 6. Routing decision

Avoid complicated SPA routing for v1.

The primary dashboard should work as a single-page application without requiring multiple browser routes.

This avoids GitHub Pages 404 fallback problems.

Represent filters/shareable state through URL search parameters where useful.

Example:

`?product=achachairu&metric=seasonality`

Do NOT add a router unless there is a strong concrete reason.

---

# 7. Repository bootstrap

First inspect the current directory.

If it is already a Git repository, preserve it.

If it isn't:

1. initialize Git
2. create the Vite + Svelte + TypeScript project
3. use Bun
4. create a sensible `.gitignore`
5. initialize the repository
6. create the GitHub repo with `gh` if appropriate

Suggested repository name:

`temporada-santa-cruz`

If this repository name already exists or the current repository has another name, adapt instead of destroying anything.

Do not overwrite existing unrelated work.

---

# 8. Application language

The USER-FACING application should primarily be Spanish.

Code, variable names, type names, documentation, and commit messages may be English.

Use Bolivian terminology where appropriate.

Examples:

- temporada
- procedencia
- oferta
- abundante
- normal
- escasa
- mayorista
- minorista
- mercado
- cosecha
- producto
- variedad
- calidad
- precio
- Santa Cruz
- Valles Cruceños
- Norte Integrado

Avoid awkward machine-translated UI text.

---

# 9. Visual direction

The dashboard should feel:

- editorial
- agricultural
- warm
- contemporary
- highly legible
- data-rich
- trustworthy

Do not make it look like:

- a generic SaaS admin dashboard
- Bootstrap
- Material UI
- a cryptocurrency dashboard
- an enterprise BI tool

The visual identity should reference natural agricultural materials subtly without becoming rustic or decorative.

Think:

- excellent typography
- generous whitespace
- strong hierarchy
- compact but clear data visualization
- subdued neutral surfaces
- seasonal produce supplying the visual accents

Use CSS custom properties for the design system.

Do not depend on Tailwind unless there is a compelling reason.

Prefer well-structured native CSS.

---

# 10. Responsive behavior

The application must work well on:

- desktop
- laptop
- tablet
- mobile

Do not design desktop-first and merely stack everything on mobile.

Important interactions must remain useful on a phone.

Timeline charts must remain readable on narrow screens.

Horizontal scrolling is acceptable for dense seasonality visualizations if implemented intentionally.

Test at least approximately:

- 390px
- 768px
- 1280px
- 1600px

---

# 11. Accessibility

Meet sensible WCAG AA practices.

Requirements include:

- semantic HTML
- keyboard accessibility
- visible focus states
- sufficient contrast
- no information encoded by color alone
- text equivalents/labels for charts
- useful `aria` attributes where necessary
- respect `prefers-reduced-motion`
- avoid excessive animation

Charts must not become meaningless to screen-reader users.

Provide accessible summaries for visualizations.

---

# 12. Main dashboard structure

The initial dashboard should contain these major sections.

## Header

Show:

**Temporada Santa Cruz**

Short explanation.

Example:

"Descubre cuándo los productos llegan con mayor abundancia a los mercados de Santa Cruz, cuándo provienen de productores cruceños y qué tan confiables son los datos."

Include an unobtrusive methodology/about control.

---

# 13. "Ahora" section

The landing experience should immediately answer:

**¿Qué está de temporada ahora?**

Use the current month/week from the user's browser.

Show cards or compact rows for products classified as:

- Pico
- En temporada
- Entrando en temporada
- Saliendo de temporada

Allow toggling:

- Mercado
- Local

Example controls:

`[ Mercado ] [ Producción cruceña ]`

The state must be obvious.

---

# 14. Product search/filter

Provide fast product discovery.

Search should support:

- product display name
- aliases
- variety names when present

Filters:

- Todo
- Frutas
- Verduras
- Tubérculos
- Otros

Potential additional filter:

- Producción local
- Datos suficientes

Keep the interface simple.

---

# 15. Main annual seasonality visualization

This is the signature visualization.

Create an interactive annual calendar/timeline displaying all products vertically and months horizontally.

Conceptually:

                  E F M A M J J A S O N D
Achachairú        ▓▓▓▓▒·············▒▓▓
Papaya            ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒
Mandarina         ···▒▓▓▓▓▓▒··········
...

But implement it beautifully.

Use SVG and Svelte where practical.

Avoid a giant opaque charting library.

Small D3 utility packages such as:

- d3-scale
- d3-array
- d3-shape

are acceptable if they materially simplify the implementation.

Do not use D3 to imperatively own the DOM.

Svelte should render the SVG.

---

# 16. Timeline visual encoding

For each product/week or product/month represent:

- unavailable / insufficient evidence
- occasionally available
- usually available
- in season
- peak season

Visually differentiate:

- market season
- local Santa Cruz season

Confidence must also be visible.

Do NOT require a user to distinguish five nearly identical colors.

Possible encodings:

- intensity
- opacity
- texture
- shape
- border
- annotations

Choose a coherent system.

---

# 17. Product detail experience

Selecting a product should reveal a detailed panel/view without requiring server routing.

For a product display:

## Identity

- Spanish name
- scientific name when known
- aliases
- category
- known varieties

## Summary

Example:

"El achachairú suele alcanzar su mejor disponibilidad entre diciembre y febrero. La mayor parte de la oferta observada durante este periodo proviene de Santa Cruz."

Do not generate misleading prose when evidence is weak.

## Season timeline

Display:

- availability
- market season
- local season
- peak
- confidence

## Historical market observations

Show:

- number of observations
- number of years represented
- first observation
- most recent observation
- observed origins
- availability distribution
- price observations where comparable

## Origin

Show known supplying regions.

Potential labels:

- Santa Cruz
- Valles Cruceños
- Cochabamba
- Tarija
- La Paz
- Beni
- Argentina
- Perú
- desconocido

## Price behavior

If sufficient normalized observations exist, show relative seasonal price movement.

Do NOT compare incompatible units directly.

## Evidence

Clearly list which signals contributed:

- presencia en mercado
- nivel de oferta
- precio relativo
- procedencia
- calendario de cosecha
- producción agrícola
- climate adjustment if eventually present

## Confidence

Show a plain-language confidence explanation.

For example:

**Confianza alta**

"Hay observaciones en 9 años diferentes y los datos de mercado coinciden con el calendario de cosecha."

---

# 18. Data provenance UI

Every product must expose provenance.

The user should be able to understand:

- where the data came from
- whether it was observed or inferred
- date range
- how many observations exist
- known limitations

Provide a methodology drawer/modal/page section.

The methodology must be understandable to a non-statistician.

Also offer technical details for interested users.

---

# 19. Initial known data sources

Design the model around these known/researched sources.

## CAO / SIPREM

Cámara Agropecuaria del Oriente.

Potential information includes:

- market prices
- wholesale prices
- retail prices
- fruit and vegetable categories
- product
- origin
- variety
- quality
- availability classification
- cultivated area
- production
- planting progress
- harvest progress
- historical agricultural information

Historical market reports may exist as PDFs or mirrors.

This should be considered a primary source.

---

# 20. SIIP Bolivia

Sistema Integrado de Información Productiva.

Potentially useful for:

- daily wholesale prices
- fruit and vegetable observations
- Santa Cruz city/market data
- historical files

Treat this as another independent market source.

---

# 21. INE Agricultural Census 2013

Important possible variables include:

- municipality
- crop
- planted area
- planting month
- harvest month
- harvested amount
- amount sold
- amount consumed
- irrigation
- production unit

This source is old.

Do NOT present 2013 data as current 2026 production.

Use it as:

- historical harvest-calendar evidence
- geographical evidence
- a prior for likely biological seasonality

Modern market observations should override conflicting old harvest patterns where evidence is strong.

---

# 22. Other secondary sources

The architecture should be able to incorporate:

- Instituto Cruceño de Estadística
- municipal / market datasets
- news reports
- climate datasets
- remote sensing

However:

NEWS ARTICLES ARE NOT PRIMARY SEASONALITY DATA.

News should only be used for things like:

- known road blockades
- flood disruptions
- drought
- abnormal weather
- temporary supply shocks
- explanations of anomalous prices

---

# 23. Data philosophy

The project must preserve THREE layers:

## Raw

Exactly what the source reported.

Never destroy raw strings during normalization.

## Normalized

Canonical products, origins, units, dates, etc.

## Derived

Seasonality scores, confidence, price indexes, summaries.

Never make derived values impossible to trace back to observations.

---

# 24. Repository data structure

Design something close to:

```text
data/
  raw/
    cao/
    siip/
    ine/
    manual/
  normalized/
  generated/
  metadata/
```

Avoid committing huge unnecessary binary datasets.

If raw source files are too large or subject to redistribution constraints:

- retain metadata
- retain source URLs
- provide reproducible fetch/import scripts
- document acquisition
- do not illegally mirror restricted material

Application-ready artifacts should be compact.

For example:

```text
public/
  data/
    products.json
    seasonality.json
    observations-summary.json
    sources.json
```

Or hashed equivalents generated by the build.

Choose an efficient structure.

---

# 25. Canonical TypeScript model

Create strong TypeScript types.

Start with concepts roughly equivalent to:

```ts
type ProductCategory =
  | 'fruit'
  | 'vegetable'
  | 'tuber'
  | 'grain'
  | 'herb'
  | 'other';

type AvailabilityLevel =
  | 'scarce'
  | 'normal'
  | 'abundant'
  | 'unknown';

type EvidenceKind =
  | 'market_presence'
  | 'market_availability'
  | 'price'
  | 'origin'
  | 'harvest'
  | 'production'
  | 'climate'
  | 'manual';

interface Product {
  id: string;
  slug: string;
  nameEs: string;
  scientificName?: string;
  aliases: string[];
  category: ProductCategory;
  varieties?: string[];
}

interface Origin {
  id: string;
  label: string;
  country: string;
  department?: string;
  province?: string;
  municipality?: string;
  region?: string;
  level:
    | 'country'
    | 'department'
    | 'province'
    | 'municipality'
    | 'region'
    | 'unknown';
}

interface MarketObservation {
  id: string;
  observedAt: string;
  sourceId: string;
  market?: string;

  productId: string;
  productRaw: string;

  originId?: string;
  originRaw?: string;

  variety?: string;
  varietyRaw?: string;

  quality?: string;

  availability: AvailabilityLevel;

  wholesalePrice?: number;
  wholesaleUnit?: string;

  retailPrice?: number;
  retailUnit?: string;
}
```

Improve this model where appropriate.

Do NOT prematurely flatten everything.

---

# 26. Preserve raw dimensions

For observations preserve fields such as:

- product_raw
- origin_raw
- variety_raw
- unit_raw

Canonical normalized values should exist beside them.

Never overwrite raw values with normalized ones.

This is important for auditability.

---

# 27. Unit handling

Bolivian market reports may use units such as:

- kg
- lb
- arroba
- quintal
- caja
- bolsa
- 100 unidades
- 25 unidades
- docena
- racimo
- amarro

Do NOT assume every observation can safely become `Bs/kg`.

Store:

```ts
interface MarketUnit {
  raw: string;
  canonical?: string;
  knownWeightKg?: number;
  conversionConfidence?: number;
}
```

Only compare prices where units are compatible or a defensible conversion exists.

Avoid fake precision.

---

# 28. Relative price index

Nominal historical prices cannot be compared naïvely across many years.

For comparable product/unit observations, compute price relative to that product's typical value in the same year.

Conceptually:

```text
relativePrice(y,w) =
price(y,w) / medianPrice(y)
```

Cheap relative to the year's normal conditions can indicate stronger supply.

Create a normalized inverse affordability/abundance signal if useful.

Handle:

- missing values
- outliers
- incompatible units
- tiny sample sizes

Never allow sparse price data to dominate seasonality.

---

# 29. Availability score

Some CAO reports classify offer approximately as:

- Escasa
- Normal
- Abundante

Normalize possible abbreviations such as:

- E
- N
- A

A reasonable initial numeric mapping can be:

```text
scarce   = 0.20
normal   = 0.60
abundant = 1.00
```

Treat these as configurable methodology constants.

Do not scatter magic numbers throughout the code.

Put model parameters in a documented module.

---

# 30. Presence signal

Product presence itself is meaningful.

For each ISO week of year calculate:

```text
yearsPresent / yearsObserved
```

Example:

If achachairú appears around week 2 in 8 out of 10 represented years:

```text
presenceProbability = 0.8
```

This is an important seasonality feature.

Be careful to distinguish:

**product absent from report**

from:

**report unavailable for that date**

Missing source files are NOT evidence that the product was absent.

---

# 31. Locality signal

Compute something conceptually equivalent to:

```text
localShare =
observationsFromSantaCruz / observationsWithKnownOrigin
```

Do not include records with unknown origin in the denominator unless methodology explicitly calls for it.

Keep geographic granularity.

A source saying merely:

`Santa Cruz`

must not be falsely converted into:

`Santa Cruz de la Sierra`

or a specific municipality.

---

# 32. Geographic ontology

Create a normalization layer capable of representing areas such as:

```text
Bolivia
  Santa Cruz
    Valles Cruceños
      Samaipata
      Vallegrande
      Comarapa
      Mairana
    Norte Integrado
      Montero
      Warnes
    Chiquitania
    Cordillera
    Andrés Ibáñez

  Cochabamba
  Tarija
  La Paz
  Beni
  Oruro
  Chuquisaca
  Potosí
  Pando

Argentina
Perú
...
```

This does NOT need to be exhaustive on day one.

Do not infer precision that the raw source doesn't provide.

Support:

```ts
confidence: number
normalizationMethod:
  | 'exact'
  | 'alias'
  | 'manual'
  | 'inferred'
```

where useful.

---

# 33. Core seasonality model

Implement the model as a documented, testable pure TypeScript module.

Start with a transparent weighted model rather than machine learning.

For week `w`, think conceptually:

```text
MarketSeasonScore(w) =
    availabilityWeight * availabilitySignal
  + presenceWeight     * presenceSignal
  + priceWeight        * priceSignal
```

For local season:

```text
LocalSeasonScore(w) =
    marketSeasonality component
  + origin/localShare component
  + harvest-calendar component
```

A possible initial model:

```text
market season:
  availability 45%
  presence     35%
  price        20%
```

And local confidence can incorporate local origin evidence separately.

These are starting assumptions, NOT scientific truths.

Keep all weights centralized and documented.

---

# 34. Harvest calendar as prior

INE harvest-month data can be used as a supporting prior.

For a crop and region:

```text
P(harvestMonth = m | crop, municipality)
```

may provide useful seasonality evidence.

But because the census is historical, market evidence from recent years should be stronger for current consumer recommendations.

Never silently treat harvest calendar and market availability as equivalent.

---

# 35. Confidence model

Confidence must be independent from the seasonality score.

A product can have:

- strong apparent peak
- low confidence

if observations are sparse.

Confidence should consider:

- number of observations
- number of distinct years
- temporal coverage
- number of independent sources
- consistency between years
- origin completeness
- agreement between market and harvest signals
- missing-data ratio

Create an explicit confidence model.

Possible display labels:

- Muy baja
- Baja
- Media
- Alta

Do not assign "Alta" to data based on a single year.

---

# 36. Suggested evidence thresholds

Start with defensible configurable thresholds.

For example:

Do not publicly classify a crop's season unless it has at least:

- 30 useful observations

AND

- observations spanning 2+ distinct years

Prefer stronger labels only after 4+ years.

These values can be refined.

When insufficient:

**Datos insuficientes**

is better than inventing certainty.

---

# 37. Weekly model

Use ISO week-of-year internally where practical.

Prefer 52/53-week analysis over only twelve months.

The UI can aggregate or label by month for readability.

Benefits:

- smooth entering/leaving season
- better peak estimation
- better comparison across years

Handle ISO week 53 correctly.

---

# 38. Smoothing

Raw weekly data can be noisy.

Use a simple documented smoothing method, for example:

- centered moving average
- circular kernel smoothing

Remember the calendar is cyclical:

December and January are adjacent.

A smoothing function must wrap around the year boundary.

Add tests.

Do NOT use a black-box ML model.

---

# 39. Season classification

Derived weekly scores should map to human-readable states.

Example initial thresholds:

```text
0.00–0.20 insufficient/off season
0.20–0.45 occasional
0.45–0.70 in season
0.70–1.00 peak
```

These are placeholders.

Put thresholds into methodology configuration and document them.

Do not pretend they are universal scientific boundaries.

---

# 40. Entering/leaving season

For the "Ahora" UI derive trend from adjacent weeks.

Example:

- rising score -> Entrando
- high score -> Pico
- stable moderate score -> En temporada
- falling score -> Saliendo

Make the trend computation deterministic and tested.

---

# 41. Data pipeline commands

Provide clear Bun commands such as:

```bash
bun run data:validate
bun run data:normalize
bun run data:derive
bun run data:build
bun run dev
bun run check
bun run test
bun run build
```

Potential combined command:

```bash
bun run data
```

Each stage should be reproducible.

---

# 42. Raw import adapters

Create a modular import architecture.

For example:

```text
scripts/
  data/
    importers/
      cao.ts
      siip.ts
      ine.ts
    normalize/
      products.ts
      origins.ts
      units.ts
    derive/
      seasonality.ts
      prices.ts
      confidence.ts
    schemas/
```

Importers should transform source-specific input into common intermediate structures.

Do not bury source parsing logic inside UI components.

---

# 43. PDF ingestion

Historical sources may be PDF documents.

Do NOT build fragile production logic that requires the browser to parse PDFs.

PDF extraction belongs in the offline data pipeline.

If reliable automatic extraction is not available in v1:

- create the importer interface
- add fixtures based on legitimately available sample data
- document the extraction workflow
- allow manually transcribed CSV as a supported intermediate format

Example:

```text
data/raw/cao/observations.csv
```

with source metadata linking rows back to report/date/source URL.

Do not fabricate historical records just to fill the graph.

---

# 44. Validation

Create schema validation for imported data.

Use something small and appropriate, e.g. Zod, if useful.

Validation should catch things like:

- impossible dates
- negative prices
- unknown category
- duplicate IDs
- malformed source references
- invalid coordinates if later introduced
- invalid season scores
- score outside [0,1]
- missing required raw values

Fail data builds loudly.

---

# 45. Demo/seed dataset

The app needs enough content to demonstrate all UI states before the historical corpus is completely ingested.

Create a SMALL seed dataset for development.

Candidate products:

- Achachairú
- Papaya
- Piña
- Mandarina
- Naranja
- Sandía
- Durazno
- Frutilla
- Uva
- Guineo
- Tomate
- Yuca

CRITICAL:

Any values not backed by imported source records MUST be marked as:

`demo`, `synthetic`, or `placeholder`.

The production UI must NEVER silently present synthetic sample values as researched facts.

Create a development mode where demo data is clearly identified.

Prefer real observations whenever possible.

---

# 46. Data source registry

Create metadata similar to:

```ts
interface DataSource {
  id: string;
  name: string;
  publisher: string;
  url?: string;
  description?: string;
  coverageStart?: string;
  coverageEnd?: string;
  accessedAt?: string;
  methodologyNotes?: string;
  licenseNotes?: string;
}
```

Every derived dataset should retain references to contributing source IDs.

---

# 47. Data freshness

Display:

**Datos actualizados hasta: ...**

based on data metadata, not the application deployment date.

Also display when a product's latest underlying observation is old.

Example:

"Última observación disponible: abril de 2023"

Do not create a false sense of freshness.

---

# 48. Architecture

Aim for a structure conceptually like:

```text
src/
  app.css
  App.svelte

  lib/
    components/
      dashboard/
      charts/
      products/
      methodology/
      ui/

    data/
      loader.ts
      types.ts

    domain/
      seasonality.ts
      confidence.ts
      prices.ts
      dates.ts

    stores/
      dashboard.svelte.ts

    utils/

scripts/
  data/
    importers/
    normalize/
    derive/
    validate/

data/
  raw/
  normalized/
  generated/
  metadata/

public/
  data/

tests/

.github/
  workflows/
```

Adapt if a better organization emerges.

---

# 49. State management

Avoid a giant global store.

Most state can live in:

- component state
- derived values
- a small dashboard state module

Useful global/shareable state might include:

- selected product
- selected category
- market vs local mode
- search query
- current/reference week

Synchronize only useful shareable state with query parameters.

---

# 50. Performance

This should feel instant.

Targets:

- small initial JS payload
- no unnecessary charting framework
- no huge raw observation JSON fetched on initial load
- precompute expensive aggregation during data build
- lazy-load product details if appropriate

The frontend should consume DERIVED application-ready data.

Do not ship 100 MB of raw CSV to the browser.

---

# 51. Generated data

The offline pipeline should precompute outputs such as:

```ts
interface WeeklySeasonality {
  productId: string;
  week: number;

  marketScore?: number;
  localScore?: number;

  presenceProbability?: number;
  availabilityScore?: number;
  relativePriceScore?: number;
  localShare?: number;
  harvestScore?: number;

  confidence: number;
  observations: number;
  years: number;

  sourceIds: string[];
}
```

This keeps browser logic straightforward.

---

# 52. Product summary data

Also generate compact product summaries so the home page doesn't load every raw observation.

For example:

```ts
interface ProductSeasonSummary {
  productId: string;

  peakWeeks: number[];
  marketSeasonRanges: SeasonRange[];
  localSeasonRanges: SeasonRange[];

  observationCount: number;
  yearsCovered: number;
  firstObservation?: string;
  lastObservation?: string;

  confidence: number;
  primaryOrigins: OriginSummary[];
}
```

---

# 53. Annual circular ranges

Season ranges can cross year boundaries.

For example:

December -> February.

Do NOT represent these incorrectly as impossible ranges.

Create a reusable cyclic week-range abstraction or representation.

Add tests for:

- December-February
- January-March
- November-December
- full-year availability

---

# 54. Price chart

Price charts should show normalized relative price, not misleading nominal decade-spanning Bs values.

Allow actual nominal prices to appear in observation tables/tooltips where relevant.

If a particular product has incompatible historical unit changes:

say so.

Example:

"No se calcula una tendencia de precio porque las unidades históricas no son comparables."

This is preferable to a bad graph.

---

# 55. Data quality indicators

Create explicit data quality indicators.

Potential dimensions:

- years
- observations
- origin coverage
- price comparability
- source diversity
- recency

Expose them visually in product details.

Do not reduce everything to one mysterious confidence number.

---

# 56. Methodology section

Include:

## ¿Qué significa "en temporada"?

Explain market-based seasonality.

## ¿Qué significa "local"?

Explain Santa Cruz department origin.

## ¿Cómo calculamos la temporada?

Explain:

- presence
- abundance
- relative price
- origin
- harvest calendar

## ¿Qué significa la confianza?

Explain evidence quantity and consistency.

## Limitaciones

Mention:

- missing historical reports
- changing market coverage
- inconsistent units
- old census data
- logistics disruptions
- price shocks
- imports
- incomplete origin data

This transparency is a feature.

---

# 57. Sources section

Create a source catalog within the site.

For each source show:

- institution
- dataset/report
- coverage
- purpose in model
- source URL when possible
- limitations

External links must be safe and clear.

---

# 58. SEO / metadata

Configure:

- meaningful page title
- description
- OpenGraph metadata where static metadata is practical
- favicon/app icon
- canonical URL only when known
- Spanish locale

Example title:

`Temporada Santa Cruz — Frutas y verduras de temporada en Bolivia`

Example description:

`Consulta cuándo frutas y verduras están en temporada, cuándo llegan con mayor oferta y cuándo son producidas localmente en Santa Cruz, Bolivia.`

---

# 59. No misleading geolocation

The product is about the Santa Cruz food market.

Do not use browser geolocation.

The dashboard does not need to know the user's location.

Make the geographic scope explicit in the UI.

---

# 60. Testing strategy

Use appropriate lightweight testing.

At minimum test pure domain logic for:

- week calculation
- cyclic smoothing
- price normalization
- presence probability
- score calculation
- confidence calculation
- season classification
- circular date ranges
- missing data behavior
- local share
- duplicate handling

Also add a basic rendering/smoke test if practical.

Do not spend most of the project building a massive test framework.

---

# 61. Code quality

Configure:

- TypeScript strict mode
- Svelte checking
- formatting
- linting if lightweight and stable

Commands should include at minimum:

```bash
bun run check
bun run test
bun run build
```

All must pass before completion.

---

# 62. README

Create an excellent `README.md`.

It should explain:

- what the project is
- why it exists
- geographic scope
- screenshots placeholder/location if none yet
- stack
- architecture
- data model
- methodology overview
- data sources
- how to run locally
- how to import data
- how to rebuild derived data
- how to test
- how to deploy
- GitHub Pages base-path behavior
- known limitations
- roadmap

Include exact commands using Bun.

---

# 63. CONTRIBUTING

Create a concise `CONTRIBUTING.md`.

Especially document how someone can contribute:

- a historical market report
- product aliases
- origin mappings
- unit mappings
- corrections

Require source provenance for factual data contributions.

---

# 64. Data contribution format

Make it possible for contributors to submit observations through a CSV format.

Document a schema approximately like:

```csv
observed_at,source_id,market,product_raw,origin_raw,variety_raw,quality,availability,wholesale_price,wholesale_unit,retail_price,retail_unit
```

Provide a sample/template.

This will make historical transcription much easier.

---

# 65. Data auditability

Every generated observation ID should be stable where possible.

Use deterministic IDs based on meaningful source identity rather than random UUIDs for imported records if practical.

Example input dimensions:

- source
- source document
- date
- row index
- normalized product

This simplifies deduplication.

---

# 66. Deduplication

Historical reports may exist through multiple mirrors.

Do NOT treat mirrored versions of the same CAO report as independent observations.

Implement/document deduplication using concepts such as:

- original publisher
- report date
- source report identifier
- checksum
- matching rows

Mirrors provide access, not independent evidence.

---

# 67. Source hierarchy

Distinguish:

**Original source**

Example:
CAO

from:

**Mirror**

Example:
an archived PDF hosted by another organization.

The source registry should be capable of representing both.

The derived confidence model must not count 3 mirrors of one report as 3 independent sources.

---

# 68. Data anomalies

Design for anomaly annotations.

Possible events:

```ts
interface SupplyDisruption {
  startDate: string;
  endDate?: string;
  type:
    | 'road_blockade'
    | 'flood'
    | 'drought'
    | 'frost'
    | 'transport'
    | 'policy'
    | 'other';

  affectedOrigins?: string[];
  affectedProducts?: string[];

  sourceIds: string[];
  notes: string;
}
```

Do not necessarily include anomaly adjustment in model v1.

But make future inclusion possible.

---

# 69. Avoid these mistakes

Do NOT:

- scrape arbitrary Google search results at runtime
- make browser-side requests to fragile government websites
- pretend unavailable reports are zero supply
- compare incompatible prices
- infer exact municipalities from department-level origin
- present synthetic seed data as factual
- create a fake AI prediction feature
- use weather as a substitute for market data
- make the UI more complicated than the methodology warrants
- add user accounts
- introduce a backend without necessity
- use giant dependencies for simple tasks
- use a map merely because origin data exists
- make the project dependent on a proprietary API

---

# 70. Initial product experience

When someone first lands on the page, within several seconds they should understand:

1. this is about Santa Cruz, Bolivia
2. which produce is currently in season
3. the distinction between market and local season
4. that the results come from historical data
5. they can inspect the methodology

Do not start with a wall of methodology.

Lead with useful information.

---

# 71. Desktop layout

A good desktop composition might be:

```text
----------------------------------------------------
Temporada Santa Cruz                 Metodología
When to buy produce...
----------------------------------------------------

¿Qué está de temporada ahora?
[ Mercado ] [ Producción cruceña ]

[Pico] cards...

----------------------------------------------------

Explorar todo
Search...   [Frutas] [Verduras] [...]

           Jan Feb Mar ... Dec
Product 1  ██████...
Product 2  ....
Product 3  ....

----------------------------------------------------
```

Selecting a product can open a rich side panel or detail area.

Choose the interaction that feels best.

---

# 72. Mobile layout

For mobile:

- prioritise "Ahora"
- use horizontal timeline scrolling if necessary
- keep product names sticky where useful
- make the selected product detail a full-width panel/sheet
- avoid microscopic charts
- avoid hover-only interactions

All tooltips must have touch-friendly equivalents.

---

# 73. Tooltips

Timeline interactions should show useful information such as:

```text
Achachairú
Semana 2 · enero

Mercado: Pico
Local: Pico
Confianza: Alta

Presente en 8 de 9 años observados
Oferta: generalmente abundante
Origen local: 86%
```

Only show metrics that actually exist.

---

# 74. URL state

Use URL search params for shareable selections.

Examples:

```text
?product=achachairu
?product=achachairu&mode=local
?category=fruit
```

On reload, restore the state.

Do not create server-dependent routes.

---

# 75. Current week

Use the browser's date only to determine the current reference week for "Ahora."

Allow the user to move through the year.

A useful optional control:

`Hoy · Septiembre`

with month/week navigation.

This allows someone to ask:

"What will be in season in December?"

without changing device date.

---

# 76. Explore-by-month feature

Implement, if it fits naturally:

**¿Qué está de temporada en...?**

Month selector:

Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec

Selecting December updates rankings based on December season scores.

This should reuse the same model as "Ahora."

---

# 77. Sorting

Useful timeline sorts:

- Nombre
- Temporada actual
- Confianza
- Categoría

Potentially:

- temporada más próxima

Do not overload the interface.

---

# 78. Empty/error states

Handle:

- generated data missing
- product has no local-origin evidence
- insufficient price samples
- no products matching filter
- outdated dataset
- malformed data

Development errors should be loud.

Production states should be understandable.

---

# 79. Development data mode

Implement an obvious dev-only indicator when synthetic fixtures are active.

Example:

`DATOS DE DEMOSTRACIÓN`

Never allow a production deployment using only synthetic data without clearly showing that status.

Ideally fail production build unless a deliberate environment variable acknowledges demo mode.

Example:

```text
ALLOW_DEMO_DATA=true
```

Document it.

---

# 80. GitHub Pages workflow

Create:

`.github/workflows/deploy.yml`

Use current stable official actions.

Use Bun setup.

Conceptually:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

Configure concurrency for Pages.

Run:

```bash
bun install --frozen-lockfile
bun run check
bun run test
bun run build
```

Then upload `dist`.

Do not commit `dist`.

---

# 81. Optional data validation CI

If straightforward, also create:

`.github/workflows/validate.yml`

on pull requests.

Run:

```bash
bun install --frozen-lockfile
bun run data:validate
bun run check
bun run test
bun run build
```

Avoid duplication if a single workflow is cleaner.

---

# 82. gh CLI usage

Use `gh` where appropriate.

Inspect:

```bash
gh auth status
gh repo view
```

If repository creation is needed:

```bash
gh repo create temporada-santa-cruz --public --source=. --remote=origin --push
```

Adapt to existing repository state.

Do NOT recreate an existing repo.

Once pushed, configure Pages for GitHub Actions where possible.

If `gh` cannot configure a specific repository setting cleanly, document the single required manual GitHub setting rather than hacking around it.

---

# 83. Git workflow

Create logical commits.

For example:

```text
chore: bootstrap Svelte 5 application
feat: add seasonality domain model
feat: add data ingestion pipeline
feat: build seasonality dashboard
feat: add product detail experience
docs: document methodology and data sources
ci: deploy dashboard to GitHub Pages
```

Do not create hundreds of microscopic commits.

Do not dump everything into a single "initial commit" if avoidable.

---

# 84. First implementation phase

Before UI polish, establish:

1. repository
2. Svelte app
3. domain types
4. source registry
5. sample normalized observations
6. derivation pipeline
7. generated JSON
8. tests

Prove:

```text
raw observation
      ↓
normalized observation
      ↓
weekly aggregation
      ↓
season score
      ↓
confidence
      ↓
public JSON
      ↓
Svelte UI
```

works end-to-end.

---

# 85. Second implementation phase

Build the functional dashboard:

1. current-season products
2. market/local toggle
3. product search
4. category filters
5. annual timeline
6. product selection
7. product details
8. methodology

Functionality before decorative polish.

---

# 86. Third implementation phase

Polish:

- typography
- spacing
- mobile
- animations
- accessibility
- empty states
- responsive charts
- shareable URL state
- metadata
- favicon
- README

---

# 87. Fourth implementation phase

Productionize:

- tests
- typecheck
- data validation
- production build
- GitHub Actions
- GitHub Pages
- verify deployed asset paths
- verify refresh/reload behavior

---

# 88. Definition of done

The project is NOT done merely because the home page renders.

It is done when:

- `bun install` works
- `bun run dev` works
- `bun run data:validate` works
- `bun run data:build` works
- `bun run check` passes
- `bun run test` passes
- `bun run build` passes
- production uses correct GitHub Pages asset paths
- GitHub Actions deployment exists
- dashboard works on mobile and desktop
- market/local distinction works
- product detail works
- methodology is visible
- provenance is represented
- demo data cannot be mistaken for factual production data
- README explains the complete workflow
- commits are clean
- repository is pushed

If GitHub credentials and repository permissions permit, also deploy it.

---

# 89. Important engineering principle

Do not conflate:

**the dashboard**

with:

**the historical data acquisition project**.

A high-quality application can be complete before every historical PDF is ingested.

Therefore build a mature import/normalization/derivation pipeline now.

Actual data coverage can expand incrementally.

The schema must make adding 10,000 future observations boring and predictable.

---

# 90. Important statistical principle

A complicated statistical model is NOT automatically better.

For v1 prioritize:

- transparent
- explainable
- deterministic
- testable
- auditable

over predictive sophistication.

Start with the weighted seasonality model.

Later it can evolve based on actual observed behavior.

---

# 91. Important product principle

Never say:

"X is in season"

without being able to explain why.

The ideal product detail makes the reasoning obvious:

```text
ACHACHAIRÚ

Pico habitual
Diciembre — febrero

Confianza alta

✓ Detectado en 9 años
✓ Oferta frecuentemente abundante
✓ 82% de registros con procedencia conocida son de Santa Cruz
✓ Coincide con meses históricos de cosecha

38 observaciones analizadas
```

The exact values above are illustrative only.

Never use them unless supported by real records.

---

# 92. Future architecture

The code should leave room for, but NOT implement prematurely:

- automatic weekly SIIP refresh
- GitHub Actions scheduled data ingestion
- climate anomalies
- rainfall
- growing degree days
- Sentinel/remote-sensing signals
- municipal maps
- yearly comparisons
- downloadable datasets
- API
- multilingual English UI
- contributor data-review workflow

Do not let future ideas delay v1.

---

# 93. Potential future automated refresh

The architecture should make a future workflow possible:

```text
scheduled GitHub Action
       ↓
fetch permitted public data
       ↓
normalize
       ↓
validate
       ↓
derive
       ↓
commit generated data if changed
       ↓
deploy
```

Do not automatically scrape sources unless their access method and usage are appropriate.

Manual imports are perfectly acceptable initially.

---

# 94. Documentation of uncertainty

Add a developer methodology document:

`docs/METHODOLOGY.md`

Include:

- signal definitions
- formulas
- current weights
- threshold rationale
- confidence model
- handling missing reports
- handling inconsistent units
- origin definition
- census limitations
- deduplication
- anomaly handling
- known methodological weaknesses

Also create:

`docs/DATA_SOURCES.md`

and:

`docs/DATA_CONTRIBUTION.md`

---

# 95. Project identity

Use the working name:

**Temporada Santa Cruz**

Use a simple text-based identity initially.

Do not waste time creating an elaborate logo.

A small tasteful icon/favicon based on a seasonal cycle, leaf, fruit, or sun/calendar motif is enough.

Use original work, not copyrighted artwork copied from elsewhere.

---

# 96. Dependencies

Before adding every dependency, ask:

"Can native browser APIs/Svelte do this cleanly?"

Keep dependencies intentionally small.

Likely reasonable dependencies include:

- Svelte
- Vite
- TypeScript
- Zod or equivalent for data validation
- Vitest
- tiny D3 modules only if useful

Avoid kitchen-sink UI/component libraries.

---

# 97. Browser compatibility

Target modern evergreen browsers and reasonably recent Safari/iOS.

The site should work on an iPhone.

Avoid APIs with poor Safari support unless polyfilled or gracefully degraded.

---

# 98. Security

Because this is a static site:

- do not embed secrets
- do not commit API keys
- do not put private tokens in Vite environment variables
- use GitHub Actions secrets only if a future private credential is actually necessary
- validate any imported external data offline

Remember anything shipped through Vite to the browser is public.

---

# 99. Work process

Follow this process:

### A. Inspect

Inspect:

- directory
- Git state
- installed tools
- Bun
- gh authentication
- existing files

### B. Plan internally

Produce a concise implementation checklist.

Do not stop there.

### C. Bootstrap

Create the working app.

### D. Data model

Implement domain/data pipeline first.

### E. Dashboard

Implement functional UI.

### F. Polish

Improve UX and accessibility.

### G. Validate

Run all checks.

### H. Deploy

Commit, push, configure GitHub Pages, and deploy if permissions permit.

### I. Report

At the end summarize:

- what was built
- repository URL
- deployed URL if available
- commands
- current real/demo data status
- major architectural decisions
- next highest-value data ingestion task

---

# 100. Autonomous decision-making

Do not continuously ask me low-value questions.

Choose reasonable defaults.

Ask only if you encounter something genuinely blocking, destructive, credential-sensitive, or impossible to infer.

Examples that should NOT require asking:

- component folder names
- CSS organization
- whether to use SVG for a simple chart
- exact spacing scale
- test file organization

Examples that MAY require clarification:

- overwriting an unrelated existing repository
- creating a private vs public repository when no safe assumption exists
- purchasing services
- credentials unavailable
- licensing restrictions preventing data use

For ordinary implementation decisions, proceed.

---

# 101. First real-data milestone

Once the infrastructure and dashboard work, the next highest-value research/data milestone is:

Reconstruct as much historical weekly market data as possible for roughly these initial products:

- Achachairú
- Papaya
- Piña
- Frutilla
- Durazno
- Naranja
- Mandarina
- Sandía
- Uva
- Guineo

using legitimate CAO/SIPREM, SIIP, INE, or other attributable source material.

Focus first on determining:

- which report dates exist
- how many years exist
- product presence
- offer classification
- origin
- comparable prices
- data gaps

Do not attempt to beautify inferred seasons before this evidence exists.

---

# 102. Final instruction

Build this as a serious open-data project, not a visual mockup.

The central promise of Temporada Santa Cruz should be:

**beautiful enough that people want to use it, transparent enough that people can trust it, and structured enough that the dataset can improve for years.**

Proceed now.

Inspect the environment, create an implementation checklist, and then build the project through a successful production build and GitHub Pages deployment if repository permissions permit.

---

# 103. Confirmed decisions

Decisions confirmed with the project owner during initialization (2026-09-13):

## Repository

Public GitHub repository `mariocesar/temporada-santa-cruz`, created at initialization.

## Licensing

- Code: MIT (`LICENSE`).
- Curated, normalized, and derived datasets: CC BY 4.0 (`LICENSE-DATA.md`).
- Raw source material keeps its original publishers' terms, documented per source in the source registry.

## Data acquisition

During execution, the agent may research and fetch legitimately accessible public CAO/SIPREM, SIIP, and INE materials to map coverage (report dates, formats, gaps) and import observations. Demo data fills UI gaps in the meantime and must always be clearly marked.

## Initialization scope

Initialization delivered the working Svelte 5 + Vite + Bun scaffold, this decisions record, and the phased execution plan in `docs/PLAN.md`. Full execution (data pipeline, dashboard, polish, deployment) follows that plan in a later session.

## Reference seasons (confirmed 2026-09-13)

Decisions confirmed with the project owner while planning the reference-season feature (specified in §104):

- **Scope**: a curated set of ~6–8 products beyond the observed catalog — palta and mango plus candidates such as limón, maracuyá, chirimoya, coco, and cayú; the exact list is decided during execution based on which products have citable literature.
- **Display-only**: reference seasons are rendered as "Temporada estimada (bibliografía)" and are NEVER blended into market/local scores, `harvestScore` (reserved for the INE census prior, §34), confidence, evidence, or `insufficientEvidence`.
- **Data acquisition expanded**: in addition to CAO/SIPREM, SIIP, and INE (above), the agent may research and fetch legitimately accessible public agronomy literature (MDRyT / Gobernación de Santa Cruz harvest calendars, INIAF, FAO, academic publications) to build phenology entries, recording each item as a cited source with publisher, URL, and access date. Citations must never be fabricated; a product without a verifiable source simply stays at "Datos insuficientes".

---

# 104. Reference seasons (estimación bibliográfica)

A display-only layer that gives products without market observations an approximate season inferred from species phenology and harvest-calendar literature, without weakening the observed-data model. This section is the design of record for Phase 2 of `docs/PLAN.md`; the owner decisions behind it are in §103.

## Invariants

- Reference data never enters `marketScore`, `localScore`, `harvestScore`, `confidence`, `evidence`, or `insufficientEvidence`. §101's warning stands: this layer exists precisely so estimates never masquerade as observations.
- Reference data never passes through the cyclic smoothing kernel — it is windows → ranges only, no per-week scores, so the smoothed-score validation path is untouched.
- Every reference range traces to source IDs in the source registry. Estimate-only products keep `insufficientEvidence: true` and confidence 0 — that is correct, not a gap.
- `SeasonClass` / `SeasonState` are not extended: estimate-only products remain `sin_datos` for current-week claims.

## Data model

- Source registry gains a required `sourceType: 'market' | 'census' | 'literature'` taxonomy. Existing entries are retro-typed (INE census → `census`, formalizing its "prior only" prose flag in the registry). Literature sources must carry `url` and `accessedAt` so citations are retrievable and dated.
- New curated registry `data/metadata/phenology.json`: per-product entries with cyclic season windows (calendar months 1–12 or ISO-week bins 1–52; start > end wraps the year boundary), cited `sourceIds`, an optional Spanish display note, and free-form citation detail. Validated strictly; cross-checks reject unknown products/sources, market-typed sources, and synthetic sources.
- Month windows project onto the 52-bin week grid through an explicit month→week-span table in the methodology-constants module (week 53 is never authorable; the grid is the folded 52-bin calendar). Windows are merged into canonical cyclic ranges by the existing circular-mask machinery.
- Derived output: `ProductSeasonSummary` gains an optional `referenceSeason { ranges, basis: 'literature' | 'census' | 'mixed', sourceIds, note? }`. The summary's existing `sourceIds` remains observation-sources-only. The dataset index gains `containsEstimatedSeasons` and `schemaVersion` bumps to 2.

## UI language

- Label: "Temporada estimada (bibliografía)", prefixed "≈", ranges formatted as approximate months ("aprox. oct – feb"; full year → "todo el año (estimado)").
- The estimate renders in addition to — never instead of — the evidence badge; estimate-only products still show "Datos insuficientes".
- Timeline encoding: an "estimada (referencia)" bucket drawn as an outlined/hatched band (a texture/border channel), never a sixth solid fill competing with observed classes.
- Estimate-only products are excluded from "Ahora" current-week claims and default-sorted after observed products.
- Accessible description: "Temporada estimada según bibliografía — no proviene de observaciones de mercado."

## Guardrails

- Anti-conflation regression test: deriving with and without a phenology entry on identical observations must produce deep-equal output except for the `referenceSeason` field.
- Citation integrity: never fabricate bibliography. The registry ships empty rather than launch with invented sources; validation enforces retrievable, dated literature citations.
