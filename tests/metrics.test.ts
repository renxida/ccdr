import { describe, expect, it } from 'vitest'
import { computeAccuracy, computeWPM } from '../src/engine/metrics'

describe('computeWPM', () => {
  it('uses the 5-chars-per-word convention', () => {
    // 60 chars / 5 = 12 words in 60s → 12 WPM
    expect(computeWPM(60, 60_000)).toBe(12)
    // 25 chars / 5 = 5 words in 30s = 0.5 min → 10 WPM
    expect(computeWPM(25, 30_000)).toBe(10)
  })

  it('returns 0 for non-positive time or chars', () => {
    expect(computeWPM(50, 0)).toBe(0)
    expect(computeWPM(0, 1000)).toBe(0)
    expect(computeWPM(50, -10)).toBe(0)
  })

  it('scales linearly with speed', () => {
    expect(computeWPM(50, 30_000)).toBeCloseTo(2 * computeWPM(50, 60_000), 6)
  })
})

describe('computeAccuracy', () => {
  it('is correct / total', () => {
    expect(computeAccuracy(95, 100)).toBe(0.95)
    expect(computeAccuracy(2, 3)).toBeCloseTo(0.6667, 3)
  })

  it('treats empty input as perfect', () => {
    expect(computeAccuracy(0, 0)).toBe(1)
  })

  it('is 1.0 with no errors', () => {
    expect(computeAccuracy(10, 10)).toBe(1)
  })
})
