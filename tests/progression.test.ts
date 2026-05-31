import { beforeEach, describe, expect, it } from 'vitest'
import { PROGRESSION } from '../src/config/progression'
import {
  conceptProgress,
  currentDepth,
  drillPassed,
  initialState,
  isConceptComplete,
  loadState,
  overallProgress,
  recordDrill,
  saveState,
} from '../src/engine/progression'
import { runDrill } from '../src/engine/drill'
import type { Concept } from '../src/corpus/types'
import type { DrillResult } from '../src/engine/types'

const concept: Concept = {
  id: 'tpu',
  token: 'tpu',
  depth: [
    { tier: 0, text: 'tpu' },
    { tier: 1, text: 'tpu pod' },
    { tier: 2, text: 'a tpu v5p pod has 8960 chips' },
    { tier: 3, text: 'a tpu v5p pod connects 8960 chips over a 3d torus' },
  ],
}

/** A synthetic result with chosen wpm/accuracy and no keystrokes. */
function fakeResult(wpm: number, accuracy: number): DrillResult {
  return {
    target: 'tpu',
    keystrokes: [],
    correctChars: 3,
    totalKeystrokes: 3,
    errors: 0,
    elapsedMs: 1000,
    wpm,
    accuracy,
    passed: false,
  }
}

describe('drillPassed', () => {
  it('uses the per-tier WPM bar and the global accuracy bar', () => {
    expect(drillPassed(fakeResult(25, 0.95), 0)).toBe(true) // tier0 needs 25 wpm
    expect(drillPassed(fakeResult(24.9, 0.99), 0)).toBe(false) // too slow
    expect(drillPassed(fakeResult(40, 0.94), 0)).toBe(false) // too inaccurate
    expect(drillPassed(fakeResult(30, 0.95), 1)).toBe(true) // tier1 needs 30
    expect(drillPassed(fakeResult(29, 0.99), 1)).toBe(false)
  })
})

describe('recordDrill unlock state machine', () => {
  it('unlocks the next level after N consecutive passes and resets the streak', () => {
    let state = initialState()
    const N = PROGRESSION.consecutiveDrillsToUnlock
    for (let i = 0; i < N - 1; i++) {
      const out = recordDrill(state, concept, fakeResult(30, 0.97))
      expect(out.passed).toBe(true)
      expect(out.unlocked).toBe(false)
      expect(out.level).toBe(0)
      state = out.state
    }
    const last = recordDrill(state, concept, fakeResult(30, 0.97))
    expect(last.unlocked).toBe(true)
    expect(last.level).toBe(1)
    expect(conceptProgress(last.state, 'tpu').consecutivePasses).toBe(0)
  })

  it('a failed drill resets the pass streak', () => {
    let state = initialState()
    state = recordDrill(state, concept, fakeResult(30, 0.97)).state // pass
    state = recordDrill(state, concept, fakeResult(30, 0.97)).state // pass (streak 2)
    expect(conceptProgress(state, 'tpu').consecutivePasses).toBe(2)
    const fail = recordDrill(state, concept, fakeResult(10, 0.97)) // too slow
    expect(fail.passed).toBe(false)
    expect(fail.unlocked).toBe(false)
    expect(conceptProgress(fail.state, 'tpu').consecutivePasses).toBe(0)
  })

  it('grades against the tier of the current level after advancing', () => {
    let state = initialState()
    const N = PROGRESSION.consecutiveDrillsToUnlock
    // climb to level 1 (tier 1, needs 30 wpm)
    for (let i = 0; i < N; i++) state = recordDrill(state, concept, fakeResult(30, 0.97)).state
    expect(conceptProgress(state, 'tpu').level).toBe(1)
    expect(currentDepth(concept, conceptProgress(state, 'tpu')).tier).toBe(1)
    // 28 wpm passed tier0 but fails tier1
    expect(recordDrill(state, concept, fakeResult(28, 0.97)).passed).toBe(false)
  })

  it('counts attempts and can complete the whole chain', () => {
    let state = initialState()
    const N = PROGRESSION.consecutiveDrillsToUnlock
    // 4 levels → need 4*N passes to push level past the end
    for (let i = 0; i < N * concept.depth.length; i++) {
      state = recordDrill(state, concept, fakeResult(50, 0.99)).state
    }
    expect(isConceptComplete(concept, conceptProgress(state, 'tpu'))).toBe(true)
    expect(conceptProgress(state, 'tpu').attempts).toBe(N * concept.depth.length)
  })

  it('updates per-character stats from real keystrokes', () => {
    const result = runDrill(
      'tpu',
      [
        { key: 't', t: 0 },
        { key: 'p', t: 100 },
        { key: 'u', t: 200 },
      ],
      0,
      0,
    )
    const out = recordDrill(initialState(), concept, result)
    expect(out.state.charStats.t?.samples).toBe(1)
    expect(out.state.charStats.u?.samples).toBe(1)
  })
})

describe('overallProgress', () => {
  it('is 0 initially and rises as levels unlock', () => {
    const state = initialState()
    expect(overallProgress(state, [concept])).toBe(0)
    const advanced = recordDrill(
      recordDrill(recordDrill(state, concept, fakeResult(40, 0.99)).state, concept, fakeResult(40, 0.99))
        .state,
      concept,
      fakeResult(40, 0.99),
    ).state
    expect(overallProgress(advanced, [concept])).toBeCloseTo(1 / concept.depth.length, 6)
  })
})

describe('persistence', () => {
  beforeEach(() => localStorage.clear())

  it('returns initial state when storage is empty', () => {
    expect(loadState()).toEqual(initialState())
  })

  it('round-trips through localStorage', () => {
    const state = recordDrill(initialState(), concept, fakeResult(40, 0.99)).state
    saveState(state)
    expect(loadState()).toEqual(state)
  })

  it('discards state from a different version', () => {
    localStorage.setItem('ccdr.state.v1', JSON.stringify({ version: 999, concepts: {}, charStats: {} }))
    expect(loadState()).toEqual(initialState())
  })
})
