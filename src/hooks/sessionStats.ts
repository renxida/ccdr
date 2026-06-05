/** Per-session aggregate stats (kept out of the hook file for fast-refresh hygiene). */
import { weaknessWeight } from '../engine/charStats'
import type { CharStats } from '../engine/types'

export interface SessionAgg {
  drills: number
  correctChars: number
  totalKeystrokes: number
  elapsedMs: number
  errorsByChar: Record<string, number>
}

export function emptyAgg(): SessionAgg {
  return { drills: 0, correctChars: 0, totalKeystrokes: 0, elapsedMs: 0, errorsByChar: {} }
}

/** Top problem characters this session (most errors, then weakest stats). */
export function problemChars(agg: SessionAgg, stats: CharStats, n = 5): string[] {
  const byErrors = Object.entries(agg.errorsByChar)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
  if (byErrors.length >= n) return byErrors.slice(0, n)
  const seen = new Set(byErrors)
  const weak = Object.keys(stats)
    .filter((c) => !seen.has(c))
    .sort((a, b) => weaknessWeight(stats[b]) - weaknessWeight(stats[a]))
  return [...byErrors, ...weak].slice(0, n)
}
