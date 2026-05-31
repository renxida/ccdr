/**
 * Drill capture: turns a stream of keypresses into a DrillResult and per-character
 * samples. keybr-style forced-correct entry — a wrong key is recorded as an error
 * but the cursor does NOT advance; you must type the expected character to move on.
 */
import { computeAccuracy, computeWPM } from './metrics'
import type { CharStat, CharStats, DrillResult, Keystroke } from './types'
import { updateCharStat } from './charStats'

export interface PressOutcome {
  correct: boolean
  advanced: boolean
  done: boolean
  index: number
}

/** Live, mutable drill session. The UI feeds it keypresses; tests replay them. */
export class DrillSession {
  readonly target: string
  private idx = 0
  private keystrokes: Keystroke[] = []
  private startedAt: number | null = null
  private lastT = 0

  constructor(target: string) {
    this.target = target
  }

  get index(): number {
    return this.idx
  }
  get done(): boolean {
    return this.idx >= this.target.length
  }
  get started(): boolean {
    return this.startedAt !== null
  }
  getKeystrokes(): readonly Keystroke[] {
    return this.keystrokes
  }

  /**
   * Feed one key event. Non-character keys (Shift, Backspace, Arrow…) are ignored
   * and return null. The clock starts on the first character key.
   */
  press(key: string, t: number): PressOutcome | null {
    if (this.done) return null
    if (key.length !== 1) return null
    if (this.startedAt === null) {
      this.startedAt = t
      this.lastT = t
    }
    const expected = this.target[this.idx]
    const correct = key === expected
    const latencyMs = this.keystrokes.length === 0 ? 0 : t - this.lastT
    this.keystrokes.push({ expected, actual: key, correct, t, latencyMs })
    this.lastT = t
    if (correct) this.idx++
    return { correct, advanced: correct, done: this.done, index: this.idx }
  }

  result(targetWPM: number, targetAccuracy: number): DrillResult {
    return buildResult(this.target, this.keystrokes, targetWPM, targetAccuracy)
  }
}

/** Build a DrillResult from recorded keystrokes (pure). */
export function buildResult(
  target: string,
  keystrokes: Keystroke[],
  targetWPM: number,
  targetAccuracy: number,
): DrillResult {
  const correctChars = keystrokes.filter((k) => k.correct).length
  const totalKeystrokes = keystrokes.length
  const errors = totalKeystrokes - correctChars
  const elapsedMs =
    keystrokes.length > 0 ? keystrokes[keystrokes.length - 1].t - keystrokes[0].t : 0
  const wpm = computeWPM(correctChars, elapsedMs)
  const accuracy = computeAccuracy(correctChars, totalKeystrokes)
  return {
    target,
    keystrokes,
    correctChars,
    totalKeystrokes,
    errors,
    elapsedMs,
    wpm,
    accuracy,
    passed: wpm >= targetWPM && accuracy >= targetAccuracy,
  }
}

/**
 * Reduce a result to one sample per resolved target character:
 *  - `correct`  = was it produced on the first attempt (no error at this position)
 *  - `latencyMs`= interval from the previous correctly-produced char to this one
 * This is what feeds the per-character EWMA stats (mastery / weakness).
 */
export function deriveSamples(
  result: DrillResult,
): { char: string; correct: boolean; latencyMs: number; t: number }[] {
  const samples: { char: string; correct: boolean; latencyMs: number; t: number }[] = []
  let errorsForPos = 0
  let prevCorrectT: number | null = null
  for (const k of result.keystrokes) {
    if (k.correct) {
      const latencyMs = prevCorrectT === null ? 0 : k.t - prevCorrectT
      samples.push({ char: k.expected, correct: errorsForPos === 0, latencyMs, t: k.t })
      prevCorrectT = k.t
      errorsForPos = 0
    } else {
      errorsForPos++
    }
  }
  return samples
}

/** Fold a finished drill's samples into a stats map (pure; returns a new map). */
export function ingestResult(stats: CharStats, result: DrillResult): CharStats {
  const next: CharStats = { ...stats }
  for (const s of deriveSamples(result)) {
    next[s.char] = updateCharStat(next[s.char], s.char, s.correct, s.latencyMs, s.t)
  }
  return next
}

export type { CharStat }

/** Replay a full key sequence through a fresh session (pure; for tests + e2e). */
export function runDrill(
  target: string,
  keys: { key: string; t: number }[],
  targetWPM: number,
  targetAccuracy: number,
): DrillResult {
  const s = new DrillSession(target)
  for (const k of keys) s.press(k.key, k.t)
  return s.result(targetWPM, targetAccuracy)
}
