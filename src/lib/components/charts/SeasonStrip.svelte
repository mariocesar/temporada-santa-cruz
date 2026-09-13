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
    /** Accessible summary of the strip (charts need text equivalents, §11). */
    label: string
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
    label,
    onhoverweek,
  }: Props = $props()

  // Day units: 52 weeks × 7 = 364 wide. preserveAspectRatio="none" lets the
  // paths stretch with the container; no text lives inside the SVG.
  const WIDTH = 364
  const TOP_PAD = 5
  const REFERENCE_INSET = 1.5
  const HATCH_SPACING = 7

  const baseline = $derived(height - 1)

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

  /** Closed area under the curve, down to the baseline. */
  function areaPath(points: ReadonlyArray<Point>): string {
    const first = points[0]!
    const end = points[points.length - 1]!
    const startX = points.length === 1 ? first.x - 2 : first.x
    const endX = points.length === 1 ? first.x + 2 : end.x
    return `M ${startX},${baseline} L ${startX},${first.y}${curveBody(points)} L ${endX},${baseline} Z`
  }

  const primaryRuns = $derived(insufficient ? [] : runsOf(primary))
  const secondaryRuns = $derived(insufficient || !secondary ? [] : runsOf(secondary))

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
  viewBox="0 0 {WIDTH} {height}"
  preserveAspectRatio="none"
  style="height: {height}px; --ridge-hue: {hue}"
  role="img"
  aria-label={label}
  onpointermove={onhoverweek ? handleMove : undefined}
  onpointerleave={onhoverweek ? handleLeave : undefined}
>
  <rect class="hit" x="0" y="0" width={WIDTH} height={height} />

  {#each MONTH_START_DAY.slice(1) as day (day)}
    <line class="month-line" x1={day} y1="0" x2={day} y2={height} />
  {/each}

  <line class="baseline" x1="0" y1={baseline} x2={WIDTH} y2={baseline} />

  {#each referenceSegments as seg, segIndex (segIndex)}
    <g aria-hidden="true">
      <rect
        class="reference-outline"
        x={seg.x}
        y={REFERENCE_INSET}
        width={seg.w}
        height={height - 2 * REFERENCE_INSET}
      />
      {#each hatchLines(seg, REFERENCE_INSET, height - REFERENCE_INSET) as hatch, i (i)}
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

  {#each secondaryRuns as points, i (i)}
    <path class="silhouette" d={areaPath(points)} />
  {/each}

  {#each primaryRuns as points, i (i)}
    <path class="ridge" d={areaPath(points)} />
    <path class="ridge-line" d={curveThrough(points)} />
  {/each}

  {#if markerWeek !== null}
    <line
      class="marker"
      x1={(markerWeek - 1) * 7 + 3.5}
      y1="0"
      x2={(markerWeek - 1) * 7 + 3.5}
      y2={height}
    />
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    /* Wrap-continuation phantom points overhang both edges; clip them. */
    overflow: hidden;
  }

  .hit {
    fill: transparent;
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
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .ridge {
    fill: var(--ridge-hue);
    fill-opacity: 0.78;
  }

  .ridge-line {
    fill: none;
    stroke: var(--ridge-hue);
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }

  .silhouette {
    fill: color-mix(in oklab, var(--ridge-hue) 20%, var(--color-bg));
    stroke: color-mix(in oklab, var(--ridge-hue) 38%, var(--color-bg));
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
