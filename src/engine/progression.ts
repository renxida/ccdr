/**
 * Two-axis progression state machine (SPEC §3).
 *
 * Each concept owns an ordered `depth[]` chain (Axis B knowledge depth) whose
 * entries also rise in complexity tier (Axis A). A learner drills a concept at its
 * current level; sustaining ≥ targetWPM and ≥ targetAccuracy across N consecutive
 * drills unlocks the next level (deeper statement at a higher tier). Different
 * concepts advance independently; weakness-weighted selection (selection.ts) picks
 * which concept to drill next.
 */
import { PROGRESSION, type Tier } from '../config/progression'
import type { Concept, DepthEntry } from '../corpus/types'
import { ingestResult } from './drill'
import type { CharStats, DrillResult } from './types'

const STATE_VERSION = 1
const STORAGE_KEY = 'ccdr.state.v1'

export interface ConceptProgress {
  /** Index into the concept's depth chain (current (tier, depth) cell). */
  level: number
  /** Consecutive passing drills at the current level. */
  consecutivePasses: number
  attempts: number
}

export interface LearnerState {
  version: number
  concepts: Record<string, ConceptProgress>
  charStats: CharStats
}

export function initialState(): LearnerState {
  return { version: STATE_VERSION, concepts: {}, charStats: {} }
}

export function conceptProgress(state: LearnerState, id: string): ConceptProgress {
  return state.concepts[id] ?? { level: 0, consecutivePasses: 0, attempts: 0 }
}

/** Ordered depth chain (already tier-ascending in the corpus). */
export function levels(concept: Concept): DepthEntry[] {
  return concept.depth
}

/** The depth entry currently being drilled (clamped to the last when complete). */
export function currentDepth(concept: Concept, progress: ConceptProgress): DepthEntry {
  const ls = levels(concept)
  return ls[Math.min(progress.level, ls.length - 1)]
}

/** True once the learner has unlocked past the final depth entry. */
export function isConceptComplete(concept: Concept, progress: ConceptProgress): boolean {
  return progress.level >= levels(concept).length
}

/** Speed/accuracy bar for a tier. */
export function targetForTier(tier: Tier): { wpm: number; accuracy: number } {
  return { wpm: PROGRESSION.targetWPMByTier[tier], accuracy: PROGRESSION.targetAccuracy }
}

/** Did this result clear the bar for the given tier? */
export function drillPassed(result: DrillResult, tier: Tier): boolean {
  const { wpm, accuracy } = targetForTier(tier)
  return result.wpm >= wpm && result.accuracy >= accuracy
}

export interface RecordOutcome {
  state: LearnerState
  passed: boolean
  /** True if this drill unlocked the next level. */
  unlocked: boolean
  /** The level after recording (for "tier-up" UI). */
  level: number
  tier: Tier
  /** True if the concept's whole depth chain is now complete. */
  complete: boolean
}

/**
 * Fold one finished drill into learner state: updates per-character stats and the
 * concept's pass streak, unlocking the next level after N consecutive passes.
 * Pure — returns a new state.
 */
export function recordDrill(
  state: LearnerState,
  concept: Concept,
  result: DrillResult,
): RecordOutcome {
  const prog = conceptProgress(state, concept.id)
  const entry = currentDepth(concept, prog)
  const tier = entry.tier as Tier
  const passed = drillPassed(result, tier)

  let level = prog.level
  let consecutivePasses = passed ? prog.consecutivePasses + 1 : 0
  let unlocked = false
  if (consecutivePasses >= PROGRESSION.consecutiveDrillsToUnlock && level < levels(concept).length) {
    level += 1
    consecutivePasses = 0
    unlocked = true
  }

  const nextProg: ConceptProgress = { level, consecutivePasses, attempts: prog.attempts + 1 }
  const state2: LearnerState = {
    ...state,
    concepts: { ...state.concepts, [concept.id]: nextProg },
    charStats: ingestResult(state.charStats, result),
  }
  return {
    state: state2,
    passed,
    unlocked,
    level,
    tier,
    complete: isConceptComplete(concept, nextProg),
  }
}

/** Fraction of total depth levels unlocked across all concepts (0..1). */
export function overallProgress(state: LearnerState, concepts: Concept[]): number {
  const total = concepts.reduce((a, c) => a + levels(c).length, 0)
  if (total === 0) return 0
  const done = concepts.reduce((a, c) => a + Math.min(conceptProgress(state, c.id).level, levels(c).length), 0)
  return done / total
}

// ── persistence ────────────────────────────────────────────────────────────

export function loadState(): LearnerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as LearnerState
    if (parsed.version !== STATE_VERSION) return initialState()
    return { ...initialState(), ...parsed }
  } catch {
    return initialState()
  }
}

export function saveState(state: LearnerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode / quota) — progress is best-effort */
  }
}
