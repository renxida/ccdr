# keybr.com UX Reference

**Note:** keybr.com is a single-page React app that renders no meaningful static HTML — the WebFetch
tool returned only the word "Practice". The following is reconstructed from strong firsthand
knowledge of the keybr interface (as of ~2024–2025). Also informed by the DOT I/O screenshot
(`DOTIO.png`) which implements a similar spartan-trainer aesthetic and was directly observed.

---

## Overall Visual Philosophy

**Radical minimalism.** keybr puts exactly three things on screen at once: the typing target,
the text input, and a performance widget. Everything else is either hidden in a sidebar/menu
or absent entirely. The philosophy: eliminate anything that competes with the rhythm of typing.

- No navigation chrome visible during practice
- No distracting animations unrelated to typing feedback
- White or very light background (light mode default), dark mode available
- Font choice is a deliberate signal: monospace or near-monospace for the practice text,
  proportional sans-serif for UI chrome
- Padding/breathing room: generous. The typing area feels centered and uncrowded.

---

## Color Palette

**Light mode (default):**
- Background: white `#ffffff` or very near-white `#f5f5f5`
- Typed text (correct): medium gray `#888` or slightly muted — fades behind the cursor
- Untyped text (upcoming): dark near-black `#333` or `#1a1a1a` — full attention weight
- Cursor: solid block, accent color (keybr uses a blue-ish accent, roughly `#0080ff` or the
  brand's teal; the cursor is unmissable)
- Error character: red background highlight `#ff4444` or red text; very high contrast
- Accuracy metric good: green `#44bb44`; bad: red
- Key heatmap: gradient from gray/white (cold, not practiced) to orange/red (hot, practiced)
  with a blue tint for fast keys — classic heat spectrum

**Dark mode:**
- Background: `#1e1e2e` or similar deep neutral
- Text: `#cdd6f4` or off-white
- Cursor: same accent color, very visible

---

## Typing Area Layout

The center piece. Roughly:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  the quick brown fox jumps over the lazy dog and           │
│  then some more words to fill the line for practice        │
│  ▌                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **2–3 lines** of text visible at once (roughly 50–70 chars per line)
- Text wraps naturally; when the user types past the first line, the view shifts (scroll or
  advance to next set)
- **Cursor:** solid I-beam or block at the current character position. Does NOT blink distractingly.
- **Typed characters:** text behind cursor either disappears (slides off) or becomes muted gray
- **The target character** (character at cursor position) is emphasized — it sits right at the
  cursor, usually with the cursor color as background
- Text uses a **larger-than-normal font** (~22–28px) — readability is paramount, not density

---

## Error Display

- When a wrong key is pressed: the character at the cursor position turns **red** (or gets a red
  background highlight). The cursor does NOT advance.
- Some implementations show the typed wrong character in red superimposed over the target.
- No beep or harsh alert — just the visual red. Calm but clear.
- Errors accumulate in the accuracy counter but do not block progress indefinitely —
  keybr requires you to type the correct character to advance (no skipping errors).
- The red persists until you type the correct character, then clears and advances.

---

## Live Metrics Bar

A thin bar above or below the typing area showing:
- **WPM** (words per minute) — large, prominent, updates in real-time ~1/sec
- **Accuracy %** — next most prominent
- **Time elapsed** — smaller, secondary
- Layout: horizontal, left-aligned or centered, minimal. No graphs during active typing.
- The numbers update smoothly; there's no visual noise from the counter ticking.

---

## Per-Key Heatmap / Keyboard Visualization

Shown **below** the typing area or on a results screen:

- A full keyboard layout (QWERTY diagram) rendered as small key rectangles
- Each key is colored by performance: 
  - **Unlearned/not yet introduced:** light gray or dimmed
  - **Slow/frequent errors:** orange → red
  - **Fast/accurate:** light blue or green
  - **Not yet trained:** gray with no data
- The heatmap updates after each session or after each word
- In practice mode, the keyboard diagram is often semi-visible below the typing area —
  you can glance at it but it doesn't dominate

**CC2 adaptation note:** We replace the QWERTY keyboard diagram with the CC2 half-diagram.
The heatmap coloring logic maps directly: color each switch-direction by accuracy/speed.

---

## Adaptive Letter Introduction

This is keybr's killer feature and the most important thing to replicate in spirit:

- **Start with a tiny subset** of letters (e.g., just `e` and `t`)
- **Unlock new letters** only when current letters meet a speed/accuracy threshold
- Practice text is algorithmically generated to **weight the newest letter heavily**
  (maybe 40% of characters are the newest letter, rest are already-learned letters)
- Progress bar or indicator shows which letters are unlocked vs locked
- The generated words are often pseudo-words (not real English) to force individual-letter
  practice rather than word-shape muscle memory

For CC2: we adapt this to switch-directions. Start with the most common actuation directions
(center presses of high-frequency characters like `e`, `t`, `a`) and unlock new directions
as mastery is demonstrated.

---

## Results / Summary Screen

After a session ends (timer runs out or practice set completed):

- Appears as an overlay or transition replacing the typing area
- Shows: final WPM, accuracy %, characters typed, errors count
- Histogram or bar chart of WPM over time during the session
- Per-key breakdown table: which keys were slowest / most error-prone
- "Next" button to start a new session
- Clean, low-drama — no confetti, no score-padding. Just the data.
- A "problem keys" callout: "You struggled with: x, q, z" — directs next practice focus

---

## Layout Decisions (concrete + copyable)

1. **Single-column, vertically centered layout.** Max-width container (~800px), centered.
   Everything in a single vertical stack: metrics → typing area → keyboard viz.

2. **Typing area is a white box on white background** (or slightly elevated card). Rounded
   corners (~8px). Generous padding (24–32px). Very subtle shadow or border.

3. **Font for practice text:** Monospace, ~24px, line-height ~1.6. Roboto Mono, JetBrains Mono,
   or similar. The consistent character width prevents layout jitter as you type.

4. **The cursor is the only animation.** No transitions on letters, no fade effects while
   typing. The only thing that moves is the cursor advancing.

5. **Error state is red, nothing else.** No yellow, no orange warnings during typing.
   One signal = one meaning.

6. **Metrics never occlude the text.** They live above or below in a fixed zone.
   During typing, your eyes never need to leave the text area.

7. **Keyboard diagram is subordinate.** Roughly half the visual weight of the typing area.
   You consult it; it doesn't demand attention.

8. **No onboarding, no tooltips during practice.** Settings/help are behind a gear icon.
   Practice screen launches immediately.

9. **Session end is a hard stop with summary.** No partial-session peeking at stats mid-flow.
   (Or if shown, the in-session stats are minimal — just WPM and accuracy.)

10. **Progress is persistent but not gamified.** keybr shows your stats trend over sessions
    but has no points, badges, streaks, or leaderboards on the main screen. The learning
    curve itself is the feedback loop.

---

## DOT I/O Differences (from direct observation, DOTIO.png)

DOT I/O is the official CharaChorder trainer and does show a different aesthetic — darker,
more complex, with the 3D device model. Compared to keybr:
- Much darker background (~`#1a1a1a`)
- Typing text box is white with a large rounded rectangle — similar sizing to keybr
- The device visualization below is prominent and complex (3D renders)
- Stats are shown above the typing area in a row
- Mode tabs (Letters / Trigrams / Words / Test) are visible

For our trainer, we borrow keybr's minimalism and DOT I/O's device-viz placement (below text).
Dark background probably wins for a CC2 trainer since the device renders look better on dark.

---

## Design Decisions to Adopt (priority order)

1. Dark background, white text-entry box — center of gravity
2. 2–3 lines of practice text, large monospace font (~24px), high contrast
3. Solid block/beam cursor at exact current character; no blink
4. Red-only error highlight, clears immediately on correct keystroke
5. WPM + accuracy above the text area, compact single line
6. CC2 half-diagram below text area, acting as heatmap + hint combined
7. Unlock-based letter introduction (start narrow, widen as mastery builds)
8. Summary overlay on session end with per-key breakdown
9. Max-width container, generous internal padding, zero decorative chrome
10. No sounds, no gamification, no streaks — just the metrics
