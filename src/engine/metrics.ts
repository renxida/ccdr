/** Pure WPM / accuracy math. The canonical "word" is 5 characters. */

const MS_PER_MIN = 60_000

/**
 * Words-per-minute from correctly produced characters over elapsed time.
 * Uses the standard 5-chars-per-word convention. Returns 0 for non-positive time.
 */
export function computeWPM(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0
  return correctChars / 5 / (elapsedMs / MS_PER_MIN)
}

/**
 * Accuracy = correct keystrokes / total keystrokes (0..1). Errors are extra
 * keystrokes that did not advance the cursor. Empty input is treated as 1.0.
 */
export function computeAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 1
  return correctKeystrokes / totalKeystrokes
}
