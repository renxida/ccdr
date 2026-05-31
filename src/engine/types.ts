/** Shared engine types. */

export type Direction = 'north' | 'south' | 'east' | 'west' | 'center'
export type Finger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb'
export type Hand = 'left' | 'right'

/** One entry of cc2-layout.json — where a character lives on the device. */
export interface SwitchMapping {
  hand: Hand
  finger: Finger
  /** 0/1/2 for thumb switches, null for finger switches. */
  thumbIndex: number | null
  direction: Direction
  label: string
}
export type Layout = Record<string, SwitchMapping>

/** A single resolved keystroke during a drill. */
export interface Keystroke {
  expected: string
  actual: string
  correct: boolean
  /** Absolute timestamp (ms). */
  t: number
  /** Time since the previous keystroke in this drill (ms). 0 for the first. */
  latencyMs: number
}

/** Running per-character performance (EWMA-smoothed). */
export interface CharStat {
  char: string
  samples: number
  /** EWMA of correctness, 0..1. */
  ewmaAccuracy: number
  /** EWMA of latency on correct presses, ms. */
  ewmaLatencyMs: number
  /** Timestamp of the most recent sample. */
  lastSeen: number
}
export type CharStats = Record<string, CharStat>

/** Outcome of one completed drill. */
export interface DrillResult {
  target: string
  keystrokes: Keystroke[]
  /** Distinct target characters correctly produced (== target.length when finished). */
  correctChars: number
  totalKeystrokes: number
  errors: number
  elapsedMs: number
  wpm: number
  accuracy: number
  /** Met both targetWPM and targetAccuracy for its tier. */
  passed: boolean
}
