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

Confirmed and imported (15 survey dates across 9 bulletins):

| Year | Bulletins (survey dates) |
|---|---|
| 2014 | 2014-06-09 (Jun 4, 9) · 2014-12-08 (Dec 5, 8) |
| 2016 | 2016-05-03 (Apr 29, May 3) · 2016-09-09 (Aug 31, Sep 9) |
| 2017 | 2017-01-11 (Jan 6, 11) |
| 2018 | 2018-11-19 (Nov 16, 19) |
| 2026 | 2026-02-11 (Feb 9, 11) · 2026-02-13 (Feb 13) · 2026-02-18 (Feb 18) |

Known-but-not-yet-imported material: a third Feb-2026 issue was read and
imported; the `/diario` series shows sequential issue numbers (~1.737+,
suggesting years of frequent issues whose URLs are not enumerable from the
landing pages); `/mensual` listed Sept/Nov/Dec 2025 monthly bulletins
(direct URLs not captured yet). Years 2013, 2015, 2019–2025 have **no
confirmed retrievable bulletin so far** — status "not checked to
exhaustion", not "not published": search indexing is partial, the Wayback
Machine was unreachable from this environment (its CDX API over
`cao.org.bo` and `ibce.org.bo/images/idt_documentos/` is the single best
follow-up lead), and IBCE's folder cannot be listed directly.

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
  NXDOMAIN, 2026-09-13). Reportedly published daily/weekly wholesale price
  bulletins; retry later and via Wayback.
- **ICE / Gobernación de Santa Cruz** — one "Monitoreo de Precios al Por
  Menor 2024" PDF located (>10 MB, unread). Open lead.
- **GAMSCZ** — the Distrito 4 / Mercado Abasto page is institutional only;
  no price publications found there.
- **FAOSTAT** — annual national farm-gate producer prices only; too coarse
  for market seasonality (noted as weak evidence, unused).
- **El Deber / Publiagro** — prose articles quoting CAO prices, no tabular
  mirrors; excluded.

## Import status

The nine CAO bulletins above are transcribed to
`data/raw/cao-siprem/*.csv` (one CSV per report; every batch passed an
adversarial verifier before entering the raw layer), normalized with full
provenance (`report_id` per bulletin), and published. All other listed
material remains un-imported; nothing outside `data/raw/` feeds any score.
