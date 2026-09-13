import { describe, expect, it } from 'vitest'
import { localSeasonScore, marketSeasonScore } from '../../src/lib/domain/scores'

describe('marketSeasonScore', () => {
  it('weights availability 45%, presence 35%, price 20%', () => {
    expect(
      marketSeasonScore({ presence: 0.8, availability: 1.0, price: 0.5 }),
    ).toBeCloseTo(0.45 * 1.0 + 0.35 * 0.8 + 0.2 * 0.5)
  })

  it('requires the presence signal', () => {
    expect(marketSeasonScore({ presence: null, availability: 1, price: 1 })).toBeNull()
  })

  it('renormalizes weights when optional signals are missing', () => {
    expect(
      marketSeasonScore({ presence: 0.8, availability: 0.6, price: null }),
    ).toBeCloseTo((0.45 * 0.6 + 0.35 * 0.8) / 0.8)
    // Presence alone: score equals presence.
    expect(marketSeasonScore({ presence: 0.7, availability: null, price: null })).toBeCloseTo(0.7)
  })

  it('rejects signals outside [0,1]', () => {
    expect(() => marketSeasonScore({ presence: 1.2, availability: null, price: null })).toThrow()
    expect(() => marketSeasonScore({ presence: 0.5, availability: -0.1, price: null })).toThrow()
  })
})

describe('localSeasonScore', () => {
  it('weights market 50%, localShare 35%, harvest 15%', () => {
    expect(
      localSeasonScore({ market: 0.8, localShare: 1.0, harvest: 0.6 }),
    ).toBeCloseTo(0.5 * 0.8 + 0.35 * 1.0 + 0.15 * 0.6)
  })

  it('requires localShare — market data alone is never a local claim', () => {
    expect(localSeasonScore({ market: 0.9, localShare: null, harvest: 0.9 })).toBeNull()
  })

  it('requires a market score', () => {
    expect(localSeasonScore({ market: null, localShare: 1, harvest: null })).toBeNull()
  })

  it('renormalizes away the missing harvest prior', () => {
    expect(
      localSeasonScore({ market: 0.8, localShare: 0.9, harvest: null }),
    ).toBeCloseTo((0.5 * 0.8 + 0.35 * 0.9) / 0.85)
  })

  it('keeps a fully imported product distinct from a local one', () => {
    // Uva from Tarija: strong market season, zero local share.
    const market = 0.9
    const local = localSeasonScore({ market, localShare: 0, harvest: null })
    expect(local).toBeCloseTo((0.5 * 0.9) / 0.85)
    expect(local!).toBeLessThan(market)
  })
})
