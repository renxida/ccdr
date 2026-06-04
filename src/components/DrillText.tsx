/** The drill text — per-character states drive the keybr-style coloring. */
import type { CharState } from '../hooks/useTrainer'

const CLASS: Record<CharState, string> = {
  correct: 'text-dim',
  upcoming: 'text-text',
  cursor: 'text-bg bg-accent rounded-[3px]',
  error: 'text-error bg-error-bg rounded-[3px]',
}

/** Font scales down as drills get longer so text + hint always fit on screen. */
function sizeFor(len: number): string {
  if (len > 320) return 'text-base leading-[1.8]' // long paragraph
  if (len > 180) return 'text-lg leading-[1.8]' // paragraph
  if (len > 80) return 'text-2xl leading-[1.7]' // sentence
  return 'text-[1.75rem] leading-[1.7]' // token / phrase
}

export function DrillText({ text, charStates }: { text: string; charStates: CharState[] }) {
  return (
    <p
      data-testid="drill-text"
      className={`font-mono tracking-tight whitespace-pre-wrap break-words ${sizeFor(text.length)}`}
    >
      {[...text].map((ch, i) => (
        <span key={i} className={CLASS[charStates[i] ?? 'upcoming']}>
          {ch}
        </span>
      ))}
    </p>
  )
}
