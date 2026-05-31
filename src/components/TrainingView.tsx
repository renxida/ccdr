/** Controller for the training screen. Owns the trainer hook, session-summary
 *  state, and the Esc handler; swaps between the M5 layout variants via the
 *  `?variant=a|b|c` query param (default a). Overlays the tier-up banner and the
 *  results summary above whichever layout is active. */
import { useEffect, useState } from 'react'
import { useTrainer, type SessionAgg } from '../hooks/useTrainer'
import { Results } from './Results'
import { Stack } from './layouts/Stack'
import { Focus } from './layouts/Focus'
import { Split } from './layouts/Split'

const LAYOUTS = { a: Stack, b: Focus, c: Split } as const
type VariantKey = keyof typeof LAYOUTS

function activeVariant(): VariantKey {
  const v = new URLSearchParams(window.location.search).get('variant')
  return v && v in LAYOUTS ? (v as VariantKey) : 'a'
}

export function TrainingView() {
  const { view, resetProgress, endSession } = useTrainer()
  const [summary, setSummary] = useState<SessionAgg | null>(null)
  const Layout = LAYOUTS[activeVariant()]

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

  return (
    <div className="relative flex min-h-full flex-col">
      <Layout view={view} resetProgress={resetProgress} />

      {view.showUnlock && (
        <div data-testid="unlock-banner" className="pointer-events-none absolute inset-x-0 top-20 flex justify-center">
          <div className="rounded-full border border-accent bg-surface px-4 py-1.5 font-mono text-xs text-accent">
            unlocked — deeper drill
          </div>
        </div>
      )}

      {summary && <Results agg={summary} stats={view.charStats} onResume={() => setSummary(null)} />}
    </div>
  )
}
