/**
 * Trainer controller — ties together capture (DrillSession), the corpus, the
 * weakness-weighted selection, and the two-axis progression state machine, and
 * exposes a flat view model for TrainingView. Keystrokes are captured from a
 * global keydown listener; drills auto-advance on completion (keybr-style).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONCEPTS } from '../corpus'
import type { Concept } from '../corpus/types'
import { computeAccuracy, computeWPM } from '../engine/metrics'
import { weaknessWeight } from '../engine/charStats'
import { DrillSession } from '../engine/drill'
import { selectDrill } from '../engine/selection'
import {
  conceptProgress,
  currentDepth,
  loadState,
  overallProgress,
  recordDrill,
  saveState,
  initialState,
  type LearnerState,
} from '../engine/progression'
import { targetForTier } from '../engine/progression'
import type { CharStats } from '../engine/types'

export type CharState = 'correct' | 'cursor' | 'error' | 'upcoming'

export interface LastOutcome {
  wpm: number
  accuracy: number
  passed: boolean
  unlocked: boolean
}

export interface SessionAgg {
  drills: number
  correctChars: number
  totalKeystrokes: number
  elapsedMs: number
  errorsByChar: Record<string, number>
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
  sessionAgg: SessionAgg
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

function pickConcept(state: LearnerState): Concept {
  const candidates = CONCEPTS.map((c) => ({
    text: currentDepth(c, conceptProgress(state, c.id)).text,
    concept: c,
  }))
  return selectDrill(candidates, state.charStats).concept
}

export function useTrainer() {
  const stateRef = useRef<LearnerState>(loadState())
  const conceptRef = useRef<Concept>(pickConcept(stateRef.current))
  const sessionRef = useRef<DrillSession>(
    new DrillSession(currentDepth(conceptRef.current, conceptProgress(stateRef.current, conceptRef.current.id)).text),
  )
  const aggRef = useRef<SessionAgg>(emptyAgg())

  // Reactive mirror of the engine state (bumped to force re-render).
  const [, force] = useState(0)
  const rerender = useCallback(() => force((n) => n + 1), [])
  const [cursorIndex, setCursorIndex] = useState(0)
  const [mistake, setMistake] = useState(false)
  const [lastOutcome, setLastOutcome] = useState<LastOutcome | null>(null)
  const [showUnlock, setShowUnlock] = useState(false)

  const startNextDrill = useCallback(() => {
    const concept = pickConcept(stateRef.current)
    conceptRef.current = concept
    const text = currentDepth(concept, conceptProgress(stateRef.current, concept.id)).text
    sessionRef.current = new DrillSession(text)
    setCursorIndex(0)
    setMistake(false)
    rerender()
  }, [rerender])

  const finishDrill = useCallback(() => {
    const concept = conceptRef.current
    const session = sessionRef.current
    const depth = currentDepth(concept, conceptProgress(stateRef.current, concept.id))
    const { wpm, accuracy } = targetForTier(depth.tier as 0 | 1 | 2 | 3)
    const result = session.result(wpm, accuracy)
    const outcome = recordDrill(stateRef.current, concept, result)
    stateRef.current = outcome.state
    saveState(stateRef.current)

    // accumulate session aggregate
    const agg = aggRef.current
    agg.drills += 1
    agg.correctChars += result.correctChars
    agg.totalKeystrokes += result.totalKeystrokes
    agg.elapsedMs += result.elapsedMs
    for (const k of result.keystrokes) {
      if (!k.correct) agg.errorsByChar[k.expected] = (agg.errorsByChar[k.expected] ?? 0) + 1
    }

    setLastOutcome({ wpm: result.wpm, accuracy: result.accuracy, passed: outcome.passed, unlocked: outcome.unlocked })
    if (outcome.unlocked) {
      setShowUnlock(true)
      setTimeout(() => setShowUnlock(false), 1600)
    }
    startNextDrill()
  }, [startNextDrill])

  // global keystroke capture
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') return // handled by the view (end session)
      if (e.key.length !== 1) return
      e.preventDefault()
      const out = sessionRef.current.press(e.key, now())
      if (!out) return
      setMistake(!out.correct)
      setCursorIndex(sessionRef.current.index)
      if (out.done) finishDrill()
      else rerender()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finishDrill, rerender])

  const resetProgress = useCallback(() => {
    stateRef.current = initialState()
    saveState(stateRef.current)
    aggRef.current = emptyAgg()
    setLastOutcome(null)
    startNextDrill()
  }, [startNextDrill])

  const endSession = useCallback(() => {
    const agg = aggRef.current
    aggRef.current = emptyAgg()
    return agg
  }, [])

  const view: TrainerView = useMemo(() => {
    const state = stateRef.current
    const concept = conceptRef.current
    const prog = conceptProgress(state, concept.id)
    const depth = currentDepth(concept, prog)
    const target = depth.text
    const idx = cursorIndex
    const ks = sessionRef.current.getKeystrokes()
    const correct = ks.filter((k) => k.correct).length
    const elapsed = ks.length > 0 ? ks[ks.length - 1].t - ks[0].t : 0
    const charStates: CharState[] = [...target].map((_, i) =>
      i < idx ? 'correct' : i === idx ? (mistake ? 'error' : 'cursor') : 'upcoming',
    )
    return {
      conceptId: concept.id,
      token: concept.token,
      tier: depth.tier,
      targetText: target,
      cursorIndex: idx,
      charStates,
      currentChar: target[idx] ?? '',
      liveWPM: computeWPM(correct, elapsed),
      liveAccuracy: computeAccuracy(correct, ks.length),
      overall: overallProgress(state, CONCEPTS),
      charStats: state.charStats,
      consecutivePasses: prog.consecutivePasses,
      targetWPM: targetForTier(depth.tier as 0 | 1 | 2 | 3).wpm,
      lastOutcome,
      showUnlock,
      sessionAgg: aggRef.current,
    }
  }, [cursorIndex, mistake, lastOutcome, showUnlock])

  return { view, resetProgress, endSession }
}

function emptyAgg(): SessionAgg {
  return { drills: 0, correctChars: 0, totalKeystrokes: 0, elapsedMs: 0, errorsByChar: {} }
}

/** Top problem characters this session (most errors, then weakest stats). */
export function problemChars(agg: SessionAgg, stats: CharStats, n = 5): string[] {
  const byErrors = Object.entries(agg.errorsByChar).sort((a, b) => b[1] - a[1]).map(([c]) => c)
  if (byErrors.length >= n) return byErrors.slice(0, n)
  const seen = new Set(byErrors)
  const weak = Object.keys(stats)
    .filter((c) => !seen.has(c))
    .sort((a, b) => weaknessWeight(stats[b]) - weaknessWeight(stats[a]))
  return [...byErrors, ...weak].slice(0, n)
}
