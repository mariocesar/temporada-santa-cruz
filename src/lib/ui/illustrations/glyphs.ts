/**
 * Botanical glyph geometry — Tier 2 of the illustration policy
 * (docs/design-references/NOTES.md, "Illustration policy", owner decision
 * 2026-09-13): original hand-drawn flat vector iconography that is honest
 * about being modern. Never faux-vintage, never generated painterly art.
 *
 * Visual language (owner pick, 2026-09-13): single-stroke ink line art —
 * a seed-catalogue engraving. Each glyph is drawn on a 48×48 grid and
 * stroked in the product's produce-derived hue (src/lib/ui/palette.ts)
 * with a faint wash of the same hue inside the closed silhouettes.
 *
 * Provenance for every glyph lives in ./registry.ts — artwork gets the same
 * traceability as data. A glyph is decoration: it never encodes season,
 * confidence, or evidence, and the layout never requires one to exist
 * (graceful omission, policy §3).
 */

export interface Glyph {
  /**
   * Closed silhouettes, painted with a faint hue wash and an ink contour.
   * The FIRST entry is the body — `clip` (below) clips details to it.
   */
  shapes: ReadonlyArray<string>
  /** Stroke-only detail marks: veins, ribs, facets, cut lines. */
  lines?: ReadonlyArray<string>
  /** Seed marks as `[cx, cy, r]`, filled with the hue. */
  dots?: ReadonlyArray<readonly [number, number, number]>
  /**
   * Clip `lines` and `dots` to the body silhouette, so surface texture
   * (pineapple hatching, melon seeds) never bleeds past the contour.
   */
  clip?: boolean
}

/** All glyphs share one square grid so sizes stay interchangeable. */
export const GLYPH_VIEWBOX = 48

const ACHACHAIRU: Glyph = {
  shapes: [
    // Thick round rind, barely taller than wide.
    'M 24,13.5 C 32.5,13.5 38,20 38,27.5 C 38,35.5 31.5,41.5 24,41.5 C 16.5,41.5 10,35.5 10,27.5 C 10,20 15.5,13.5 24,13.5 Z',
    // Four-sepal crown, the achachairú's tell.
    'M 24,13.8 C 19.5,13 16.3,10.5 15.4,6.8 C 19.6,7.6 22.6,9.9 24,13.8 Z',
    'M 24,13.8 C 28.5,13 31.7,10.5 32.6,6.8 C 28.4,7.6 25.4,9.9 24,13.8 Z',
  ],
  lines: [
    'M 24,10 L 24,5.5',
    // Rind highlight.
    'M 16.4,24.4 C 17.9,21.8 19.8,20.4 21.8,19.9',
  ],
}

const PAPAYA: Glyph = {
  shapes: [
    // Halved: the seed cavity is what makes a papaya unmistakable — whole,
    // it reads as any other ovoid fruit in the set.
    'M 24,6 C 30.2,10.2 35.2,18.4 35.2,27.2 C 35.2,36.6 30.2,43 24,43 C 17.8,43 12.8,36.6 12.8,27.2 C 12.8,18.4 17.8,10.2 24,6 Z',
    'M 24,15 C 28.2,17.8 30.6,22.8 30.6,27.8 C 30.6,33.6 27.7,38 24,38 C 20.3,38 17.4,33.6 17.4,27.8 C 17.4,22.8 19.8,17.8 24,15 Z',
  ],
  lines: ['M 24,6.6 L 24,3.2'],
  dots: [
    [24, 22.5, 1.15],
    [21.4, 25.8, 1.15],
    [26.6, 25.8, 1.15],
    [23.9, 29.2, 1.15],
    [21.2, 32, 1.15],
    [26.6, 32, 1.15],
    [24, 35, 1.15],
  ],
  clip: true,
}

const PINA: Glyph = {
  shapes: [
    'M 24,20 C 31,20 35.5,24.5 35.5,31 C 35.5,38 30.5,43.5 24,43.5 C 17.5,43.5 12.5,38 12.5,31 C 12.5,24.5 17,20 24,20 Z',
    // Crown: five blades fanning from the shoulder.
    'M 24,20.5 C 22.9,15 22.9,10 24,4.5 C 25.1,10 25.1,15 24,20.5 Z',
    'M 23.2,20.6 C 19.2,16.8 16.2,13.2 14.2,8.8 C 18.6,11.3 21.5,15.2 23.6,20.2 Z',
    'M 24.8,20.6 C 28.8,16.8 31.8,13.2 33.8,8.8 C 29.4,11.3 26.5,15.2 24.4,20.2 Z',
    'M 22,21.4 C 17.6,20 13.6,17.9 10.2,14.4 C 13.2,19 17.2,21.6 21.6,22.6 Z',
    'M 26,21.4 C 30.4,20 34.4,17.9 37.8,14.4 C 34.8,19 30.8,21.6 26.4,22.6 Z',
  ],
  lines: [
    'M 12,26 L 24,38',
    'M 18,20 L 34,36',
    'M 26,19 L 36,29',
    'M 36,26 L 24,38',
    'M 30,20 L 14,36',
    'M 22,19 L 12,29',
  ],
  clip: true,
}

const MANDARINA: Glyph = {
  shapes: [
    // Flattened sphere: mandarina is wider than it is tall.
    'M 10,29 C 10,22.8 15.8,18 23,18 C 30.2,18 36,22.8 36,29 C 36,35.2 30.2,40 23,40 C 15.8,40 10,35.2 10,29 Z',
    'M 27.2,11.8 C 31,7.8 36.2,6.5 40.5,7.2 C 39.4,11.8 34.8,14.8 29.6,14.2 Z',
  ],
  lines: [
    'M 23,18.2 C 23.6,15.4 25.2,13.2 27.2,11.8',
    'M 28.8,13.4 C 32.2,11.6 35.8,9.6 38.8,8.3',
    // Peel dimple.
    'M 20.8,19 C 21.8,17.4 24.2,17.4 25.2,19',
  ],
}

const NARANJA: Glyph = {
  shapes: [
    'M 23,15.5 C 29.9,15.5 35.5,21.1 35.5,28 C 35.5,34.9 29.9,40.5 23,40.5 C 16.1,40.5 10.5,34.9 10.5,28 C 10.5,21.1 16.1,15.5 23,15.5 Z',
    // An upright leaf, where the mandarina's lies flat — the two round
    // citrus never read as the same drawing.
    'M 27.5,9.8 C 29.4,5.2 33.8,2 38.6,1.6 C 38.9,6.6 35.3,11.4 30.3,12.6 Z',
  ],
  lines: [
    'M 23,15.6 C 23.8,13.4 25.6,11.4 27.5,9.8',
    'M 29.2,11.4 C 31.5,8.4 34.4,5.3 37.2,3.4',
    'M 14.6,23.4 C 16.6,20.1 19.1,18.4 21.9,17.9',
  ],
}

const SANDIA: Glyph = {
  shapes: [
    // A wedge — the way a sandía actually reaches a table. The rind arc
    // bulges well below the corners so it reads as a slice, not a cone.
    'M 24,7 L 41,30.5 C 36.5,40.5 11.5,40.5 7,30.5 Z',
  ],
  lines: ['M 38.9,28 C 34.6,36.8 13.4,36.8 9.1,28'],
  dots: [
    [19, 21.5, 1.4],
    [28, 23, 1.4],
    [23.5, 28, 1.4],
    [31.5, 29, 1.4],
    [16, 28.5, 1.4],
  ],
  clip: true,
}

const FRUTILLA: Glyph = {
  shapes: [
    'M 24,15 C 31,15 36.5,19.5 36.5,25.5 C 36.5,33 30,40.5 24,44 C 18,40.5 11.5,33 11.5,25.5 C 11.5,19.5 17,15 24,15 Z',
    'M 24,15.2 C 22.9,11.4 22.9,8.6 24,6 C 25.1,8.6 25.1,11.4 24,15.2 Z',
    'M 22.4,15.6 C 18.4,14.2 15.2,11.8 13,8.6 C 17.2,9.8 20.6,12.3 23.2,15.4 Z',
    'M 25.6,15.6 C 29.6,14.2 32.8,11.8 35,8.6 C 30.8,9.8 27.4,12.3 24.8,15.4 Z',
  ],
  lines: ['M 24,7.5 L 24,3.8'],
  dots: [
    [19.5, 22, 0.95],
    [27.5, 21.5, 0.95],
    [23.5, 26.5, 0.95],
    [30.5, 27, 0.95],
    [17, 28, 0.95],
    [26.5, 32.5, 0.95],
    [20.5, 33, 0.95],
    [24, 38, 0.95],
  ],
  clip: true,
}

const TOMATE: Glyph = {
  shapes: [
    // Distinctly wider than tall — the squat profile is what separates a
    // tomate from every round fruit in the set.
    'M 24,17.5 C 33.5,17.5 39.5,22.5 39.5,29 C 39.5,35.5 33,40.5 24,40.5 C 15,40.5 8.5,35.5 8.5,29 C 8.5,22.5 14.5,17.5 24,17.5 Z',
    // Calyx: four sepals lying almost flat over the shoulders. Anything
    // more upright, or any full rib, turns a tomate into a pumpkin.
    'M 24,17.8 C 19.4,17.6 15.4,16 12.4,13.2 C 16.8,13 21,14.6 24,17.8 Z',
    'M 24,17.8 C 28.6,17.6 32.6,16 35.6,13.2 C 31.2,13 27,14.6 24,17.8 Z',
    'M 23.6,17.6 C 21.6,15 20.4,11.8 20.4,9 C 22.6,11.2 23.8,14.2 24.4,17.4 Z',
    'M 24.4,17.6 C 26.4,15 27.6,11.8 27.6,9 C 25.4,11.2 24.2,14.2 23.6,17.4 Z',
  ],
  lines: ['M 24,13 L 24,8.4'],
  clip: true,
}

const GUINEO: Glyph = {
  shapes: [
    // A real crescent: blunt at the stem, tapering to a tip, thickest
    // through the belly of the curve.
    'M 14,10 C 9.5,20 11,31.5 19,38 C 24,42 31,43.5 37,42.5 C 39.5,42 40,39.5 37.6,38.8 C 31,37 25.5,34 22,29 C 18,23.4 17.6,16.5 19.2,10.8 C 20,7.8 14.8,7.4 14,10 Z',
  ],
  lines: ['M 17.6,13.4 C 15.4,22 18,30.4 24.6,35.4', 'M 16.8,8.6 L 16,4.2'],
  clip: true,
}

const UVA: Glyph = {
  shapes: [
    // Berries, top row widest — the bunch tapers to a single grape.
    'M 15.5,21 A 4.6,4.6 0 1,0 15.5,30.2 A 4.6,4.6 0 1,0 15.5,21 Z',
    'M 24,21 A 4.6,4.6 0 1,0 24,30.2 A 4.6,4.6 0 1,0 24,21 Z',
    'M 32.5,21 A 4.6,4.6 0 1,0 32.5,30.2 A 4.6,4.6 0 1,0 32.5,21 Z',
    'M 19.8,28 A 4.6,4.6 0 1,0 19.8,37.2 A 4.6,4.6 0 1,0 19.8,28 Z',
    'M 28.2,28 A 4.6,4.6 0 1,0 28.2,37.2 A 4.6,4.6 0 1,0 28.2,28 Z',
    'M 24,34.6 A 4.6,4.6 0 1,0 24,43.8 A 4.6,4.6 0 1,0 24,34.6 Z',
    // Vine leaf.
    'M 22.2,15.4 C 17.6,10.2 11.6,8.6 7,10.4 C 8.2,15.8 13.2,19.6 18.4,19.2 Z',
  ],
  lines: ['M 24,20.6 L 24,14.2 C 24,11.6 26,9.6 28.6,9.2', 'M 19.6,17.6 C 15.8,16 12.2,13.8 9.2,11.6'],
}

const YUCA: Glyph = {
  shapes: [
    // Thick at the cut end, tapering to a tip: a cassava root is a cone
    // with a bend, not a rod.
    // A straight chopped face at the wide end, a long cone down to the
    // tip, and lateral rootlets — the three things that say cassava.
    'M 16.2,8.6 L 25.6,6 C 28.2,11 29,17.4 28.4,24 C 27.9,30.2 29,35.8 30.6,40.8 C 31.2,42.6 29.2,43.4 28.4,41.7 C 25.6,36.1 23,30 21.4,23.8 C 19.8,17.6 17.8,12.6 16.2,8.6 Z',
  ],
  lines: [
    'M 17.4,11 C 20.4,10.4 23.6,9.6 26.4,8.6',
    'M 22.2,26 C 20.2,28.4 17.6,29.6 14.6,29.8',
    'M 25,34.4 C 23.4,36.8 21.2,38.4 18.6,39.2',
  ],
}

const PALTA: Glyph = {
  shapes: [
    'M 24,7 C 29,7 31.5,11.5 30.5,16.5 C 29.5,21 35,24.5 35,31 C 35,38 30,43.5 24,43.5 C 18,43.5 13,38 13,31 C 13,24.5 18.5,21 17.5,16.5 C 16.5,11.5 19,7 24,7 Z',
    // Halved: the pit is what makes a palta unmistakable.
    'M 18.5,31 A 5.5,5.5 0 1,0 29.5,31 A 5.5,5.5 0 1,0 18.5,31 Z',
  ],
  lines: [
    'M 24,10.8 C 27.4,10.8 28.7,13.7 27.9,17.1 C 26.7,22.2 31.7,25.5 31.7,31 C 31.7,36.4 27.8,40.3 24,40.3 C 20.2,40.3 16.3,36.4 16.3,31 C 16.3,25.5 21.3,22.2 20.1,17.1 C 19.3,13.7 20.6,10.8 24,10.8 Z',
    'M 24,7 L 24,3.8',
  ],
}

const MANGO: Glyph = {
  shapes: [
    // Tilted and lopsided: shoulder at the stem, beak at the far end.
    // Lopsided on purpose: high shoulder at the stem, heavy cheek at the
    // far end, and a slight beak where the two meet.
    'M 19.5,10.5 C 25,6.6 32.5,6.6 36.4,11.8 C 40.6,17.4 39.4,27 33.8,34 C 28.2,41 19.2,44 14.4,39.8 C 9.8,35.8 10.6,28 13.2,21.4 C 14.8,17.2 16.8,13.4 19.5,10.5 Z',
    'M 26.2,4.2 C 29.8,2.1 34.4,2.4 37.2,4.6 C 34.7,8 30,8.9 26.6,7.2 Z',
  ],
  lines: [
    'M 25.4,7.6 C 25.6,5.8 25.8,4.8 26.2,4.2',
    'M 27.6,5.8 C 30.4,5 33.4,5 35.7,5.5',
    'M 17.8,17.4 C 15.4,23 15.2,30.2 17.4,36',
  ],
  clip: true,
}

const LIMON: Glyph = {
  shapes: [
    // Cut wheel: a limón reaches a cruceño table halved, and the wheel
    // keeps it from reading as another orange sphere.
    'M 23,15 A 13,13 0 1,0 23,41 A 13,13 0 1,0 23,15 Z',
  ],
  lines: [
    'M 23,17.6 A 10.4,10.4 0 1,0 23,38.4 A 10.4,10.4 0 1,0 23,17.6 Z',
    'M 23,28 L 33.4,28',
    'M 23,28 L 28.2,37',
    'M 23,28 L 17.8,37',
    'M 23,28 L 12.6,28',
    'M 23,28 L 17.8,19',
    'M 23,28 L 28.2,19',
  ],
}

const DURAZNO: Glyph = {
  shapes: [
    'M 24,14 C 32,14 38,20 38,28 C 38,36 31.5,42 24,42 C 16.5,42 10,36 10,28 C 10,20 16,14 24,14 Z',
    'M 25,10.6 C 28.6,7.2 33.4,6.2 36.8,7.2 C 35.8,11.2 31.2,13.6 26.8,12.6 Z',
  ],
  lines: [
    'M 24.4,14.2 L 24.8,10.6',
    // The suture down the front.
    'M 23.4,14.6 C 20.4,21 20.4,29.6 22.4,36.2',
    'M 27.4,11.6 C 30.2,10.1 33.2,8.7 35.2,8',
  ],
  clip: true,
}

/**
 * Glyph per product id. A product without an entry renders nothing — the
 * layout must never require an illustration (policy §3).
 */
export const GLYPHS: Readonly<Record<string, Glyph>> = {
  achachairu: ACHACHAIRU,
  papaya: PAPAYA,
  pina: PINA,
  mandarina: MANDARINA,
  naranja: NARANJA,
  sandia: SANDIA,
  frutilla: FRUTILLA,
  tomate: TOMATE,
  guineo: GUINEO,
  uva: UVA,
  yuca: YUCA,
  palta: PALTA,
  mango: MANGO,
  limon: LIMON,
  durazno: DURAZNO,
}

export function glyphFor(productId: string): Glyph | null {
  return GLYPHS[productId] ?? null
}
