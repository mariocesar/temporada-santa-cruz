import { describe, expect, it } from 'vitest'
import type { EvidenceSummary } from '../../src/lib/data/types'
import {
  confidenceLabel,
  confidenceValue,
  hasSufficientEvidence,
} from '../../src/lib/domain/confidence'

function evidence(partial: Partial<EvidenceSummary>): EvidenceSummary {
  return {
    observations: 0,
    years: 0,
    independentSources: 0,
    originKnownRatio: null,
    yearConsistency: null,
    weekCoverage: 0,
    ...partial,
  }
}

describe('confidenceValue', () => {
  it('is 0 with no evidence', () => {
    expect(confidenceValue(evidence({}))).toBe(0)
  })

  it('saturates to high confidence with rich multi-year evidence', () => {
    const v = confidenceValue(
      evidence({
        observations: 120,
        years: 6,
        independentSources: 3,
        originKnownRatio: 1,
        yearConsistency: 1,
        weekCoverage: 1,
      }),
    )
    expect(v).toBeGreaterThanOrEqual(0.75)
    expect(confidenceLabel(v)).toBe('alta')
  })

  it('caps single-year data at Baja no matter how many observations', () => {
    const v = confidenceValue(
      evidence({
        observations: 1000,
        years: 1,
        independentSources: 3,
        originKnownRatio: 1,
        yearConsistency: 1,
      }),
    )
    expect(v).toBeLessThanOrEqual(0.45)
    expect(confidenceLabel(v)).not.toBe('alta')
    expect(confidenceLabel(v)).not.toBe('media')
  })

  it('never reaches Alta below the strong-years threshold (4 years)', () => {
    const v = confidenceValue(
      evidence({
        observations: 500,
        years: 3,
        independentSources: 3,
        originKnownRatio: 1,
        yearConsistency: 1,
      }),
    )
    expect(v).toBeLessThanOrEqual(0.7)
    expect(confidenceLabel(v)).not.toBe('alta')
  })

  it('renormalizes null components instead of counting them as zero', () => {
    const withNulls = confidenceValue(
      evidence({ observations: 60, years: 5, independentSources: 3 }),
    )
    // observations, years, sources all saturated; nulls dropped → 1.0.
    expect(withNulls).toBeCloseTo(1)
  })

  it('rejects degenerate evidence counts loudly', () => {
    expect(() => confidenceValue(evidence({ observations: Number.NaN, years: 3 }))).toThrow()
    expect(() => confidenceValue(evidence({ observations: 10, years: -1 }))).toThrow()
    expect(() => confidenceValue(evidence({ observations: 10, years: 1.5 }))).toThrow()
    expect(() =>
      confidenceValue(evidence({ observations: 10, years: 2, independentSources: 0.5 })),
    ).toThrow()
  })

  it('is independent from the seasonality score by construction', () => {
    // The evidence summary carries no score input at all; sparse evidence
    // yields low confidence regardless of how pronounced a peak looks.
    const sparse = confidenceValue(evidence({ observations: 4, years: 1, independentSources: 1 }))
    expect(sparse).toBeLessThan(0.3)
  })
})

describe('confidenceLabel', () => {
  it('maps boundary values', () => {
    expect(confidenceLabel(0)).toBe('muy_baja')
    expect(confidenceLabel(0.24)).toBe('muy_baja')
    expect(confidenceLabel(0.25)).toBe('baja')
    expect(confidenceLabel(0.5)).toBe('media')
    expect(confidenceLabel(0.75)).toBe('alta')
    expect(confidenceLabel(1)).toBe('alta')
  })

  it('rejects out-of-range values', () => {
    expect(() => confidenceLabel(-0.01)).toThrow()
    expect(() => confidenceLabel(1.01)).toThrow()
    expect(() => confidenceLabel(Number.NaN)).toThrow()
  })
})

describe('hasSufficientEvidence (§36 gate)', () => {
  it('requires 30+ observations AND 2+ years', () => {
    expect(hasSufficientEvidence(evidence({ observations: 30, years: 2 }))).toBe(true)
    expect(hasSufficientEvidence(evidence({ observations: 29, years: 5 }))).toBe(false)
    expect(hasSufficientEvidence(evidence({ observations: 300, years: 1 }))).toBe(false)
    expect(hasSufficientEvidence(evidence({ observations: 0, years: 0 }))).toBe(false)
  })
})
