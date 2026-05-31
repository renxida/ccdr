import { describe, expect, it } from 'vitest'
import { MASTERY } from '../src/config/progression'
import {
  emptyStat,
  hintIntensity,
  masteryScore,
  updateCharStat,
  weaknessWeight,
} from '../src/engine/charStats'
import type { CharStat } from '../src/engine/types'

/** Build a stat by folding N identical samples in. */
function stat(correct: boolean, latencyMs: number, n: number): CharStat {
  let s = updateCharStat(undefined, 'x', correct, latencyMs, 0)
  for (let i = 1; i < n; i++) s = updateCharStat(s, 'x', correct, latencyMs, i)
  return s
}

describe('updateCharStat', () => {
  it('snaps to the first sample instead of blending with the prior', () => {
    const correct = updateCharStat(undefined, 'a', true, 120, 1)
    expect(correct.ewmaAccuracy).toBe(1)
    expect(correct.ewmaLatencyMs).toBe(120)
    expect(correct.samples).toBe(1)

    const wrong = updateCharStat(undefined, 'a', false, 120, 1)
    expect(wrong.ewmaAccuracy).toBe(0)
  })

  it('blends subsequent samples by alpha', () => {
    const first = updateCharStat(undefined, 'a', true, 100, 0) // acc 1
    const second = updateCharStat(first, 'a', false, 100, 1, 0.5) // acc 0.5
    expect(second.ewmaAccuracy).toBeCloseTo(0.5, 6)
    expect(second.samples).toBe(2)
  })

  it('only updates latency on correct presses', () => {
    const first = updateCharStat(undefined, 'a', true, 100, 0)
    const afterError = updateCharStat(first, 'a', false, 9999, 1)
    expect(afterError.ewmaLatencyMs).toBe(first.ewmaLatencyMs)
  })
})

describe('masteryScore', () => {
  it('is 0 for unseen characters', () => {
    expect(masteryScore(undefined)).toBe(0)
    expect(masteryScore(emptyStat('q'))).toBe(0)
  })

  it('grows toward 1 for fast, accurate, well-sampled chars', () => {
    const mastered = stat(true, MASTERY.masteredLatencyMs, MASTERY.minSamples)
    expect(masteryScore(mastered)).toBeGreaterThan(0.8)
  })

  it('is capped by sample count (confidence gate)', () => {
    const fewSamples = stat(true, MASTERY.masteredLatencyMs, 2)
    const manySamples = stat(true, MASTERY.masteredLatencyMs, MASTERY.minSamples)
    expect(masteryScore(fewSamples)).toBeLessThan(masteryScore(manySamples))
  })

  it('stays low for slow or inaccurate chars', () => {
    expect(masteryScore(stat(true, 1500, MASTERY.minSamples))).toBeLessThan(0.6)
    expect(masteryScore(stat(false, 100, MASTERY.minSamples))).toBe(0)
  })
})

describe('weaknessWeight', () => {
  it('maxes out (1) for unseen characters so new material is prioritized', () => {
    expect(weaknessWeight(undefined)).toBe(1)
  })

  it('is higher for inaccurate chars than accurate ones', () => {
    const weak = stat(false, 400, 6)
    const strong = stat(true, 150, 6)
    expect(weaknessWeight(weak)).toBeGreaterThan(weaknessWeight(strong))
  })

  it('never drops below the floor', () => {
    const perfect = stat(true, 50, 20)
    expect(weaknessWeight(perfect)).toBeGreaterThanOrEqual(0.05)
  })
})

describe('hintIntensity', () => {
  it('is brightest for unseen chars and faint for mastered ones', () => {
    expect(hintIntensity(undefined)).toBeCloseTo(MASTERY.hintMaxIntensity, 6)
    const mastered = stat(true, MASTERY.masteredLatencyMs, MASTERY.minSamples)
    expect(hintIntensity(mastered)).toBeLessThan(0.5)
    expect(hintIntensity(mastered)).toBeGreaterThanOrEqual(MASTERY.hintMinIntensity)
  })
})
