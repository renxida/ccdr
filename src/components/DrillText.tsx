/** The drill text — per-character states drive the keybr-style coloring. */
import type { CharState } from '../hooks/useTrainer'

const CLASS: Record<CharState, string> = {
  correct: 'text-dim',
  upcoming: 'text-text',
  cursor: 'text-bg bg-accent rounded-[3px]',
  error: 'text-error bg-error-bg rounded-[3px]',
}

export function DrillText({ text, charStates }: { text: string; charStates: CharState[] }) {
  return (
    <p
      data-testid="drill-text"
      className="font-mono text-2xl leading-[1.7] tracking-tight whitespace-pre-wrap break-words"
    >
      {[...text].map((ch, i) => (
        <span key={i} className={CLASS[charStates[i] ?? 'upcoming']}>
          {ch}
        </span>
      ))}
    </p>
  )
}
