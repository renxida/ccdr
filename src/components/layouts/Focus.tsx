/** Variant B — "Focus": the drill text is the hero. Metrics recede to a faint
 *  top-right readout; the hint shrinks to just the active hand, low and subtle.
 *  The most spartan of the three. */
import { DrillText } from '../DrillText'
import { CC2Hint } from '../CC2Hint'
import { mappingFor } from '../../engine/layout'
import { Footer, TIER_LABEL, type LayoutProps } from './shared'

export function Focus({ view, resetProgress }: LayoutProps) {
  const hand = mappingFor(view.currentChar)?.hand
  return (
    <>
      {/* hairline progress at the very top edge */}
      <div className="h-0.5 w-full bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.round(view.overall * 100)}%` }}
          data-testid="overall-progress"
        />
      </div>

      <header className="flex items-center justify-between px-6 py-4 font-mono text-xs text-dim">
        <span data-testid="tier-badge">
          <span className="text-faint">{view.conceptId}</span> · T{view.tier} {TIER_LABEL[view.tier]}
        </span>
        <span className="tabular-nums">
          <span className="text-text" data-testid="wpm">
            {Math.round(view.liveWPM)}
          </span>
          <span className="text-faint"> wpm · </span>
          <span className="text-text" data-testid="accuracy">
            {Math.round(view.liveAccuracy * 100)}%
          </span>
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-14 px-6">
        <div className="w-full max-w-3xl text-center text-[2rem] leading-relaxed">
          <DrillText text={view.targetText} charStates={view.charStates} />
        </div>
        <div className="w-full max-w-xs opacity-90">
          <CC2Hint targetChar={view.currentChar} stats={view.charStats} only={hand} />
        </div>
      </main>
      <Footer resetProgress={resetProgress} />
    </>
  )
}
