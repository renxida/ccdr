/** Shared bits for the training-screen layout variants (M5). */
import type { TrainerView } from '../../hooks/useTrainer'

export const TIER_LABEL = ['word', 'phrase', 'sentence', 'paragraph']

export interface LayoutProps {
  view: TrainerView
  resetProgress: () => void
}

export function Footer({ resetProgress }: { resetProgress: () => void }) {
  return (
    <footer className="flex items-center justify-center gap-4 px-6 py-3 font-mono text-xs text-faint">
      <span>esc · summary</span>
      <span>·</span>
      <button type="button" onClick={resetProgress} className="hover:text-dim">
        reset progress
      </button>
    </footer>
  )
}

export function LastOutcome({ view }: { view: TrainerView }) {
  const o = view.lastOutcome
  if (!o) return <div className="h-4" />
  return (
    <div className="h-4 font-mono text-xs">
      <span className={o.passed ? 'text-correct' : 'text-dim'}>
        last: {Math.round(o.wpm)} wpm · {Math.round(o.accuracy * 100)}% · {o.passed ? 'pass' : 'keep going'}
      </span>
    </div>
  )
}
