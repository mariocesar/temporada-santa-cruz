# CAO/SIPREM bulletin acquisition record

First real-data import (Phase 6, PROJECT.md §101), acquired 2026-09-13.

Every report below is a price bulletin of the **Cámara Agropecuaria del
Oriente (CAO)** — "Sistema de Información de Producción, Precios y Mercados"
— covering the Abasto market of Santa Cruz de la Sierra: wholesale
(MAYORISTA ABASTO) and retail (MINORISTA ABASTO) prices with product,
origin, variety, quality, unit, and OFERTA (E=Escasa, N=Normal,
A=Abundante) columns, comparing two survey dates per issue.

Acquisition method: single polite HTTP GET per file, no credentials, no
bulk crawling. Each URL was independently re-verified (HTTP 200, PDF magic
bytes, content streams decompressed and sampled) by adversarial verifier
agents before transcription, and each transcription got its own verifier
pass before entering this directory (workflow runs `wf_6aa6a500-558` and
`wf_e58c8b4e-892`, 2026-09-13).

License: the bulletins carry CAO's own notice — *"El presente boletín es
una publicación de la Cámara Agropecuaria del Oriente y su contenido puede
ser reproducido de manera total o parcial, citando la fuente."* They are
reproduced here (`reports/`) citing CAO as the source.

## Reports

| report_id | bulletin date | dates covered | retrieved from | host role | source_id |
|---|---|---|---|---|---|
| cao-2014-06-09 | 2014-06-09 | 2014-06-04, 2014-06-09 | https://ibce.org.bo/images/idt_documentos/Precios-CAO-2014-06-09.pdf | IBCE mirror | ibce-cao-mirror |
| cao-2014-12-08 | 2014-12-08 | 2014-12-05, 2014-12-08 | https://ibce.org.bo/images/idt_documentos/Precios-CAO-2014-12-08.pdf | IBCE mirror | ibce-cao-mirror |
| cao-2016-05-03 | 2016-05-03 | 2016-04-29, 2016-05-03 | https://ibce.org.bo/images/idt_documentos/Precios-Mayorista-03-06-2016.pdf | IBCE mirror (filename date is the upload date, not the report week) | ibce-cao-mirror |
| cao-2016-09-09 | 2016-09-09 | 2016-08-31, 2016-09-09 | https://ibce.org.bo/images/idt_documentos/precios-mayoristas-09-09-2016.pdf | IBCE mirror | ibce-cao-mirror |
| cao-2017-01-11 | 2017-01-11 | 2017-01-06, 2017-01-11 | https://ibce.org.bo/images/idt_documentos/Precios-Mayoristas-11-01-2017.pdf | IBCE mirror | ibce-cao-mirror |
| cao-2018-11-19 | 2018-11-19 | 2018-11-16, 2018-11-19 | https://ibce.org.bo/images/idt_documentos/Precios-Mayoristas-19-11-2018.pdf | IBCE mirror | ibce-cao-mirror |
| cao-2026-02-11 | 2026-02-11 | 2026-02-09, 2026-02-11 | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_46585aaac67d4710985da4637689e4ff.pdf | CAO's own distribution site (agrodatos.com.bo) | cao-siprem |
| cao-2026-02-13 | 2026-02-13 | 2026-02-11, 2026-02-13 | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_39276327b71b465d807d232a6b8a527e.pdf | CAO's own distribution site | cao-siprem |
| cao-2026-02-18 | 2026-02-18 | 2026-02-13, 2026-02-18 | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_6dab5b26054044ccab05189bb958eec7.pdf | CAO's own distribution site | cao-siprem |

The agrodatos.com.bo landing pages link only the most recent issues and the
files are served `x-robots-tag: noindex`, so local copies are archived under
`reports/` — the URLs above may stop being listed even though the content is
immutable.

## Transcription decisions

- **Both survey dates are transcribed** from each bulletin (the earlier
  column is a real CAO survey we have no other report for), EXCEPT where a
  neighbouring transcribed bulletin already covers that date: from
  `cao-2026-02-13` only 2026-02-13 was taken (2026-02-11 comes from
  `cao-2026-02-11`), and from `cao-2026-02-18` only 2026-02-18 (2026-02-13
  comes from `cao-2026-02-13`). This avoids double-counting one physical
  observation via two bulletins.
- **OFERTA belongs to the bulletin's own date**: earlier-date rows carry an
  empty `availability` (normalized to `unknown`), never a copied letter.
- **`S/E` (sin especificar) cells become empty cells** for origin, variety,
  and quality: the bulletin explicitly recorded "unspecified", which must
  normalize to absent evidence (an "S/E" origin entry would wrongly enter
  the local-share denominator, §31).
- **Scope**: only rows for products in `data/metadata/products.json` are
  transcribed (§101 priority list plus palta, limón, mango, tomate, yuca).
  The bulletins carry many more lines (LIMA, MANGA, MANZANA, PERA, MELON,
  CIRUELO, PLATANO, hortalizas…) that stay untranscribed for now — see the
  full PDFs. LIMA ≠ LIMON and MANGA ≠ MANGO; they are never merged.
- Decimal commas in the source become dots; all other cell text is verbatim.
- **A price printed as `0,0` is transcribed as an empty cell** (for that
  date only): the bulletins use `0,0` — typically with `S/D` in the VAR
  column — for "no price recorded", and a literal 0 would enter the §54
  price signals as a real market price. The presence of the row itself
  still counts as an observation.
- A missing bulletin for any week is NOT evidence a product was absent
  (§30) — coverage is 16 scattered survey dates across 2014–2026, and the
  report-coverage index reflects exactly that.

## Batch 2 (2026-09-13) — Wayback/IBCE/agrodatos recovery, 21 bulletins

Acquired the same day via the Wayback CDX sweep documented in
`docs/DATA_SOURCES.md`. Same acquisition ethic: one polite GET per file
(Wayback snapshot or live server), no credentials, no bulk crawling.
Transcription: one `data-transcriber` agent per bulletin, then one
adversarial `verifier` agent per bulletin re-deriving the expectation from
the extracted text independently (workflow run `wf_a854b712-5ea`);
20/21 transcriptions CONFIRMED on first verification, 1 (cao-2014-06-11)
confirmed content-correct but flagged for unnecessary CSV quoting on two
unit cells, fixed mechanically and re-checked. Nothing entered this
directory unverified.

| report_id | dates covered | retrieved from | source_id |
|---|---|---|---|
| cao-2012-09-13 | 2012-09-10, 2012-09-13 | Wayback 20121011070410 of http://cao.org.bo/archivos/descargas/Precios%20Mayorista%2013-09-2012.pdf | cao-siprem |
| cao-2012-09-17 | 2012-09-17 (09-13 from cao-2012-09-13) | Wayback 20121011070131, same folder | cao-siprem |
| cao-2012-12-10 | 2012-12-06, 2012-12-10 | Wayback 20130122124825, same folder | cao-siprem |
| cao-2013-01-14 | 2013-01-10, 2013-01-14 | Wayback 20130122124829, same folder | cao-siprem |
| cao-2013-02-14 | 2013-02-07, 2013-02-14 | Wayback 20130316104000, same folder | cao-siprem |
| cao-2013-02-18 | 2013-02-18 (02-14 from cao-2013-02-14) | Wayback 20130316103925, same folder | cao-siprem |
| cao-2013-05-06 | 2013-05-02, 2013-05-06 | Wayback 20130816231003, same folder | cao-siprem |
| cao-2013-05-09 | 2013-05-09 (05-06 from cao-2013-05-06) | Wayback 20130816204615, same folder | cao-siprem |
| cao-2013-07-25 | 2013-07-18, 2013-07-25 | Wayback 20130822143404 of http://www.ibce.org.bo/images/idt_documentos/Precios-CAO-2013-07-25.pdf (404 on the live server) | ibce-cao-mirror |
| cao-2014-04-23 | 2014-04-21, 2014-04-23 | https://ibce.org.bo/images/idt_documentos/Precios-CAO-2014-04-23.pdf (live, unlisted) | ibce-cao-mirror |
| cao-2014-06-11 | 2014-06-11 (06-09 already imported via cao-2014-06-09) | https://ibce.org.bo/images/idt_documentos/Precios-CAO-2014-06-11.pdf (live, unlisted) | ibce-cao-mirror |
| cao-2015-02-11 | 2015-02-04, 2015-02-11 | https://ibce.org.bo/images/idt_documentos/Precios-CAO-2015-02-11.pdf (live, unlisted) | ibce-cao-mirror |
| cao-2025-12-01 | 2025-11-28, 2025-12-01 | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_54dc189712cd41d09b054d3a6071545c.pdf | cao-siprem |
| cao-2025-12-03 | 2025-12-03 (12-01 from cao-2025-12-01) | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_1b77e91a1c824800a0e09a4781d0d028.pdf | cao-siprem |
| cao-2025-12-05 | 2025-12-05 (12-03 from cao-2025-12-03) | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_3be9ba321e4c4a4c9d8618d9cf098f2b.pdf | cao-siprem |
| cao-2025-12-10 | 2025-12-08, 2025-12-10 | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_e982f6962b144a34a22837523538216e.pdf | cao-siprem |
| cao-2025-12-12 | 2025-12-12 (12-10 from cao-2025-12-10) | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_d0858fad1b264405a2c50811c33d820f.pdf | cao-siprem |
| cao-2025-12-15 | 2025-12-15 (12-12 from cao-2025-12-12) | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_a1df382f9b68423596b61dc6de23d617.pdf | cao-siprem |
| cao-2026-01-21 | 2026-01-16, 2026-01-21 | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_356a925baddb468780f98cb60a297944.pdf | cao-siprem |
| cao-2026-01-26 | 2026-01-23, 2026-01-26 | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_f55fb07f46b445838f582cd57da57c9c.pdf | cao-siprem |
| cao-2026-01-28 | 2026-01-28 (01-26 from cao-2026-01-26) | https://www.agrodatos.com.bo/_files/ugd/6c3b2e_a29d931e120a44298bea0ffa13a33f2b.pdf | cao-siprem |

Wayback snapshot URLs are `https://web.archive.org/web/<timestamp>id_/<original URL>`.
All transcription decisions from the first batch apply unchanged, plus one
new one:

- **`row_seq` print-order discriminator.** The 2013-07-25 bulletin uses a
  reduced layout with NO Origen and NO Calidad columns, yet still prints
  quality-tiered duplicate lines (e.g. two "LIMON / Amarillo / 100
  Unidades" lines at different prices). Members of such a group carry
  `row_seq` 1, 2, … in print order — a structural provenance fact (the
  line's position in the immutable PDF), not an invented cell value — and
  the observation ID includes it only when present, so every other
  observation ID in the dataset is unchanged. See `row_seq` in
  `scripts/data/schemas.ts`.
