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
- A missing bulletin for any week is NOT evidence a product was absent
  (§30) — coverage is 15 scattered survey dates across 2014–2026, and the
  report-coverage index reflects exactly that.
