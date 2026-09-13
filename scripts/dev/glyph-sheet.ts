/**
 * Dev-only contact sheet for the botanical glyphs. Renders every glyph at
 * chip, card and poster sizes so the drawings can be judged (and fixed) as
 * a set. Writes .playwright-mcp/glyph-sheet.html, which is gitignored.
 *
 *   bun scripts/dev/glyph-sheet.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { GLYPHS, GLYPH_VIEWBOX, type Glyph } from '../../src/lib/ui/illustrations/glyphs'

const HUES: Record<string, string> = {
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

function svg(id: string, glyph: Glyph, size: number, stroke: number, grid: boolean): string {
  const hue = HUES[id] ?? '#8b8272'
  const clipId = `clip-${id}-${size}`
  const shapes = glyph.shapes
    .map((d) => `<path d="${d}" fill="${hue}" fill-opacity="0.1" />`)
    .join('')
  const lines = (glyph.lines ?? []).map((d) => `<path d="${d}" fill="none" />`).join('')
  const dots = (glyph.dots ?? [])
    .map((d) => `<circle cx="${d[0]}" cy="${d[1]}" r="${d[2]}" fill="${hue}" fill-opacity="0.55" stroke="none" />`)
    .join('')
  const defs = glyph.clip
    ? `<defs><clipPath id="${clipId}"><path d="${glyph.shapes[0]}" /></clipPath></defs>`
    : ''
  const guides = grid
    ? `<g stroke="#d8cfba" stroke-width="0.5" vector-effect="non-scaling-stroke">
         <rect x="0" y="0" width="${GLYPH_VIEWBOX}" height="${GLYPH_VIEWBOX}" fill="none" />
         <line x1="24" y1="0" x2="24" y2="48" /><line x1="0" y1="24" x2="48" y2="24" />
       </g>`
    : ''
  return `<svg viewBox="0 0 ${GLYPH_VIEWBOX} ${GLYPH_VIEWBOX}" width="${size}" height="${size}"
    style="overflow:visible;stroke:${hue};stroke-width:${stroke};stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke">
    ${guides}${defs}${shapes}
    <g clip-path="${glyph.clip ? `url(#${clipId})` : ''}" vector-effect="non-scaling-stroke">${lines}${dots}</g>
  </svg>`
}

const cells = Object.entries(GLYPHS)
  .map(
    ([id, glyph]) => `<figure>
      <div class="row">
        ${svg(id, glyph, 112, 1.75, true)}
        ${svg(id, glyph, 48, 1.5, false)}
        ${svg(id, glyph, 22, 1.25, false)}
      </div>
      <figcaption>${id}</figcaption>
    </figure>`,
  )
  .join('\n')

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><title>Glyph contact sheet</title>
<style>
  body { background:#fbf8f0; color:#2a2620; font-family: system-ui, sans-serif; margin:0; padding:24px; }
  h1 { font-size:18px; margin:0 0 16px; }
  .sheet { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:18px; }
  figure { margin:0; background:#fffdf7; border:1px solid #e6dfcc; border-radius:4px; padding:10px; }
  .row { display:flex; align-items:flex-end; gap:12px; }
  figcaption { margin-top:8px; font-size:12px; color:#6e6557; letter-spacing:.04em; text-transform:uppercase; }
</style></head>
<body><h1>Botanical glyphs — 112 px (with grid) · 48 px · 22 px</h1>
<div class="sheet">${cells}</div></body></html>`

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/glyph-sheet.html')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, html)
console.log(`wrote ${out}`)
