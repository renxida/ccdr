/** View-model types for the trainer (kept separate so useTrainer.ts exports only
 *  the hook — keeps React Fast Refresh happy). */
import type { CharStats } from '../engine/types'

export type CharState = 'correct' | 'cursor' | 'error' | 'upcoming'

export interface LastOutcome {
  wpm: number
  accuracy: number
  passed: boolean
  unlocked: boolean
}

export interface TrainerView {
  conceptId: string
  token: string
  tier: number
  targetText: string
  cursorIndex: number
  charStates: CharState[]
  currentChar: string
  liveWPM: number
  liveAccuracy: number
  overall: number
  charStats: CharStats
  consecutivePasses: number
  targetWPM: number
  lastOutcome: LastOutcome | null
  showUnlock: boolean
}
