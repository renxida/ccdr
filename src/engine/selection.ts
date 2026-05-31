/**
 * Weakness-weighted drill selection (keybr-style, §3): bias the next drill toward
 * the characters the learner is currently worst at (low accuracy / high latency).
 */
import type { CharStats } from './types'
import { weaknessWeight } from './charStats'

export type Rng = () => number

/**
 * Pick one item by weight. `rng` returns [0,1); injectable for deterministic tests.
 * Falls back to a uniform pick if all weights are non-positive.
 */
export function weightedPick<T>(items: T[], weights: number[], rng: Rng = Math.random): T {
  if (items.length === 0) throw new Error('weightedPick: empty items')
  if (items.length !== weights.length) throw new Error('weightedPick: length mismatch')
  const total = weights.reduce((a, w) => a + Math.max(0, w), 0)
  if (total <= 0) return items[Math.min(items.length - 1, Math.floor(rng() * items.length))]
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, weights[i])
    if (r < 0) return items[i]
  }
  return items[items.length - 1]
}

/**
 * Weakness score of a piece of text = mean weakness weight over its alphabetic
 * characters. Drills full of weak characters score higher and are favored.
 */
export function scoreText(text: string, stats: CharStats): number {
  const chars = [...text.toLowerCase()].filter((c) => c >= 'a' && c <= 'z')
  if (chars.length === 0) return 0
  const sum = chars.reduce((a, c) => a + weaknessWeight(stats[c]), 0)
  return sum / chars.length
}

/**
 * Choose the next drill from candidates, weighted by each candidate's weakness
 * score. `selectivity` sharpens the bias (score ** selectivity); 1 = linear.
 */
export function selectDrill<T extends { text: string }>(
  candidates: T[],
  stats: CharStats,
  rng: Rng = Math.random,
  selectivity = 1.5,
): T {
  if (candidates.length === 0) throw new Error('selectDrill: no candidates')
  const weights = candidates.map((c) => Math.pow(scoreText(c.text, stats), selectivity))
  return weightedPick(candidates, weights, rng)
}
