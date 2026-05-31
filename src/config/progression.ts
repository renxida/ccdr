/**
 * Progression tuning — the two-axis difficulty model (SPEC §3).
 *
 * Everything here is config, NOT magic numbers buried in the engine. Tweak these
 * to change how fast the learner advances; the engine reads them at runtime.
 */

/** Axis A — typing complexity tiers. */
export const Tier = {
  Word: 0, // T0: single concept token repeated, e.g. "trainium trainium ..."
  Phrase: 1, // T1: short phrase, e.g. "hbm bandwidth"
  Sentence: 2, // T2: one true claim
  Paragraph: 3, // T3: a few connected true claims
} as const
export type Tier = (typeof Tier)[keyof typeof Tier]

export const TIER_ORDER: Tier[] = [Tier.Word, Tier.Phrase, Tier.Sentence, Tier.Paragraph]

export interface ProgressionConfig {
  /** Words-per-minute the learner must sustain to advance, indexed by Tier. */
  targetWPMByTier: Record<Tier, number>
  /** Minimum accuracy (0..1) to count a drill as "passed". */
  targetAccuracy: number
  /** N consecutive passing drills at the current (tier, depth) required to unlock. */
  consecutiveDrillsToUnlock: number
}

export const PROGRESSION: ProgressionConfig = {
  targetWPMByTier: {
    [Tier.Word]: 25,
    [Tier.Phrase]: 30,
    [Tier.Sentence]: 35,
    [Tier.Paragraph]: 40,
  },
  targetAccuracy: 0.95,
  consecutiveDrillsToUnlock: 3,
}

/**
 * Weakness-weighted selection (keybr-style). Upcoming drills bias toward the
 * characters/switches with the worst recent accuracy and latency.
 */
export interface SelectionConfig {
  /** Relative weight of per-char error rate vs. latency when scoring weakness. */
  accuracyWeight: number
  latencyWeight: number
  /** EWMA smoothing factor for per-character running stats (0..1, higher = more reactive). */
  ewmaAlpha: number
  /** Floor weight so even mastered chars occasionally recur (avoid total starvation). */
  minWeight: number
  /** Latency (ms) at/above which a char is considered maximally "slow" for scoring. */
  slowLatencyMs: number
}

export const SELECTION: SelectionConfig = {
  accuracyWeight: 0.6,
  latencyWeight: 0.4,
  ewmaAlpha: 0.3,
  minWeight: 0.05,
  slowLatencyMs: 600,
}

/**
 * Per-character mastery drives BOTH selection de-prioritization and hint fade
 * (SPEC §4: hint intensity fades with proficiency). Mastery is a 0..1 score.
 */
export interface MasteryConfig {
  /** Accuracy & latency a char must hit to count toward mastery. */
  masteredAccuracy: number
  masteredLatencyMs: number
  /** Min samples before mastery is trusted (avoids declaring mastery on 1 lucky hit). */
  minSamples: number
  /** Hint opacity at zero mastery (bright) and full mastery (subtle). */
  hintMaxIntensity: number
  hintMinIntensity: number
}

export const MASTERY: MasteryConfig = {
  masteredAccuracy: 0.97,
  masteredLatencyMs: 250,
  minSamples: 8,
  hintMaxIntensity: 1.0,
  hintMinIntensity: 0.12,
}
