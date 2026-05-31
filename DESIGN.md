# DESIGN.md — ccdr visual pass/fail checklist

The spartan design contract. Every screenshot in the M5 self-QA loop is graded against
this. Synthesized from keybr's minimalism + DOT I/O's device-viz placement (see
`research/keybr-ux.md`, `research/visual-grounding.md`). **Spartan is the intent — do not
sand off character or add defensive chrome.**

## Non-negotiables (a screenshot FAILS if any are violated)

1. **Dark, distraction-free.** Near-black background (`--color-bg #0d0e11`). No nav chrome,
   no ads, no decorative imagery, no gamification (no points/badges/streaks/confetti).
2. **One center of gravity: the typing area.** A single elevated card holds 2–3 lines of
   the drill text, vertically centered, max-width ~760px. Everything else is subordinate.
3. **Monospace drill text, large + legible.** ~24px, line-height ~1.6, JetBrains Mono /
   ui-monospace. No layout jitter as characters are typed (fixed advance width).
4. **Three text states, unambiguous:**
   - upcoming (untyped): full-attention, brightest text
   - typed-correct: muted/dim
   - cursor target: emphasized (accent block/underline at exact position)
5. **Error = red, and only red.** Wrong key → target char gets red highlight, cursor does
   NOT advance. No yellow/orange. No sound. Clears the instant the correct key lands.
6. **The cursor is the only thing that animates during typing.** No letter transitions, no
   fades. Block/beam cursor, no distracting blink.
7. **Metrics never occlude the drill text.** WPM + accuracy live in a fixed compact zone
   above the card; eyes never leave the text while typing.
8. **CC2 hint diagram is subordinate**, placed below the typing card — ~half the visual
   weight. It informs; it must never demand attention or push the text off-screen.

## CC2 hint specifics (§4)

9. Renders the relevant CC2 half (or both) as a schematic: each switch = ring + center dot
   + 4 directional arms (N/S/E/W). Pinky switch drawn slightly wider (physical reality).
10. The switch + direction for the **next** target char is highlighted in the accent color;
    all others are quiet (dim outlines).
11. **Hint intensity fades with per-character mastery** (`MASTERY.hintMin/MaxIntensity`).
    A char you've mastered shows a barely-there hint; a new char shows a bright one.
12. Hint must match `src/data/cc2-layout.json` exactly — wrong switch/direction is a hard
    fail (correctness, not aesthetics).

## Layout & responsiveness

13. Single-column, vertically centered, generous padding (24–32px internal).
14. Works at desktop (≥1024px) and mobile (~390px) viewports without overflow or the hint
    diagram colliding with the text card.
15. Results/summary is a calm overlay on session end: final WPM, accuracy, problem chars,
    a single "Next" affordance. Low-drama, just the data.

## Tier/progress affordances (§3)

16. Current (tier, depth) is legible but quiet — a small indicator, not a dashboard.
17. Tier-up / depth-unlock is a brief, calm acknowledgement — not a celebration screen.

## What "spartan" does NOT mean

- Not barren: legibility, spacing, and a single accent color are features, not clutter.
- Not unbranded: a quiet wordmark (`ccdr`) is fine. One personality beat is allowed.
- Reviewers (design-review subagent) flag only correctness/requirement gaps here — they do
  **not** add enterprise-y defensiveness or strip the character out.
