# Data sources — inventory and coverage

Reconnaissance and first import performed 2026-09-13 (Phase 6, PROJECT.md
§101) through a multi-agent sweep: one scout per source, every claimed URL
independently re-verified by adversarial verifier agents (HTTP status,
content type, decompressed content samples) before anything was trusted.
The source registry consumed by the pipeline is
`data/metadata/sources.json`; per-report acquisition detail lives in
`data/raw/cao-siprem/ACQUISITION.md`.

**Standing rule (§30): a missing report is never evidence a product was
absent.** Coverage below is honestly sparse; the report-coverage index in
the derived layer reflects exactly which week bins have evidence.

## CAO / SIPREM — primary market source ✅ imported

Bulletins of the Cámara Agropecuaria del Oriente ("Sistema de Información
de Producción, Precios y Mercados"): wholesale + retail prices for the
Abasto market of Santa Cruz de la Sierra, with product, origin, variety,
quality, unit and OFERTA (E=Escasa / N=Normal / A=Abundante) per row, two
survey dates per issue (roughly twice-weekly cadence). This is the exact
schema the project models, and the strongest primary source found.

Distribution channels:

- **cao.org.bo/servicios/siprem/** — the live interactive service is a
  paid/registered subscription (Plan Pro / Económico / Gratis). Not
  bypassed; scope of the free tier unknown.
- **agrodatos.com.bo** (`/mercados`, `/diario`, `/mensual`) — CAO's own
  content site (same contacts, "Elaboración: CAO - Planificación"): the
  most recent bulletins as free direct PDFs. No archive index visible;
  files are served `noindex`, so imported issues are archived under
  `data/raw/cao-siprem/reports/`.
- **ibce.org.bo/images/idt_documentos/** — the Instituto Boliviano de
  Comercio Exterior republishes historical CAO bulletins as PDFs
  (registered as the `ibce-cao-mirror` source; mirrors are access, not
  independent evidence, §66–67).
- The archive the bulletins themselves advertise
  (`www.cao.org.bo/sitio/index.php/descargas`) is 404 since the CAO site
  redesign.

License: each bulletin states its content "puede ser reproducido de manera
total o parcial, citando la fuente" — reproduced here citing CAO.

Confirmed and imported (49 survey dates across 30 bulletins after the
second batch — see `data/raw/cao-siprem/ACQUISITION.md` for per-report
provenance):

| Year | Survey dates covered |
|---|---|
| 2012 | Sep 10, 13, 17 · Dec 6, 10 |
| 2013 | Jan 10, 14 · Feb 7, 14, 18 · May 2, 6, 9 · Jul 18, 25 |
| 2014 | Apr 21, 23 · Jun 4, 9, 11 · Dec 5, 8 |
| 2015 | Feb 4, 11 |
| 2016 | Apr 29 · May 3 · Aug 31 · Sep 9 |
| 2017 | Jan 6, 11 |
| 2018 | Nov 16, 19 |
| 2025 | Nov 28 · Dec 1, 3, 5, 8, 10, 12, 15 |
| 2026 | Jan 16, 21, 23, 26, 28 · Feb 9, 11, 13, 18 |

March and October have no real survey date in any recovered year — the
report-coverage index and the timeline's dashed no-evidence weeks reflect
exactly that gap.

Wayback CDX follow-up (second sweep, 2026-09-13) — the lead paid off and
also resolved two earlier misreadings:

- **`/diario`–`/diarios` and `/mensual`–`/mensuales` are NOT price
  bulletins.** The sequential numbering (~1.737+) belongs to CAO's "AGRO
  DATOS" news digest (international news, CBOT closes, SENAMHI climate
  panels, adverts). Verified by full-text extraction of the complete live
  `/diarios` archive index (627 issues, 2017–2020) plus samples from every
  year and a visual page-by-page check: no MAYORISTA ABASTO table in any of
  them. Documented absence — do not re-mine this series for prices.
- **The Abasto price-bulletin series distributes via `/mercados`.** A
  Wayback capture of that page (2025-12-09) plus directly archived PDFs
  yielded nine additional bulletins (2025-12-01 … 2026-01-28), all still
  live on agrodatos' immutable Wix media store and now imported. The page
  stopped updating after Feb-2026 — the 2026-06-13 capture still lists the
  three Feb-2026 issues.
- **`cao.org.bo/archivos/descargas/` (pre-2014 site) via Wayback:** eight
  "Precios Mayorista" bulletins 2012-09 … 2013-05 archived with HTTP 200,
  all imported. Two more (2012-12-17, 2012-12-20) were captured only as
  404s — lost unless another mirror surfaces.
- **Joomla-era `cao.org.bo/sitio/index.php/descargas` (2015–2018):** the
  paginated listings are archived, but only four download endpoints were
  ever captured: two duplicate the already-imported 2016-05-03 bulletin,
  two are CAO-SIPREM annual price spreadsheets (FAO producer prices /
  agroindustrial series — not Abasto bulletins). The rest of that era's
  bulletin downloads were never archived.
- **IBCE's folder still serves unlisted historical files:** probing the
  `Precios-CAO-YYYY-MM-DD.pdf` filenames found in Wayback recovered three
  live PDFs (2014-04-23, 2014-06-11, 2015-02-11) plus one Wayback-only
  (2013-07-25), all imported. A site-wide Wayback sweep of `ibce.org.bo`
  for "precios" documents found nothing further (only international-price
  CIFRAS bulletins).

After this sweep, years **2019 – early 2025 have no retrievable bulletin
anywhere public** — still "not checked to exhaustion", but the cheap
channels are now exhausted; what remains is the paid SIPREM subscription,
CAO social-media accounts, or physical archives.

## SIIP (siip.produccion.gob.bo) — blocked for now

Government price system (MDRyT/DAPRO). The daily wholesale price form
(`formSispamDiario.php`) renders no data without client-side JavaScript
(likely POST/AJAX); a year selector suggests 2011–2022 history but no data
row was ever observed. Its `robots.txt` disallows the */mobile/* price
paths (respected). The special-bulletins index (`boletines2.php`, 99 PDFs)
was checked and **confirmed to contain no fruit/Abasto price series** —
documented absence, not a gap. Follow-up: a JS-capable session against the
desktop form (not robots-disallowed) to establish whether Santa
Cruz/product-level rows and exports exist.

## INE — census prior ⚠ published volumes lack the harvest calendar

- Censo Agropecuario 2013 volumes are retrievable (Santa Cruz departmental
  PDF 14.9 MB/389 pp, national 3.2 MB/145 pp, nimbus.ine.gob.bo links on
  the publication pages). **Verified finding: neither published volume
  contains "mes de siembra / mes de cosecha" tables** (full-text extraction
  found only narrative/glossary mentions). The month-level harvest prior
  §34 anticipated must come from census *microdata* — the ANDA/NADA catalog
  (`anda.ine.gob.bo/index.php/catalog/24`) returned 404/500 to plain
  fetches — or from other sources.
- The Santa Cruz volume DOES hold crop-level **annual** tables at provincia
  granularity (achachairú, papaya, durazno, naranja, mandarina, sandía,
  piña, banano present) — usable as geographic/annual evidence only.
- Recurring annual series (production/yield/area by department, 1984–2025,
  XLSX on nube.ine.gob.bo) verified retrievable — annual, department-level,
  no month dimension.
- `censoagro.ine.gob.bo` now serves recruitment for a NEW 2026 agricultural
  census; the old 2013 query tool is gone from that URL.

## Other sources checked

- **OAP (observatorioagro.gob.bo)** — domain does not resolve (DNS
  NXDOMAIN, 2026-09-13). Wayback checked (second sweep, same day): ~400
  weekly "Boletín semanal" PDFs 2013–2020 ARE archived
  (`…/documento/semanal/semanal_YYYY/`, ~50 per year, ≥43 even in 2019).
  Basket verified on 2015 and 2017 samples: staples only (papa, tomate
  híbrido, cebolla, zanahoria, arroz, carne…) with weekly Fri/Sat prices
  per city incl. Santa Cruz. **Tomate is the only §45 overlap** — a
  documented lead for a tomato-only import (weekly price, Bs/45 lb, no
  OFERTA column, no origin), deliberately deferred: ~400 PDFs of
  transcription for one product.
- **ICE / Gobernación de Santa Cruz** — one "Monitoreo de Precios al Por
  Menor 2024" PDF located (>10 MB, unread). Open lead.
- **GAMSCZ** — the Distrito 4 / Mercado Abasto page is institutional only;
  no price publications found there.
- **FAOSTAT** — annual national farm-gate producer prices only; too coarse
  for market seasonality (noted as weak evidence, unused).
- **El Deber / Publiagro** — prose articles quoting CAO prices, no tabular
  mirrors; excluded.

## Import status

The 30 CAO bulletins above are transcribed to
`data/raw/cao-siprem/*.csv` (one CSV per report; every batch passed an
adversarial verifier before entering the raw layer — batch 1: three
transcriptions rejected, repaired and re-verified from scratch; batch 2:
20/21 confirmed first-pass, one content-correct transcription fixed for a
CSV quoting nit and re-checked), normalized with full provenance
(`report_id` per bulletin), and published. All other listed material
remains un-imported; nothing outside `data/raw/` feeds any score.

**The demo seed is retired (2026-09-13).** The published dataset is
real-only: 1,575 observations, 49 survey dates, 9 years (2012–2018,
2025–2026). Every product except mango classifies on real evidence alone
(confianza alta for all but palta, which is honestly media at 3 years);
mango remains "Datos insuficientes" with its literature-only estimated
season — exactly the §104 display. `bun run seed:demo` still generates the
clearly-marked synthetic seed for local UI work behind `ALLOW_DEMO_DATA`
(§79), but no synthetic row ships, CI no longer sets the flag, and the
build drops unreferenced synthetic sources from the public dataset.

| Product | Real rows | Survey dates | Years |
|---|---|---|---|
| tomate | 196 | 49 | 2012–2018, 2025–2026 |
| uva | 172 | 49 | 2012–2018, 2025–2026 |
| sandía | 168 | 47 | 2012–2018, 2025–2026 |
| guineo (incl. BANANO rows) | 164 | 49 | 2012–2018, 2025–2026 |
| durazno | 153 | 44 | 2012–2018, 2025–2026 |
| limón | 147 | 49 | 2012–2018, 2025–2026 |
| frutilla | 98 | 49 | 2012–2018, 2025–2026 |
| papaya | 98 | 49 | 2012–2018, 2025–2026 |
| piña | 98 | 49 | 2012–2018, 2025–2026 |
| naranja | 81 | 49 | 2012–2018, 2025–2026 |
| mandarina | 60 | 29 | 2012–2014, 2016–2018, 2026 |
| achachairú | 52 | 28 | 2013–2015, 2017–2018, 2025–2026 |
| yuca | 49 | 49 | 2012–2018, 2025–2026 |
| palta | 39 | 19 | 2018, 2025–2026 |
| mango | 0 | — | absent from every imported bulletin; literature-only estimated season |

Product absences from individual bulletins (achachairú outside its season,
palta before 2018) are seasonal/coverage signal handled by presence
probability — never "proof of absence" (§30).
