<script lang="ts">
  import { WEEK_BINS } from '../../domain/methodology'
  import { MONTH_START_DAY } from '../../domain/months'
  import type { SeasonRange } from '../../data/types'

  interface Props {
    /** Weekly season scores for the active concept (index = week bin − 1). */
    primary: ReadonlyArray<number | null>
    /**
     * The other concept, drawn as a lighter silhouette BEHIND the filled
     * curve (design-references NOTES §3) — market and local stay visually
     * distinct without stacking two full encodings (§16).
     */
    secondary?: ReadonlyArray<number | null>
    /**
     * Estimated reference season from cited bibliography (§104), drawn as an
     * outlined/hatched band — a texture channel, never a solid fill, so it
     * can never be read as an observed season class.
     */
    reference?: ReadonlyArray<SeasonRange>
    /** Reference week to mark with a vertical line (1..52). */
    markerWeek?: number | null
    /**
     * True for products below the public evidence thresholds: no curve is
     * drawn at all — insufficient evidence must never look like
     * "off season" (§36).
     */
    insufficient?: boolean
    /** Produce-derived hue for this product's curve (src/lib/ui/palette.ts). */
    hue?: string
    height?: number
    /**
     * Extra headroom ABOVE the row box, in px, that the crest may rise
     * into — the classic ridgeline overlap of the reference poster (NOTES
     * §2). The layout box stays `height` tall; the canvas extends upward
     * and later rows paint over earlier rows' spill. Axis furniture
     * (gridlines, bands, marker, hit area) stays inside the row box so the
     * overlap never changes what a row claims.
     */
    overshoot?: number
    /** Accessible summary of the strip (charts need text equivalents, §11). */
    label: string
    /**
     * Stagger for the entrance, in ms. Rows rising in sequence is what
     * makes the cascade read as a cascade (docs/design-references NOTES §4).
     */
    revealDelay?: number
    /**
     * Changing this value replays the entrance — the mode toggle uses it so
     * swapping Mercado ↔ Producción cruceña re-grows the curves instead of
     * snapping between two unrelated shapes.
     */
    revealKey?: unknown
    onhoverweek?: (week: number | null, clientX: number, clientY: number) => void
  }

  let {
    primary,
    secondary,
    reference = [],
    markerWeek = null,
    insufficient = false,
    hue = 'var(--season-reference)',
    height = 44,
    overshoot = 0,
    label,
    revealDelay = 0,
    revealKey = 0,
    onhoverweek,
  }: Props = $props()

  // Day units: 52 weeks × 7 = 364 wide. preserveAspectRatio="none" lets the
  // paths stretch with the container; no text lives inside the SVG.
  const WIDTH = 364
  const REFERENCE_INSET = 1.5
  const HATCH_SPACING = 7

  // Total drawing height: the row box plus the overlap headroom above it.
  const total = $derived(height + overshoot)
  // Top edge of the row box inside the canvas (0 when there is no overlap).
  const boxTop = $derived(overshoot)

  // Headroom scales with the row: a curve that touches the top edge reads
  // as clipped rather than as a peak, and every score near 1.0 flattens
  // into the same slab. With overlap headroom the crest may climb into it,
  // needing only a hairline of air at the canvas top.
  const TOP_PAD = $derived(overshoot > 0 ? 4 : Math.max(5, height * 0.2))
  const baseline = $derived(total - 1)

  // Gradients are document-global; each instance needs its own id.
  const uid = $props.id()
  const gradientId = $derived(`ridge-fill-${uid}`)

  interface Point {
    x: number
    y: number
  }

  function weekX(weekIndex: number): number {
    return weekIndex * 7 + 3.5
  }

  function scoreY(score: number): number {
    return TOP_PAD + (1 - score) * (baseline - TOP_PAD)
  }

  /**
   * Contiguous non-null runs of a series as point lists. The calendar is
   * cyclic (§37): a run touching either edge gains a phantom neighbor from
   * the wrapped side so the curve continues through the year boundary
   * instead of dying at it (the svg clips the overhang).
   */
  function runsOf(series: ReadonlyArray<number | null>): Point[][] {
    const runs: Point[][] = []
    let current: Point[] | null = null
    for (let i = 0; i < series.length; i++) {
      const score = series[i]
      if (score === null || score === undefined) {
        if (current) runs.push(current)
        current = null
      } else {
        current ??= []
        current.push({ x: weekX(i), y: scoreY(score) })
      }
    }
    if (current) runs.push(current)

    // Both year edges carrying data means the curve crosses the boundary:
    // the first run necessarily starts at week 1 and the last ends at week
    // 52, so each gains one wrapped phantom point (a full-year run gets
    // both on the same run).
    const firstScore = series[0]
    const lastScore = series[series.length - 1]
    if (firstScore != null && lastScore != null && runs.length > 0) {
      runs[0]!.unshift({ x: weekX(-1), y: scoreY(lastScore) })
      runs[runs.length - 1]!.push({ x: weekX(WEEK_BINS), y: scoreY(firstScore) })
    }
    return runs
  }

  /** Catmull-Rom spline segments through the points (no leading move). */
  function curveBody(points: ReadonlyArray<Point>): string {
    if (points.length === 1) {
      const p = points[0]!
      return ` L ${p.x + 2},${p.y}`
    }
    const at = (i: number) => points[Math.min(Math.max(i, 0), points.length - 1)]!
    let d = ''
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = at(i - 1)
      const p1 = at(i)
      const p2 = at(i + 1)
      const p3 = at(i + 2)
      const c1x = p1.x + (p2.x - p0.x) / 6
      const c1y = p1.y + (p2.y - p0.y) / 6
      const c2x = p2.x - (p3.x - p1.x) / 6
      const c2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
    }
    return d
  }

  function curveThrough(points: ReadonlyArray<Point>): string {
    const first = points[0]!
    const startX = points.length === 1 ? first.x - 2 : first.x
    return `M ${startX},${first.y}${curveBody(points)}`
  }

  /**
   * Closed area under the curve. Where a run ends because the evidence
   * ends, the fill returns to the baseline on a short ramp rather than a
   * vertical cliff: a wall reads as "the season dropped to zero that
   * week", which is a claim the data never made. The ramp is a drawing
   * convention at the edge of evidence — the dashed no-evidence baseline
   * underneath and the row's text equivalent state what is actually known.
   */
  const MAX_EDGE_RAMP = 10.5

  function edgeRamp(y: number): number {
    return Math.min(MAX_EDGE_RAMP, Math.max(2, (baseline - y) * 0.35))
  }

  function areaPath(points: ReadonlyArray<Point>): string {
    const first = points[0]!
    const end = points[points.length - 1]!
    const startX = first.x - edgeRamp(first.y)
    const endX = end.x + edgeRamp(end.y)
    return `M ${startX},${baseline} L ${first.x},${first.y}${curveBody(points)} L ${endX},${baseline} Z`
  }

  /**
   * A run of one or two weeks has no shape to speak of: filling it as an
   * area paints a flat-topped bar, which reads as a plateau that the
   * evidence never claimed. Those weeks are drawn as what they are —
   * isolated observations, a stem and a dot at the week's own height.
   */
  const MIN_AREA_POINTS = 3

  function splitRuns(series: ReadonlyArray<number | null>) {
    const runs = runsOf(series)
    return {
      areas: runs.filter((points) => points.length >= MIN_AREA_POINTS),
      marks: runs.filter((points) => points.length < MIN_AREA_POINTS).flat(),
    }
  }

  const primaryRuns = $derived(insufficient ? { areas: [], marks: [] } : splitRuns(primary))
  const secondaryRuns = $derived(
    insufficient || !secondary ? { areas: [], marks: [] } : splitRuns(secondary),
  )

  // Weeks with NO evidence (null score) get an explicit dashed baseline —
  // a silent flat baseline would read as "fuera de temporada", and missing
  // data is not absence. An insufficient product is the degenerate
  // all-weeks case of the same encoding (§36).
  const noDataRuns = $derived.by(() => {
    const n = primary.length
    if (insufficient) return n > 0 ? [{ start: 0, end: n }] : []
    const runs: Array<{ start: number; end: number }> = []
    let start: number | null = null
    for (let i = 0; i < n; i++) {
      if (primary[i] === null || primary[i] === undefined) {
        if (start === null) start = i
      } else if (start !== null) {
        runs.push({ start, end: i })
        start = null
      }
    }
    if (start !== null) runs.push({ start, end: n })
    return runs
  })

  interface Segment {
    x: number
    w: number
  }

  // A cyclic range crossing the year boundary is ONE range drawn as two
  // segments — December and January are adjacent (§104).
  function linearSegments(range: SeasonRange): Segment[] {
    const x = (range.startWeek - 1) * 7
    if (range.startWeek <= range.endWeek) {
      return [{ x, w: (range.endWeek - range.startWeek + 1) * 7 }]
    }
    return [
      { x, w: (WEEK_BINS - range.startWeek + 1) * 7 },
      { x: 0, w: range.endWeek * 7 },
    ]
  }

  const referenceSegments = $derived(reference.flatMap(linearSegments))

  interface HatchLine {
    x1: number
    y1: number
    x2: number
    y2: number
  }

  // Diagonal hatch clipped to a segment, computed in viewBox units so no
  // SVG <pattern> ids are needed (patterns are document-global and this
  // component renders many times per page). Lines: x(y) = a + (yBot − y).
  function hatchLines(seg: Segment, yTop: number, yBot: number): HatchLine[] {
    const bandH = yBot - yTop
    const lines: HatchLine[] = []
    for (let a = seg.x - bandH + HATCH_SPACING; a < seg.x + seg.w; a += HATCH_SPACING) {
      const yLow = Math.max(yTop, yBot - (seg.x + seg.w - a))
      const yHigh = Math.min(yBot, yBot - (seg.x - a))
      if (yLow >= yHigh) continue
      lines.push({ x1: a + (yBot - yHigh), y1: yHigh, x2: a + (yBot - yLow), y2: yLow })
    }
    return lines
  }

  function weekFromEvent(event: PointerEvent): number {
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    return Math.min(WEEK_BINS, Math.max(1, Math.floor(ratio * WEEK_BINS) + 1))
  }

  function handleMove(event: PointerEvent) {
    onhoverweek?.(weekFromEvent(event), event.clientX, event.clientY)
  }

  function handleLeave() {
    onhoverweek?.(null, 0, 0)
  }
</script>

<svg
  viewBox="0 0 {WIDTH} {total}"
  preserveAspectRatio="none"
  style="height: {total}px; margin-top: -{overshoot}px; --ridge-hue: {hue}"
  role="img"
  aria-label={label}
  onpointermove={onhoverweek ? handleMove : undefined}
  onpointerleave={onhoverweek ? handleLeave : undefined}
>
  <defs>
    <!-- Dense at the baseline, airy at the crest: the fill itself carries
         the sense of volume, so a long plateau still reads as a season
         rather than as a colored slab. The stops are OPAQUE paper-mixed
         pigments, not alphas: overlapping ridges must occlude cleanly like
         printed ink, never blend into mud. -->
    <linearGradient
      id={gradientId}
      x1="0"
      y1={TOP_PAD}
      x2="0"
      y2={baseline}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0" stop-color="color-mix(in oklab, var(--ridge-hue) 20%, var(--color-bg))" />
      <stop offset="0.5" stop-color="color-mix(in oklab, var(--ridge-hue) 37%, var(--color-bg))" />
      <stop offset="1" stop-color="color-mix(in oklab, var(--ridge-hue) 60%, var(--color-bg))" />
    </linearGradient>
  </defs>

  <rect class="hit" x="0" y={boxTop} width={WIDTH} height={height} />

  {#each MONTH_START_DAY.slice(1) as day (day)}
    <line class="month-line" x1={day} y1={boxTop} x2={day} y2={total} />
  {/each}

  <line class="baseline" x1="0" y1={baseline} x2={WIDTH} y2={baseline} />

  {#each referenceSegments as seg, segIndex (segIndex)}
    <g aria-hidden="true">
      <rect
        class="reference-outline"
        x={seg.x}
        y={boxTop + REFERENCE_INSET}
        width={seg.w}
        height={height - 2 * REFERENCE_INSET}
      />
      {#each hatchLines(seg, boxTop + REFERENCE_INSET, boxTop + height - REFERENCE_INSET) as hatch, i (i)}
        <line class="reference-hatch" x1={hatch.x1} y1={hatch.y1} x2={hatch.x2} y2={hatch.y2} />
      {/each}
    </g>
  {/each}

  {#each noDataRuns as run (run.start)}
    <line
      class="no-data-line"
      x1={run.start * 7 + 2}
      y1={baseline}
      x2={run.end * 7 - 2}
      y2={baseline}
    />
  {/each}

  <!-- Only the curves animate. The dashed no-evidence baseline and the
       §104 hatch band are honesty devices and are painted immediately. -->
  {#key revealKey}
    <g class="plot" style="--reveal-delay: {revealDelay}ms">
      {#each secondaryRuns.areas as points, i (i)}
        <path class="silhouette" d={areaPath(points)} />
      {/each}
      {#each secondaryRuns.marks as point, i (i)}
        <line class="mark-stem secondary" x1={point.x} y1={baseline} x2={point.x} y2={point.y} />
        <circle class="mark-dot secondary" cx={point.x} cy={point.y} r="2.4" />
      {/each}

      {#each primaryRuns.areas as points, i (i)}
        <path class="ridge" d={areaPath(points)} fill="url(#{gradientId})" />
        <path class="ridge-line" d={curveThrough(points)} />
      {/each}
      {#each primaryRuns.marks as point, i (i)}
        <line class="mark-stem" x1={point.x} y1={baseline} x2={point.x} y2={point.y} />
        <circle class="mark-dot" cx={point.x} cy={point.y} r="2.4" />
      {/each}
    </g>
  {/key}

  {#if markerWeek !== null}
    <line
      class="marker"
      x1={(markerWeek - 1) * 7 + 3.5}
      y1={boxTop}
      x2={(markerWeek - 1) * 7 + 3.5}
      y2={total}
    />
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    /* Wrap-continuation phantom points overhang both edges; clip them. */
    overflow: hidden;
    /* Overlapping canvases: only the row-box hit rect takes the pointer,
       so a crest spilling over a neighbor never steals its hover. */
    pointer-events: none;
  }

  .hit {
    fill: transparent;
    pointer-events: all;
  }

  .month-line {
    stroke: var(--color-border);
    stroke-opacity: 0.55;
    stroke-width: 1;
    /* Keep hairlines 1px regardless of the horizontal stretch. */
    vector-effect: non-scaling-stroke;
  }

  .baseline {
    stroke: var(--color-border);
    stroke-opacity: 0.45;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  /* Curves grow up out of the baseline, staggered down the cascade. The
     resting state IS the finished state, so the reduced-motion override in
     app.css lands on a fully drawn chart. */
  .plot {
    animation: ridge-rise 620ms cubic-bezier(0.22, 0.7, 0.28, 1) both;
    animation-delay: var(--reveal-delay, 0ms);
    transform-box: fill-box;
    transform-origin: bottom;
  }

  @keyframes ridge-rise {
    from {
      transform: scaleY(0.06);
      opacity: 0;
    }
    to {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  /* The crest carries the season's shape; the wash underneath only gives
     it weight. A heavy fill turns a year-round product into a slab. */
  .ridge-line {
    fill: none;
    stroke: var(--ridge-hue);
    stroke-width: 1.75;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .mark-stem {
    stroke: var(--ridge-hue);
    stroke-opacity: 0.55;
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
  }

  .mark-dot {
    fill: var(--ridge-hue);
    stroke: none;
  }

  .mark-stem.secondary {
    stroke-opacity: 0.3;
  }

  .mark-dot.secondary {
    fill: color-mix(in oklab, var(--ridge-hue) 45%, var(--color-bg));
  }

  .silhouette {
    fill: color-mix(in oklab, var(--ridge-hue) 14%, var(--color-bg));
    stroke: color-mix(in oklab, var(--ridge-hue) 34%, var(--color-bg));
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .no-data-line {
    stroke: var(--season-reference);
    stroke-opacity: 0.7;
    stroke-width: 2;
    stroke-dasharray: 4 5;
    vector-effect: non-scaling-stroke;
  }

  .reference-outline {
    fill: none;
    stroke: var(--season-reference);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    vector-effect: non-scaling-stroke;
  }

  .reference-hatch {
    stroke: var(--season-reference);
    stroke-width: 1;
    opacity: 0.55;
    vector-effect: non-scaling-stroke;
  }

  .marker {
    stroke: var(--color-text);
    stroke-width: 1.5;
    stroke-dasharray: 2 3;
    vector-effect: non-scaling-stroke;
  }
</style>
