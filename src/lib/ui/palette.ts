/**
 * Produce-derived product hues (design system, PROJECT.md §9 +
 * docs/design-references/NOTES.md §6): every product carries a muted
 * natural hue taken from the produce itself. Presentation-only — hues
 * never encode season class, confidence, or evidence.
 *
 * Validated (dataviz six-checks, surface #f1ebdb): lightness band, chroma
 * floor, and ≥3:1 contrast vs the chart track all pass. Adjacent-hue
 * discrimination intentionally does NOT pass for the citrus/gold cluster:
 * these hues are identity *reinforcement*, not identity — every colored
 * mark sits in a row directly labeled by its product name chip, and no
 * view asks the reader to tell products apart by color alone.
 */

import type { Product, ProductCategory } from '../data/types'

const PRODUCT_HUES: Readonly<Record<string, string>> = {
  achachairu: '#b36a1f',
  papaya: '#c66332',
  pina: '#997c14',
  mandarina: '#c4641f',
  naranja: '#a94d22',
  sandia: '#b23a4c',
  frutilla: '#9e2f3f',
  tomate: '#a63d24',
  guineo: '#8f8425',
  uva: '#6d4390',
  yuca: '#96551d',
  palta: '#567a2e',
  mango: '#b4770f',
  limon: '#6b8f26',
  durazno: '#b85a46',
}

/** Fallback hues for products added before anyone curates a hue. */
const CATEGORY_HUES: Readonly<Record<ProductCategory, string>> = {
  fruit: '#b36a1f',
  vegetable: '#6b7a2e',
  tuber: '#96551d',
  grain: '#8f8425',
  herb: '#567a2e',
  other: '#8b8272',
}

/** The product's display hue (curated per product, category fallback). */
export function productHue(product: Product): string {
  return PRODUCT_HUES[product.id] ?? CATEGORY_HUES[product.category]
}
