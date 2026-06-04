/** Variant A — "Stack": classic keybr arrangement. Metrics on top, drill card in
 *  the middle, CC2 hint below. Balanced and calm. */
import { DrillText } from '../DrillText'
import { CC2Hint } from '../CC2Hint'
import { Footer, LastOutcome, TIER_LABEL, type LayoutProps } from './shared'

export function Stack({ view, resetProgress }: LayoutProps) {
  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 text-xs">
        <div className="flex items-center gap-3 font-mono">
          <span className="text-accent">ccdr</span>
          <span className="text-faint">·</span>
          <span className="text-dim">{view.conceptId}</span>
          <span className="rounded border border-border px-1.5 py-0.5 text-dim" data-testid="tier-badge">
            T{view.tier} {TIER_LABEL[view.tier]}
          </span>
        </div>
        <div className="flex w-40 items-center">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${Math.round(view.overall * 100)}%` }}
              data-testid="overall-progress"
            />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-4">
        <div className="flex items-end gap-10 font-mono">
          <Metric value={String(Math.round(view.liveWPM))} label="wpm" sub={`/ ${view.targetWPM}`} testid="wpm" />
          <Metric value={`${Math.round(view.liveAccuracy * 100)}%`} label="accuracy" testid="accuracy" />
          <Streak n={view.consecutivePasses} />
        </div>
        <div className="w-full max-w-2xl rounded-xl border border-border bg-surface px-8 py-6">
          <DrillText text={view.targetText} charStates={view.charStates} />
        </div>
        <LastOutcome view={view} />
        {/* hint shrinks at deeper tiers so long drills + hint both stay on screen */}
        <div className={`w-full shrink-0 ${view.tier >= 3 ? 'max-w-md' : view.tier === 2 ? 'max-w-lg' : 'max-w-2xl'}`}>
          <CC2Hint targetChar={view.currentChar} stats={view.charStats} />
        </div>
      </main>
      <Footer resetProgress={resetProgress} />
    </>
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
