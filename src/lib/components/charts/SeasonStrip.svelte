<script lang="ts">
  import { classifySeason } from '../../domain/classify'
  import { WEEK_BINS } from '../../domain/methodology'
  import { MONTH_START_DAY } from '../../domain/months'
  import type { SeasonRange } from '../../data/types'

  interface Props {
    /** Season score series encoded as cells (index = week bin − 1). */
    primary: ReadonlyArray<number | null>
    /**
     * Optional second concept shown as an underline stripe on weeks where it
     * is in season or peaking — this keeps market vs local visually distinct
     * without stacking two full encodings (§16).
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
     * True for products below the public evidence thresholds: no season
     * cells are drawn at all — insufficient evidence must never look like
     * "off season" (§36).
     */
    insufficient?: boolean
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
    height = 24,
    label,
    onhoverweek,
  }: Props = $props()

  // Day units: 52 weeks × 7 = 364 wide. preserveAspectRatio="none" lets the
  // rects stretch with the container; no text lives inside the SVG.
  const WIDTH = 364
  const UNDERLINE_HEIGHT = 4
  const REFERENCE_INSET = 1.5
  const HATCH_SPACING = 7

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

  const cells = $derived(
    insufficient
      ? []
      : primary
          .map((score, i) => ({ week: i + 1, cls: classifySeason(score) }))
          .filter((c) => c.cls === 'occasional' || c.cls === 'in_season' || c.cls === 'peak'),
  )

  // Weeks with NO evidence (null score) get an explicit dashed mark — a
  // blank cell would read as "fuera de temporada", and missing data is not
  // absence. An insufficient product is the degenerate all-weeks case of the
  // same encoding: its scores are suppressed entirely (§36).
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

  const underlines = $derived(
    insufficient || !secondary
      ? []
      : secondary
          .map((score, i) => ({ week: i + 1, cls: classifySeason(score) }))
          .filter((c) => c.cls === 'in_season' || c.cls === 'peak'),
  )

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
  style="height: {height}px"
  role="img"
  aria-label={label}
  onpointermove={onhoverweek ? handleMove : undefined}
  onpointerleave={onhoverweek ? handleLeave : undefined}
>
  <rect class="track" x="0" y="0" width={WIDTH} height={height} />

  {#each MONTH_START_DAY.slice(1) as day (day)}
    <line class="month-line" x1={day} y1="0" x2={day} y2={height} />
  {/each}

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
      y1={height / 2}
      x2={run.end * 7 - 2}
      y2={height / 2}
    />
  {/each}

  {#if !insufficient}
    {#each cells as cell (cell.week)}
      <rect
        class="cell {cell.cls}"
        x={(cell.week - 1) * 7}
        y="0"
        width="7"
        height={secondary ? height - UNDERLINE_HEIGHT : height}
      />
    {/each}
    {#each underlines as cell (cell.week)}
      <rect
        class="underline"
        x={(cell.week - 1) * 7}
        y={height - UNDERLINE_HEIGHT}
        width="7"
        height={UNDERLINE_HEIGHT}
      />
    {/each}
  {/if}

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
  }

  .track {
    fill: var(--season-track);
  }

  .month-line {
    stroke: var(--color-bg);
    stroke-width: 1;
    /* Keep hairlines 1px regardless of the horizontal stretch. */
    vector-effect: non-scaling-stroke;
  }

  .cell.occasional {
    fill: var(--season-occasional);
  }

  .cell.in_season {
    fill: var(--season-in);
  }

  .cell.peak {
    fill: var(--season-peak);
  }

  .underline {
    fill: var(--season-secondary);
  }

  .no-data-line {
    stroke: var(--color-border);
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
