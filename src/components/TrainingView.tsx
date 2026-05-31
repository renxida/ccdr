/** Main training screen — composes metrics, drill text, the CC2 hint, and the
 *  progression/results affordances. Spartan, keyboard-driven (see DESIGN.md). */
import { useEffect, useState } from 'react'
import { useTrainer, type SessionAgg } from '../hooks/useTrainer'
import { DrillText } from './DrillText'
import { CC2Hint } from './CC2Hint'
import { Results } from './Results'

const TIER_LABEL = ['word', 'phrase', 'sentence', 'paragraph']

export function TrainingView() {
  const { view, resetProgress, endSession } = useTrainer()
  const [summary, setSummary] = useState<SessionAgg | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setSummary((s) => s ?? endSession())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [endSession])

  const o = view.lastOutcome
  return (
    <div className="relative flex min-h-full flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between px-6 py-4 text-xs">
        <div className="flex items-center gap-3 font-mono">
          <span className="text-accent">ccdr</span>
          <span className="text-faint">·</span>
          <span className="text-dim">{view.conceptId}</span>
          <span className="rounded border border-border px-1.5 py-0.5 text-dim" data-testid="tier-badge">
            T{view.tier} {TIER_LABEL[view.tier]}
          </span>
        </div>
        <div className="flex w-40 items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${Math.round(view.overall * 100)}%` }}
              data-testid="overall-progress"
            />
          </div>
        </div>
      </header>

      {/* center stage */}
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6">
        {/* live metrics */}
        <div className="flex items-end gap-10 font-mono">
          <Metric value={String(Math.round(view.liveWPM))} label="wpm" sub={`/ ${view.targetWPM}`} testid="wpm" />
          <Metric value={`${Math.round(view.liveAccuracy * 100)}%`} label="accuracy" testid="accuracy" />
          <Streak n={view.consecutivePasses} />
        </div>

        {/* drill card */}
        <div className="w-full max-w-2xl rounded-xl border border-border bg-surface px-8 py-7">
          <DrillText text={view.targetText} charStates={view.charStates} />
        </div>

        {/* last drill outcome */}
        <div className="h-4 font-mono text-xs" data-testid="last-outcome">
          {o && (
            <span className={o.passed ? 'text-correct' : 'text-dim'}>
              last: {Math.round(o.wpm)} wpm · {Math.round(o.accuracy * 100)}% · {o.passed ? 'pass' : 'keep going'}
            </span>
          )}
        </div>

        {/* CC2 hint */}
        <div className="w-full max-w-2xl">
          <CC2Hint targetChar={view.currentChar} stats={view.charStats} />
        </div>
      </main>

      {/* footer */}
      <footer className="flex items-center justify-center gap-4 px-6 py-3 font-mono text-xs text-faint">
        <span>esc · summary</span>
        <span>·</span>
        <button type="button" onClick={resetProgress} className="hover:text-dim">
          reset progress
        </button>
      </footer>

      {/* tier-up banner */}
      {view.showUnlock && (
        <div
          data-testid="unlock-banner"
          className="pointer-events-none absolute inset-x-0 top-20 flex justify-center"
        >
          <div className="rounded-full border border-accent bg-surface px-4 py-1.5 font-mono text-xs text-accent">
            unlocked — deeper drill
          </div>
        </div>
      )}

      {summary && <Results agg={summary} stats={view.charStats} onResume={() => setSummary(null)} />}
    </div>
  )
}

function Metric({ value, label, sub, testid }: { value: string; label: string; sub?: string; testid: string }) {
  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl text-text" data-testid={testid}>
          {value}
        </span>
        {sub && <span className="text-xs text-faint">{sub}</span>}
      </div>
      <div className="mt-1 text-xs tracking-wider text-dim uppercase">{label}</div>
    </div>
  )
}

function Streak({ n }: { n: number }) {
  return (
    <div className="text-center">
      <div className="flex justify-center gap-1" data-testid="streak">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < n ? 'bg-accent' : 'bg-border'}`} />
        ))}
      </div>
      <div className="mt-2 text-xs tracking-wider text-dim uppercase">streak</div>
    </div>
  )
}
