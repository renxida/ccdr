import { describe, expect, it } from 'vitest'
import { scoreText, selectDrill, weightedPick } from '../src/engine/selection'
import { updateCharStat } from '../src/engine/charStats'
import type { CharStats } from '../src/engine/types'

/** Stats where the given chars are well-mastered (fast + accurate). */
function masteredStats(chars: string): CharStats {
  const s: CharStats = {}
  for (const c of chars) {
    let st = updateCharStat(undefined, c, true, 120, 0)
    for (let i = 1; i < 12; i++) st = updateCharStat(st, c, true, 120, i)
    s[c] = st
  }
  return s
}

describe('weightedPick', () => {
  it('selects the bucket the rng lands in', () => {
    const items = ['a', 'b', 'c']
    expect(weightedPick(items, [1, 0, 0], () => 0.5)).toBe('a')
    expect(weightedPick(items, [0, 1, 0], () => 0.5)).toBe('b')
    expect(weightedPick(items, [0, 0, 1], () => 0.5)).toBe('c')
  })

  it('respects proportional weights', () => {
    const items = ['a', 'b']
    // total = 4; rng 0.9 → r=3.6; minus 1 (a) = 2.6 ≥0; minus 3 (b) → picks b
    expect(weightedPick(items, [1, 3], () => 0.9)).toBe('b')
    // rng 0.1 → r=0.4; minus 1 (a) <0 → a
    expect(weightedPick(items, [1, 3], () => 0.1)).toBe('a')
  })

  it('falls back to uniform when all weights are zero', () => {
    expect(weightedPick(['a', 'b', 'c'], [0, 0, 0], () => 0.34)).toBe('b')
  })

  it('throws on malformed input', () => {
    expect(() => weightedPick([], [], () => 0)).toThrow()
    expect(() => weightedPick(['a'], [1, 2], () => 0)).toThrow()
  })
})

describe('scoreText', () => {
  it('scores text of weak (unseen) chars above text of mastered chars', () => {
    const stats = masteredStats('etao')
    expect(scoreText('zzzz', stats)).toBeGreaterThan(scoreText('etao', stats))
  })

  it('ignores non-alphabetic characters', () => {
    expect(scoreText('1234 !!', {})).toBe(0)
  })
})

describe('selectDrill', () => {
  it('biases toward drills containing weak characters', () => {
    const stats = masteredStats('etaoinshrdlu') // common letters mastered
    const candidates = [{ text: 'the train' }, { text: 'zzzz qqqq xxxx' }]
    // rng 0.5 with the weak-heavy candidate carrying most weight → should pick it
    const picked = selectDrill(candidates, stats, () => 0.99)
    expect(picked.text).toBe('zzzz qqqq xxxx')
  })

  it('returns the sole candidate', () => {
    expect(selectDrill([{ text: 'tpu' }], {}, () => 0.5).text).toBe('tpu')
  })

  it('throws with no candidates', () => {
    expect(() => selectDrill([], {}, () => 0)).toThrow()
  })
})
