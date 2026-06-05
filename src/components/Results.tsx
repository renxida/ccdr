/** Session summary overlay (SPEC §7 results state). Calm, data-only. */
import { useEffect } from 'react'
import { computeAccuracy, computeWPM } from '../engine/metrics'
import { problemChars, type SessionAgg } from '../hooks/sessionStats'
import type { CharStats } from '../engine/types'

export function Results({
  agg,
  stats,
  onResume,
}: {
  agg: SessionAgg
  stats: CharStats
  onResume: () => void
}) {
  useEffect(() => {
    const onKey = () => onResume()
    window.addEventListener('keydown', onKey, { once: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [onResume])

  const wpm = Math.round(computeWPM(agg.correctChars, agg.elapsedMs))
  const acc = Math.round(computeAccuracy(agg.correctChars, agg.totalKeystrokes) * 100)
  const problems = problemChars(agg, stats)

  return (
    <div
      data-testid="results"
      className="absolute inset-0 z-20 flex items-center justify-center bg-bg/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <h2 className="mb-6 font-mono text-sm tracking-widest text-dim uppercase">session summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat label="wpm" value={String(wpm)} />
          <Stat label="accuracy" value={`${acc}%`} />
          <Stat label="drills" value={String(agg.drills)} />
        </div>
        {problems.length > 0 && (
          <p className="mt-6 text-center text-sm text-dim">
            focus next on{' '}
            <span className="font-mono text-error">{problems.join(' ')}</span>
          </p>
        )}
        <button
          type="button"
          onClick={onResume}
          className="mt-8 w-full rounded-md border border-border py-2 font-mono text-sm text-text transition-colors hover:border-accent hover:text-accent"
        >
          resume · any key
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-3xl text-text">{value}</div>
      <div className="mt-1 font-mono text-xs tracking-wider text-dim uppercase">{label}</div>
    </div>
  )
}
