import { describe, expect, it } from 'vitest'
import { classifySeason, seasonStateAt, trendSlope } from '../../src/lib/domain/classify'

describe('classifySeason', () => {
  it('maps scores through the methodology thresholds', () => {
    expect(classifySeason(0)).toBe('off')
    expect(classifySeason(0.19)).toBe('off')
    expect(classifySeason(0.2)).toBe('occasional')
    expect(classifySeason(0.44)).toBe('occasional')
    expect(classifySeason(0.45)).toBe('in_season')
    expect(classifySeason(0.69)).toBe('in_season')
    expect(classifySeason(0.7)).toBe('peak')
    expect(classifySeason(1)).toBe('peak')
  })

  it('treats null as insufficient, not as zero', () => {
    expect(classifySeason(null)).toBe('insufficient')
  })

  it('rejects out-of-range scores', () => {
    expect(() => classifySeason(-0.1)).toThrow()
    expect(() => classifySeason(1.1)).toThrow()
  })
})

describe('trendSlope', () => {
  it('is cyclic: week 1 looks back into December', () => {
    const scores: Array<number | null> = new Array(52).fill(0.5)
    scores[50] = 0.2 // week 51
    scores[2] = 0.8 // week 3
    expect(trendSlope(scores, 1, 2)).toBeCloseTo(0.6)
  })

  it('returns null when either side is missing or the series is empty', () => {
    expect(trendSlope([], 1)).toBeNull()
    const scores: Array<number | null> = new Array(52).fill(0.5)
    scores[2] = null
    expect(trendSlope(scores, 1, 2)).toBeNull()
  })

  it('rejects out-of-range weeks', () => {
    expect(() => trendSlope(new Array(52).fill(0.5), 0)).toThrow()
    expect(() => trendSlope(new Array(52).fill(0.5), 53)).toThrow()
  })
})

function rampSeries(values: Record<number, number>, fill = 0): Array<number | null> {
  const out: Array<number | null> = new Array(52).fill(fill)
  for (const [week, v] of Object.entries(values)) out[Number(week) - 1] = v
  return out
}

describe('seasonStateAt', () => {
  it('returns sin_datos for empty series and null weeks', () => {
    expect(seasonStateAt([], 1)).toBe('sin_datos')
    expect(seasonStateAt(new Array<number | null>(52).fill(null), 10)).toBe('sin_datos')
  })

  it('peak wins regardless of slope', () => {
    const scores = rampSeries({ 8: 0.5, 10: 0.9, 12: 0.2 })
    expect(seasonStateAt(scores, 10)).toBe('pico')
  })

  it('detects entrando on a rising edge', () => {
    // Rising: week 18 = 0.2, week 20 = 0.5, week 22 = 0.65.
    const scores = rampSeries({ 18: 0.2, 19: 0.3, 20: 0.5, 21: 0.6, 22: 0.65 })
    expect(seasonStateAt(scores, 20)).toBe('entrando')
  })

  it('detects saliendo on a falling edge', () => {
    const scores = rampSeries({ 18: 0.65, 19: 0.6, 20: 0.5, 21: 0.3, 22: 0.2 })
    expect(seasonStateAt(scores, 20)).toBe('saliendo')
  })

  it('reads a stable moderate score as en_temporada', () => {
    const scores: Array<number | null> = new Array(52).fill(0.5)
    expect(seasonStateAt(scores, 30)).toBe('en_temporada')
  })

  it('reads stable low scores as fuera', () => {
    expect(seasonStateAt(new Array<number | null>(52).fill(0.3), 30)).toBe('fuera')
    expect(seasonStateAt(new Array<number | null>(52).fill(0.05), 30)).toBe('fuera')
  })

  it('handles the December→January wraparound season', () => {
    // Season rising through week 52 into a January peak.
    const scores: Array<number | null> = new Array(52).fill(0.1)
    const profile: Record<number, number> = {
      48: 0.25, 49: 0.35, 50: 0.45, 51: 0.55, 52: 0.65,
      1: 0.75, 2: 0.8, 3: 0.75, 4: 0.65, 5: 0.5, 6: 0.35, 7: 0.25,
    }
    for (const [w, v] of Object.entries(profile)) scores[Number(w) - 1] = v
    expect(seasonStateAt(scores, 50)).toBe('entrando') // rising across the boundary
    expect(seasonStateAt(scores, 2)).toBe('pico')
    expect(seasonStateAt(scores, 5)).toBe('saliendo') // falling out of the wrap season
  })
})
