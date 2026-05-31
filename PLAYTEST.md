# PLAYTEST.md — M1–M4 (first playable build)

Regenerated each milestone (SPEC §8). Short + actionable.

## What changed since M0
- **Engine (M1):** key capture, WPM, accuracy, EWMA per-char stats, weakness-weighted
  drill selection. 57 unit tests green.
- **Corpus (M2):** 4 seed topics (Trainium, TPU, NVIDIA GPU, roofline math), 24 concepts,
  ~95 cited numeric claims. **Fact-checked to zero errors** by a strict per-topic review
  pass (8 corrections applied + re-verified; ledgers in `src/corpus/*.sources.json`,
  reports in `research/factcheck-*.md`). All drill text normalized to typeable ASCII.
- **CC2 hint (M3):** both halves rendered as a keymap schematic; the next char's
  switch+direction lights up in accent; brightness fades as you master that char.
- **Progression (M4):** two-axis state machine (tier T0–T3 × knowledge depth), unlock after
  3 consecutive passes at ≥ target WPM (25/30/35/40 by tier) and ≥ 95% accuracy. Live
  metrics, tier-up banner, Esc → session summary, `localStorage` persistence.

## How to play it right now
```
cd ~/ccdr && npm run dev    # then open the printed localhost URL
```
Type the shown text; it auto-advances. Esc = session summary. "reset progress" clears state.
(A live ccdr.dev URL is blocked on deploy credentials — see the handoff notes.)

## What to FEEL for this round (your call, not mine)
1. **Hint timing/usefulness:** when a new char appears, does the lit switch+direction help
   you find it on the CC2 — or is it noise? Does the fade-out happen too early/late?
2. **Difficulty ramp under the fingers:** do the per-tier WPM gates (25→30→35→40) feel
   right, or too easy/hard? Is "3 consecutive passes" the right unlock feel?
3. **Rhythm:** does auto-advancing to the next drill feel good, or do you want a beat to
   breathe / see the last result before the next starts?
4. **Digit/symbol drills:** tokens like `h200`, `trn2`, and sentences with numbers — the
   hint can't show digits (A1 letters only). Does that break the flow?

## Known, intentional
- Live WPM resets each drill (per-drill metric); session WPM is in the Esc summary.
- Thumb-switch near/mid/far numbering still wants a hardware confirm (see M0 notes).

## Next
- **M5:** 2–3 distinct spartan layouts of the training screen for you to pick (coming).
- **M6:** deploy to ccdr.dev (needs Porkbun + GitHub Pages access — see handoff).
