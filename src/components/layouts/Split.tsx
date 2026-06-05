/** Variant C — "Split / cockpit": drill text + metrics on the left, the full CC2
 *  hint persistent on the right so the device stays in peripheral vision while you
 *  type. Stacks on mobile. Best for actively learning switch locations. */
import { DrillText } from '../DrillText'
import { CC2Hint } from '../CC2Hint'
import { Footer, LastOutcome } from './shared'
import { TIER_LABEL, type LayoutProps } from './common'

export function Split({ view, resetProgress }: LayoutProps) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-6 py-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-accent">ccdr</span>
          <span className="text-dim">{view.conceptId}</span>
          <span className="rounded border border-border px-1.5 py-0.5 text-dim" data-testid="tier-badge">
            T{view.tier} {TIER_LABEL[view.tier]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-dim">
            <span className="text-text" data-testid="wpm">{Math.round(view.liveWPM)}</span> wpm
            <span className="text-faint"> /{view.targetWPM}</span>
          </span>
          <span className="tabular-nums text-dim">
            <span className="text-text" data-testid="accuracy">{Math.round(view.liveAccuracy * 100)}%</span>
          </span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${Math.round(view.overall * 100)}%` }}
              data-testid="overall-progress"
            />
          </div>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 items-center gap-8 px-8 py-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-surface px-8 py-7">
            <DrillText text={view.targetText} charStates={view.charStates} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1" data-testid="streak">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`h-2 w-2 rounded-full ${i < view.consecutivePasses ? 'bg-accent' : 'bg-border'}`} />
              ))}
            </div>
            <LastOutcome view={view} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <CC2Hint targetChar={view.currentChar} stats={view.charStats} />
        </div>
      </main>
      <Footer resetProgress={resetProgress} />
    </>
  )
}
