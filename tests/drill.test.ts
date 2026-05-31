import { describe, expect, it } from 'vitest'
import {
  DrillSession,
  buildResult,
  deriveSamples,
  ingestResult,
  runDrill,
} from '../src/engine/drill'

describe('DrillSession', () => {
  it('advances only on the correct key and tracks the cursor', () => {
    const s = new DrillSession('tpu')
    expect(s.press('t', 0)).toMatchObject({ correct: true, advanced: true, index: 1 })
    expect(s.press('z', 100)).toMatchObject({ correct: false, advanced: false, index: 1 })
    expect(s.press('p', 200)).toMatchObject({ correct: true, advanced: true, index: 2 })
    expect(s.press('u', 300)).toMatchObject({ correct: true, done: true, index: 3 })
    expect(s.done).toBe(true)
  })

  it('ignores non-character keys and post-completion presses', () => {
    const s = new DrillSession('a')
    expect(s.press('Shift', 0)).toBeNull()
    expect(s.press('Backspace', 1)).toBeNull()
    expect(s.started).toBe(false)
    s.press('a', 10)
    expect(s.done).toBe(true)
    expect(s.press('b', 20)).toBeNull()
  })

  it('starts the clock on the first character key', () => {
    const s = new DrillSession('ab')
    s.press('a', 1000)
    s.press('b', 1200)
    const r = s.result(0, 0)
    expect(r.elapsedMs).toBe(200)
  })
})

describe('buildResult', () => {
  it('computes counts, WPM, accuracy and pass/fail', () => {
    // perfect "tpu": 3 correct chars over 400ms
    const r = runDrill(
      'tpu',
      [
        { key: 't', t: 0 },
        { key: 'p', t: 200 },
        { key: 'u', t: 400 },
      ],
      25,
      0.95,
    )
    expect(r.correctChars).toBe(3)
    expect(r.errors).toBe(0)
    expect(r.totalKeystrokes).toBe(3)
    expect(r.accuracy).toBe(1)
    expect(r.elapsedMs).toBe(400)
    expect(r.passed).toBe(true)
  })

  it('fails a drill below the accuracy target', () => {
    const r = runDrill(
      'ab',
      [
        { key: 'a', t: 0 },
        { key: 'x', t: 100 },
        { key: 'b', t: 200 },
      ],
      10,
      0.95,
    )
    expect(r.errors).toBe(1)
    expect(r.totalKeystrokes).toBe(3)
    expect(r.accuracy).toBeCloseTo(0.6667, 3)
    expect(r.passed).toBe(false)
  })

  it('handles empty keystrokes', () => {
    expect(buildResult('abc', [], 25, 0.95)).toMatchObject({
      correctChars: 0,
      elapsedMs: 0,
      wpm: 0,
      accuracy: 1,
    })
  })
})

describe('deriveSamples', () => {
  it('emits one sample per resolved char, flagging first-try correctness', () => {
    const r = runDrill(
      'ab',
      [
        { key: 'a', t: 0 },
        { key: 'x', t: 100 }, // error at position of 'b'
        { key: 'b', t: 200 },
      ],
      0,
      0,
    )
    const samples = deriveSamples(r)
    expect(samples).toHaveLength(2)
    expect(samples[0]).toMatchObject({ char: 'a', correct: true })
    // 'b' had an error attempt before it resolved → not first-try
    expect(samples[1]).toMatchObject({ char: 'b', correct: false, latencyMs: 200 })
  })
})

describe('ingestResult', () => {
  it('folds a finished drill into the stats map', () => {
    const r = runDrill(
      'ee',
      [
        { key: 'e', t: 0 },
        { key: 'e', t: 150 },
      ],
      0,
      0,
    )
    const stats = ingestResult({}, r)
    expect(stats.e.samples).toBe(2)
    expect(stats.e.ewmaAccuracy).toBe(1)
  })
})
