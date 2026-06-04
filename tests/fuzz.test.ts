/**
 * Property/fuzz tests: throw thousands of randomized input sequences at the engine
 * and assert invariants hold (no NaN/Infinity, metrics in range, progression
 * monotonic, state round-trips). Seeded PRNG → any failure reproduces.
 */
import { describe, expect, it } from 'vitest'
import { computeAccuracy, computeWPM } from '../src/engine/metrics'
import {
  emptyStat,
  hintIntensity,
  masteryScore,
  updateCharStat,
  weaknessWeight,
} from '../src/engine/charStats'
import { DrillSession, buildResult, deriveSamples, ingestResult } from '../src/engine/drill'
import { scoreText, selectDrill, weightedPick } from '../src/engine/selection'
import {
  conceptProgress,
  initialState,
  loadState,
  overallProgress,
  recordDrill,
  saveState,
} from '../src/engine/progression'
import { MASTERY, PROGRESSION, SELECTION } from '../src/config/progression'
import type { Concept } from '../src/corpus/types'
import type { CharStats } from '../src/engine/types'

// ── seeded prng ──────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(0xc0ffee)
const pick = <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)]
const finite = (x: number) => Number.isFinite(x)
const KEYS = 'abcdefghijklmnopqrstuvwxyz0123456789 .,/'.split('')
const NON_CHARS = ['Shift', 'Backspace', 'Enter', 'ArrowLeft', 'Control', 'Tab', 'Escape']

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'
function randText(maxLen: number): string {
  const len = 1 + Math.floor(rnd() * maxLen)
  let s = ''
  for (let i = 0; i < len; i++) s += pick([...ALPHA, ...ALPHA, ' ', '2', '.'])
  return s.trim() || 'x'
}

describe('fuzz: metrics never produce NaN/Infinity or out-of-range', () => {
  it('computeWPM / computeAccuracy stay sane over random non-negative inputs', () => {
    for (let i = 0; i < 5000; i++) {
      const total = Math.floor(rnd() * 500)
      const correct = Math.floor(rnd() * (total + 1))
      const ms = Math.floor(rnd() * 600_000)
      const wpm = computeWPM(correct, ms)
      const acc = computeAccuracy(correct, total)
      expect(finite(wpm) && wpm >= 0, `wpm ${wpm}`).toBe(true)
      expect(acc >= 0 && acc <= 1, `acc ${acc}`).toBe(true)
    }
  })
})

describe('fuzz: DrillSession survives arbitrary key streams', () => {
  it('cursor stays in bounds, completes correctly, metrics sane', () => {
    for (let iter = 0; iter < 1500; iter++) {
      const target = randText(40)
      const s = new DrillSession(target)
      let t = Math.floor(rnd() * 1000)
      let lastIndex = 0
      for (let k = 0; k < target.length * 3 + 10; k++) {
        // mix: correct key, random key, garbage non-char; occasionally jump time backwards
        const r = rnd()
        const key =
          r < 0.5 ? target[s.index] ?? pick(KEYS) : r < 0.85 ? pick(KEYS) : pick(NON_CHARS)
        t += Math.floor(rnd() * 300) - 30 // sometimes negative dt
        const out = s.press(key, t)
        expect(s.index).toBeGreaterThanOrEqual(lastIndex) // monotonic
        expect(s.index).toBeLessThanOrEqual(target.length) // in bounds
        lastIndex = s.index
        if (out === null) expect(key.length !== 1 || s.done).toBe(true)
        if (s.done) {
          expect(s.press('a', t + 1)).toBeNull() // no presses after done
          break
        }
      }
      const res = s.result(25, 0.95)
      expect(res.accuracy >= 0 && res.accuracy <= 1).toBe(true)
      expect(finite(res.wpm) && res.wpm >= 0).toBe(true)
      expect(res.errors).toBeGreaterThanOrEqual(0)
      expect(res.correctChars).toBeLessThanOrEqual(res.totalKeystrokes)
      // samples derive cleanly
      for (const smp of deriveSamples(res)) expect(finite(smp.latencyMs)).toBe(true)
    }
  })
})

describe('fuzz: char stats stay bounded', () => {
  it('ewma, mastery, weakness, hint intensity remain in range', () => {
    for (let iter = 0; iter < 2000; iter++) {
      let stat = emptyStat('x')
      const n = 1 + Math.floor(rnd() * 30)
      for (let i = 0; i < n; i++) {
        const correct = rnd() < 0.7
        const latency = Math.floor(rnd() * 2000) - 100 // sometimes negative
        stat = updateCharStat(stat, 'x', correct, latency, i)
      }
      expect(stat.ewmaAccuracy >= 0 && stat.ewmaAccuracy <= 1, `acc ${stat.ewmaAccuracy}`).toBe(true)
      expect(finite(stat.ewmaLatencyMs)).toBe(true)
      const m = masteryScore(stat)
      expect(m >= 0 && m <= 1, `mastery ${m}`).toBe(true)
      const w = weaknessWeight(stat)
      expect(w >= SELECTION.minWeight && w <= 1 && finite(w), `weight ${w}`).toBe(true)
      const h = hintIntensity(stat)
      expect(h >= MASTERY.hintMinIntensity - 1e-9 && h <= MASTERY.hintMaxIntensity + 1e-9).toBe(true)
    }
  })
})

describe('fuzz: selection always returns a valid choice', () => {
  it('weightedPick returns an item; never throws on valid arrays incl zero/neg weights', () => {
    for (let iter = 0; iter < 3000; iter++) {
      const n = 1 + Math.floor(rnd() * 8)
      const items = Array.from({ length: n }, (_, i) => i)
      const weights = items.map(() => (rnd() < 0.2 ? 0 : rnd() < 0.1 ? -rnd() : rnd() * 10))
      const choice = weightedPick(items, weights, rnd)
      expect(items).toContain(choice)
    }
  })

  it('selectDrill picks a candidate over random stats', () => {
    const candidates = Array.from({ length: 6 }, (_, i) => ({ text: randText(60), i }))
    for (let iter = 0; iter < 1000; iter++) {
      const stats: CharStats = {}
      for (const c of ALPHA) if (rnd() < 0.5) stats[c] = updateCharStat(undefined, c, rnd() < 0.6, rnd() * 600, 0)
      const chosen = selectDrill(candidates, stats, rnd)
      expect(candidates).toContain(chosen)
      expect(finite(scoreText(chosen.text, stats)) && scoreText(chosen.text, stats) >= 0).toBe(true)
    }
  })
})

describe('fuzz: progression state machine invariants', () => {
  const concept: Concept = {
    id: 'c',
    token: 'tpu',
    depth: [
      { tier: 0, text: 'tpu' },
      { tier: 1, text: 'tpu pod' },
      { tier: 2, text: 'a tpu v5p pod has 8960 chips' },
      { tier: 3, text: 'a tpu pod connects many chips over a 3d torus and more' },
    ],
  }

  function fakeResult(wpm: number, accuracy: number) {
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

  it('level is monotonic, bounded, streak < N; progress in [0,1]', () => {
    for (let trial = 0; trial < 300; trial++) {
      let state = initialState()
      let prevLevel = 0
      for (let i = 0; i < 60; i++) {
        const res = fakeResult(rnd() * 60, rnd()) // random pass/fail
        const out = recordDrill(state, concept, res)
        state = out.state
        const p = conceptProgress(state, 'c')
        expect(p.level).toBeGreaterThanOrEqual(prevLevel) // monotonic
        expect(p.level).toBeLessThanOrEqual(concept.depth.length) // bounded
        expect(p.consecutivePasses).toBeGreaterThanOrEqual(0)
        expect(p.consecutivePasses).toBeLessThan(PROGRESSION.consecutiveDrillsToUnlock)
        prevLevel = p.level
        const op = overallProgress(state, [concept])
        expect(op >= 0 && op <= 1, `progress ${op}`).toBe(true)
      }
    }
  })

  it('ingesting random real drills keeps charStats sane and round-trips through storage', () => {
    let state = initialState()
    for (let i = 0; i < 400; i++) {
      const target = randText(30)
      const s = new DrillSession(target)
      let t = i * 1000
      while (!s.done) {
        const key = rnd() < 0.8 ? target[s.index] : pick(KEYS)
        t += Math.floor(rnd() * 200)
        s.press(key, t)
      }
      state = ingestResult(state, s.result(25, 0.95))
    }
    for (const k of Object.keys(state.charStats)) {
      const st = state.charStats[k]
      expect(st.ewmaAccuracy >= 0 && st.ewmaAccuracy <= 1).toBe(true)
      expect(finite(st.ewmaLatencyMs)).toBe(true)
    }
    saveState(state)
    expect(loadState()).toEqual(state)
  })
})
