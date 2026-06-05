/**
 * Trainer controller — ties together capture (DrillSession), the corpus, the
 * weakness-weighted selection, and the two-axis progression state machine, and
 * exposes a flat `view` model for the layouts. Keystrokes are captured from a
 * global keydown listener; drills auto-advance on completion (keybr-style).
 *
 * Design: the mutable engine objects (LearnerState, current Concept, the live
 * DrillSession, the session aggregate) live in refs and are only touched inside
 * event handlers / effects. Render reads ONLY the `view` state — handlers rebuild
 * it via the pure `buildView` whenever something changes.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CONCEPTS } from '../corpus'
import type { Concept } from '../corpus/types'
import { computeAccuracy, computeWPM } from '../engine/metrics'
import { DrillSession } from '../engine/drill'
import { selectDrill } from '../engine/selection'
import {
  conceptProgress,
  currentDepth,
  initialState,
  loadState,
  overallProgress,
  recordDrill,
  saveState,
  targetForTier,
  type LearnerState,
} from '../engine/progression'
import { emptyAgg, type SessionAgg } from './sessionStats'
import type { CharState, LastOutcome, TrainerView } from './trainerTypes'

interface Transient {
  mistake: boolean
  lastOutcome: LastOutcome | null
  showUnlock: boolean
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

function pickConcept(state: LearnerState): Concept {
  const candidates = CONCEPTS.map((c) => ({
    text: currentDepth(c, conceptProgress(state, c.id)).text,
    concept: c,
  }))
  return selectDrill(candidates, state.charStats).concept
}

function drillTextFor(state: LearnerState, concept: Concept): string {
  return currentDepth(concept, conceptProgress(state, concept.id)).text
}

/** Pure: build the render snapshot from the current engine objects. */
function buildView(
  state: LearnerState,
  concept: Concept,
  session: DrillSession,
  t: Transient,
): TrainerView {
  const prog = conceptProgress(state, concept.id)
  const depth = currentDepth(concept, prog)
  const target = depth.text
  const idx = session.index
  const ks = session.getKeystrokes()
  const correct = ks.filter((k) => k.correct).length
  const elapsed = ks.length > 0 ? ks[ks.length - 1].t - ks[0].t : 0
  const charStates: CharState[] = [...target].map((_, i) =>
    i < idx ? 'correct' : i === idx ? (t.mistake ? 'error' : 'cursor') : 'upcoming',
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
    lastOutcome: t.lastOutcome,
    showUnlock: t.showUnlock,
  }
}

export function useTrainer() {
  const stateRef = useRef<LearnerState>(null!)
  const conceptRef = useRef<Concept>(null!)
  const sessionRef = useRef<DrillSession>(null!)
  const aggRef = useRef<SessionAgg>(null!)
  const outcomeRef = useRef<LastOutcome | null>(null)
  const unlockRef = useRef(false)

  // One-time lazy init: wire up the mutable engine objects. Runs once; refs are
  // only read in handlers/effects afterward, so render OUTPUT stays ref-free. The
  // disable covers the unavoidable ref setup in a lazy initializer (a documented
  // React pattern the rule can't distinguish from a render-time read).
  // eslint-disable-next-line react-hooks/refs
  const [view, setView] = useState<TrainerView>(() => {
    const state = loadState()
    const concept = pickConcept(state)
    const session = new DrillSession(drillTextFor(state, concept))
    stateRef.current = state
    conceptRef.current = concept
    sessionRef.current = session
    aggRef.current = emptyAgg()
    return buildView(state, concept, session, { mistake: false, lastOutcome: null, showUnlock: false })
  })

  /** Rebuild the render snapshot from the refs (call only from handlers/effects). */
  const refresh = useCallback((mistake: boolean) => {
    setView(
      buildView(stateRef.current, conceptRef.current, sessionRef.current, {
        mistake,
        lastOutcome: outcomeRef.current,
        showUnlock: unlockRef.current,
      }),
    )
  }, [])

  const startNextDrill = useCallback(() => {
    const concept = pickConcept(stateRef.current)
    conceptRef.current = concept
    sessionRef.current = new DrillSession(drillTextFor(stateRef.current, concept))
    refresh(false)
  }, [refresh])

  const finishDrill = useCallback(() => {
    const concept = conceptRef.current
    const depth = currentDepth(concept, conceptProgress(stateRef.current, concept.id))
    const { wpm, accuracy } = targetForTier(depth.tier as 0 | 1 | 2 | 3)
    const result = sessionRef.current.result(wpm, accuracy)
    const outcome = recordDrill(stateRef.current, concept, result)
    stateRef.current = outcome.state
    saveState(stateRef.current)

    const agg = aggRef.current
    agg.drills += 1
    agg.correctChars += result.correctChars
    agg.totalKeystrokes += result.totalKeystrokes
    agg.elapsedMs += result.elapsedMs
    for (const k of result.keystrokes) {
      if (!k.correct) agg.errorsByChar[k.expected] = (agg.errorsByChar[k.expected] ?? 0) + 1
    }

    outcomeRef.current = {
      wpm: result.wpm,
      accuracy: result.accuracy,
      passed: outcome.passed,
      unlocked: outcome.unlocked,
    }
    unlockRef.current = outcome.unlocked
    if (outcome.unlocked) {
      setTimeout(() => {
        unlockRef.current = false
        refresh(false)
      }, 1600)
    }
    startNextDrill()
  }, [refresh, startNextDrill])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') return // handled by the view (end session)
      if (e.key.length !== 1) return
      e.preventDefault()
      const out = sessionRef.current.press(e.key, now())
      if (!out) return
      if (out.done) finishDrill()
      else refresh(!out.correct)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finishDrill, refresh])

  const resetProgress = useCallback(() => {
    stateRef.current = initialState()
    saveState(stateRef.current)
    aggRef.current = emptyAgg()
    outcomeRef.current = null
    unlockRef.current = false
    startNextDrill()
  }, [startNextDrill])

  const endSession = useCallback((): SessionAgg => {
    const agg = aggRef.current
    aggRef.current = emptyAgg()
    return agg
  }, [])

  return { view, resetProgress, endSession }
}
