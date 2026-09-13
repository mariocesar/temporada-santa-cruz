# Design references

Owner-provided references for Phase 3 visual polish. Each entry records what
the owner specifically likes, so design work starts from evidence rather than
taste guesses. Third-party material here is **reference only** — nothing may
be copied verbatim into the product except verified public-domain assets.
PROJECT.md's "not a clone" constraint (§1) stands: adopt the visual
*language*, adapt it to our interactive, confidence-aware product.

---

## 1. "What's in season at the farmers' market" (San Francisco Bay Area)

- File: `sf-farmers-market-seasons.png` (owner will re-drop the screenshot;
  the original is the visualization linked from the HN item cited in
  PROJECT.md §1 — the project's own conceptual inspiration).
- Owner's words: "overall this layout I like, the months, the graphs showing
  the volume, and how easy it reads, and all the 'illustration core design'".

### What the owner likes (observed from the reference)

1. **Months as the horizontal axis.** Jan–Dec labels at both top and bottom,
   thin light vertical gridlines per month running the full height.
2. **Volume-shaped seasonality curves (ridgelines).** Each product is one
   smooth bump/plateau whose width is the season and whose shape shows
   ramp-up → peak/plateau → tail-off. Not flat bars — the curve itself
   communicates abundance. This maps directly onto our weekly
   `marketScore`/`localScore` series.
3. **A second, lighter offset layer behind each curve** (shoulder-season /
   secondary layer). For us this slot is the natural home for the
   market-vs-local distinction or the confidence envelope — our two extra
   dimensions the reference doesn't have.
4. **Cascade sort.** Products ordered by season start, so curves step
   diagonally across the year and the annual cycle reads at a glance.
   Adaptation caution: our year is cyclic (achachairú peaks across Dec→Jan);
   the cascade must handle wrap-around seasons gracefully.
5. **Name chips.** Product labels in small rounded-rect outlined chips,
   tinted per product, sitting at the left edge of each curve — labels live
   with the data, no separate legend column.
6. **Produce-derived palette.** Every product gets its own muted natural hue
   (wine cherry, blueberry slate, apricot gold, tomato rust, grape purple…).
   The produce itself supplies the accents — exactly PROJECT.md §9.
7. **Botanical watercolor illustrations in the margins.** Vintage
   pomological watercolors placed in the whitespace flanking the chart,
   soft-edged, never overlapping data. This is the "illustration core
   design" the owner wants.
8. **Editorial typography.** Serif display title in deep green, a
   letterspaced small-caps kicker above it ("SAN FRANCISCO BAY AREA" → ours:
   "SANTA CRUZ DE LA SIERRA · BOLIVIA"), warm paper-white background,
   generous whitespace.

### Adaptation requirements (ours, not the reference's)

- Interactive, not printable: tooltips, product selection, Ahora section,
  month navigation still per PROJECT.md §13–17.
- Must additionally encode **confidence** and **market vs local** without
  muddying the ridgeline read (§16) — candidate: solid curve = market
  season, distinct layer/texture = local, opacity or envelope = confidence.
- Weekly resolution underneath, month labels on top (§37).
- Curves render from real derived scores only; no hand-drawn idealized
  shapes for products with insufficient data — "Datos insuficientes" states
  need their own visual treatment in this system.
- Mobile: the cascade must survive horizontal scrolling with sticky product
  chips (§72).

### Illustration sourcing

The reference's watercolors are from the **USDA Pomological Watercolor
Collection** (public domain, usdawatercolors.nal.usda.gov) — legitimate to
use directly. It covers papaya, pineapple, citrus, grapes, peaches, etc.,
but almost certainly not achachairú or other Bolivian-specific produce.
Rule: use genuine public-domain artwork where it exists; create original
artwork in a coherent style for the rest; omit gracefully otherwise.
Never present a wrong-species illustration for a product.
