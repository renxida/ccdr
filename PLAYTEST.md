# PLAYTEST.md — M0 (scaffold)

Regenerated each milestone (SPEC §8). Short + actionable: what changed, what to feel for.

## M0 — what changed
- Project scaffolded: Vite + React 19 + TS + Tailwind v4, Vitest + Playwright wired.
- `src/data/cc2-layout.json` extracted — all 26 A1 letters → {hand, finger, direction}.
  Derived from the Firmware Meta API (`two_s3` factory layout) + DeviceManager keymaps.
- Research grounding in `research/` (CC2 imagery + keybr UX notes); `DESIGN.md` checklist.
- Deploy scaffold ready (GitHub Pages workflow + CNAME → ccdr.dev), wired at M6.

## Nothing to feel yet
No playable typing until **M1** (engine) / **M4** (progression wired to UI). First playable
preview ships at the M1 checkpoint.

## One thing to confirm on hardware (when convenient)
The (hand, finger, direction) mapping is high-confidence and matches the documented CC
English layout for the 7 highest-frequency letters (e t a o i n s). The only soft spot is
**which physical thumb switch is "near/mid/far"** (thumbIndex 0/1/2) — inferred from layout
geometry, not a photo. If the thumb hints ever point at the wrong thumb switch, that's the
knob to flip; the direction (N/S/E/W) will still be right.
