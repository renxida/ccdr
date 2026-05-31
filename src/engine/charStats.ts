/**
 * Per-character running stats (EWMA), and the three things derived from them:
 *  - mastery score   → drives hint fade (§4) and selection de-prioritization
 *  - weakness weight  → drives weakness-weighted drill selection (§3)
 *  - hint intensity   → opacity of the CC2 hint for that character
 */
import { MASTERY, SELECTION } from '../config/progression'
import type { CharStat, CharStats } from './types'

export function emptyStat(char: string): CharStat {
  return { char, samples: 0, ewmaAccuracy: 1, ewmaLatencyMs: SELECTION.slowLatencyMs, lastSeen: 0 }
}

/**
 * Fold one keystroke sample into a character's stats. `correct` updates the
 * accuracy EWMA; latency only contributes on correct presses (a wrong press has
 * no meaningful "time to produce this char").
 */
export function updateCharStat(
  prev: CharStat | undefined,
  char: string,
  correct: boolean,
  latencyMs: number,
  now: number,
  alpha: number = SELECTION.ewmaAlpha,
): CharStat {
  const s = prev ?? emptyStat(char)
  // On the very first sample, snap to it rather than blending with the prior.
  const first = s.samples === 0
  const accSample = correct ? 1 : 0
  const ewmaAccuracy = first ? accSample : alpha * accSample + (1 - alpha) * s.ewmaAccuracy
  let ewmaLatencyMs = s.ewmaLatencyMs
  if (correct && latencyMs > 0) {
    ewmaLatencyMs = first ? latencyMs : alpha * latencyMs + (1 - alpha) * s.ewmaLatencyMs
  }
  return {
    char,
    samples: s.samples + 1,
    ewmaAccuracy,
    ewmaLatencyMs,
    lastSeen: now,
  }
}

/** Apply a batch of (char, correct, latency) samples; returns a new stats map. */
export function applySamples(
  stats: CharStats,
  samples: { char: string; correct: boolean; latencyMs: number; t: number }[],
): CharStats {
  const next: CharStats = { ...stats }
  for (const s of samples) {
    next[s.char] = updateCharStat(next[s.char], s.char, s.correct, s.latencyMs, s.t)
  }
  return next
}

/**
 * Mastery 0..1. Combines accuracy and speed, gated by sample count: a char with
 * fewer than `minSamples` cannot be fully mastered (avoids one-lucky-hit mastery).
 */
export function masteryScore(stat: CharStat | undefined): number {
  if (!stat || stat.samples === 0) return 0
  const accTerm = clamp01(
    (stat.ewmaAccuracy - floorAccuracyForMastery()) / (MASTERY.masteredAccuracy - floorAccuracyForMastery()),
  )
  const speedTerm = clamp01(MASTERY.masteredLatencyMs / Math.max(stat.ewmaLatencyMs, 1))
  const confidence = clamp01(stat.samples / MASTERY.minSamples)
  // Multiplicative: a char is "mastered" only when BOTH accurate AND fast. A char
  // typed accurately but slowly stays low-mastery, so its hint keeps showing (§4).
  return accTerm * speedTerm * confidence
}

/**
 * Weakness weight for selection. Higher = more likely to be drilled. Unseen
 * characters get the maximum (1) so new material is prioritized. Mastered chars
 * still keep `minWeight` so they recur occasionally.
 */
export function weaknessWeight(stat: CharStat | undefined): number {
  if (!stat || stat.samples === 0) return 1
  const errTerm = 1 - stat.ewmaAccuracy
  const slowTerm = clamp01(stat.ewmaLatencyMs / SELECTION.slowLatencyMs)
  const raw = SELECTION.accuracyWeight * errTerm + SELECTION.latencyWeight * slowTerm
  return Math.max(SELECTION.minWeight, raw)
}

/** Hint opacity for a char: bright when weak, faint when mastered (§4). */
export function hintIntensity(stat: CharStat | undefined): number {
  const m = masteryScore(stat)
  return MASTERY.hintMaxIntensity - m * (MASTERY.hintMaxIntensity - MASTERY.hintMinIntensity)
}

// Accuracy below this contributes nothing to mastery (so 50% accuracy ≠ "half mastered").
function floorAccuracyForMastery(): number {
  return 0.8
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}
