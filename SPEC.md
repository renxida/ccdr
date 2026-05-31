# SPEC.md — `ccdr.dev` CharaChorder 2 Typing Trainer

> Hand this file to a fresh Claude Code session. It is the complete brief. Read it
> top to bottom, then follow **§13 Operating Instructions** to start.

---

## 1. One-line goal

A spartan, keybr-style adaptive typing trainer for the **CharaChorder 2 (CC2)** that
teaches the device's character-entry layout *and* real accelerator/distributed-systems
knowledge at the same time, deployed at **ccdr.dev**.

The owner uses a CC2 in character-entry mode (not chording). To the browser the device
is an ordinary HID keyboard emitting letters, so the app captures standard keyboard
events — no WebSerial, no device connection.

## 2. What makes this different from keybr

Two things, and only two:

1. **Real corpus, not pseudo-words.** Never generate fake words or fake prose. Every
   drill is true technical content the owner wants to internalize: Trainium org
   hierarchy, TPU hierarchy and pod topology, NVIDIA GPU hierarchy and inter-generational
   deltas, hardware specs, and roofline / latency / throughput math. Typing practice and
   domain learning are braided together.
2. **First-class CC2 hints.** A live on-screen render of the CC2 highlights the exact
   switch + direction for the next character, sourced from the real device layout.

Everything else stays keybr-minimal: clean, fast, distraction-free, keyboard-driven.

## 3. The two-axis progression model (core design — get this exactly right)

Difficulty advances on **two independent axes**, both gated by sustained speed + accuracy.

**Axis A — typing complexity (4 tiers):**

- **T0 — word repetition:** a single concept token repeated, e.g. `trainium trainium trainium …`, `tpu tpu tpu …`. Builds switch-location muscle memory.
- **T1 — short phrase:** e.g. `trainium2 collective`, `hbm bandwidth`.
- **T2 — sentence:** one true claim, e.g. `A TPU v5p pod connects 8960 chips over a 3D torus.`
- **T3 — paragraph:** a few connected true claims about one concept.

**Axis B — knowledge depth (per concept):** each concept (e.g. `trainium`) carries an
ordered chain of true statements of increasing depth — placement in the hierarchy →
key specs → comparisons / inter-gen deltas → roofline / perf math. Mastering a concept
at the current complexity tier **unlocks the next depth statement and/or the next tier.**

**Unlock rule (tunable, defaults in `src/config/progression.ts`):** advance when the
learner sustains **≥ targetWPM** and **≥ targetAccuracy** across **N consecutive drills**
at the current (tier, depth). Defaults: `targetWPM` ramps per tier (e.g. 25/30/35/40),
`targetAccuracy = 0.95`, `N = 3`. These are config, not magic numbers — surface them.

The selection engine is weakness-weighted (keybr-style): bias upcoming drills toward the
characters/switches with the worst recent accuracy and latency.

## 4. CC2 hint system (first-class feature)

- Render both CC2 halves: 9 five-way switches per half (pinky, ring, middle, index, +3
  thumb), each actuatable N/S/E/W/down. Highlight the switch and direction for the
  **next** target character.
- Hint **intensity fades with proficiency**: bright/explicit early, subtle once the
  learner is fast and accurate on that character (track per-character mastery).
- Character → switch/direction mapping comes from the baked layout (see §5). **v1 is the
  A1 base layer only** — all 26 letters live there; ignore A2/A3/Shift layers and numbers
  for now.

## 5. Layout extraction (do this first, it unblocks the hints)

No physical device. Extract the canonical **CC English** layout for the CC2 from GitHub:

- Clone / inspect **`CharaChorder/DeviceManager`** — the TypeScript web app behind
  `charachorder.io`. The serial + layout reference lives around
  `src/lib/serial/device.ts` and the layout/keymap definitions. This is the source of
  truth for the default switch→character map.
- Cross-check against the **Firmware Meta API**:
  `https://charachorder.io/firmware/{device}/{version}/meta.json` (device list at
  `https://charachorder.io/firmware/`).
- `CharaChorder/CCOS-firmware` is mostly an issue/build repo + Serial API pointers; use it
  only for corroboration.

**Output:** `src/data/cc2-layout.json` mapping each A1 character to
`{ hand, finger, direction, label }`. Hand-verify a few high-frequency letters against the
docs layout graphic before trusting it.

**Also gather visual grounding for yourself** into `/research/` (not shipped). See
`research/visual-grounding.md` and `research/keybr-ux.md`.

## 6. Corpus pipeline (build-time, web-grounded, fact-checked)

Runtime stays 100% static — **no LLM calls at runtime.** Content is generated at build time.

- **In-session generation:** generate the seed corpus yourself, web-grounded. Write to
  `src/corpus/{topic}.json`. For every numeric claim, store a `source` URL in a sidecar
  `src/corpus/{topic}.sources.json`.
- **Reusable expansion:** scaffold `scripts/gen-corpus.ts` that calls the Anthropic API
  (reads `ANTHROPIC_API_KEY` from env) so the owner can later run
  `npm run gen-corpus -- --topic "tpu pod topology"`.
- **Accuracy is paramount.** After generation, run the **factual-review subagent** (§7)
  over the corpus. It flags *only factual / numeric errors against cited sources*.

**Seed topics:** Trainium org hierarchy; TPU hierarchy & pod topology; NVIDIA GPU
hierarchy + inter-generational deltas; roofline / latency / throughput modeling math.

**Corpus JSON schema:** see `src/corpus/` — `{ topic, concepts: [{ id, token, depth: [{ tier, text, source? }] }] }`.

## 7. The autonomous dev + polish loop

- **Permission posture:** `acceptEdits`; allowlist dev/test/build/deploy bash; gate
  destructive ops (rm, force-push, DNS deletes).
- **Functional checks (hard gate):** Vitest units for WPM, accuracy, weakness-weighted
  selection, and the §3 unlock state machine. Playwright e2e for full flows.
- **Visual self-QA loop (Playwright CLI, screenshots to disk):** run dev server → drive via
  synthetic keypress events at varied speeds/error rates → screenshot key states (idle,
  mid-drill, hint, tier-up, results, mobile+desktop) → inspect each with vision vs
  `DESIGN.md` → iterate, capped.
- **Two subagents:** design-review (loose — correctness/requirement gaps only, preserve
  spartan character) and factual-review (strict — corpus numbers vs sources, zero tolerance).
- **Variant strategy:** 2–3 distinct spartan directions for the main training screen,
  screenshot each, present side-by-side for the owner to pick.

## 8. Human-in-the-loop

- **Claude owns:** correctness, engine, corpus (fact-checked), hint viz, visual polish.
- **Owner owns:** embodied "feel" — does typing on the CC2 feel good? rhythm, hint timing,
  difficulty ramp under the fingers.
- **Checkpoint cadence:** each milestone → deploy preview + short `PLAYTEST.md` (what
  changed, screenshots, what to feel for).

## 9. Tech stack & hosting

- **Vite + React + TypeScript + Tailwind.** Vitest + Playwright. Static SPA, progress in
  `localStorage`. **Deploy to `ccdr.dev`** — GitHub Pages, DNS via Porkbun (apex + www).
  Confirm HTTPS before declaring done.

## 10. Out of scope (v1)

Chording; WebSerial/live device; runtime LLM/backend/accounts/multiplayer/leaderboards;
A2/A3/Shift layers, numbers, symbols in the hint system.

## 11. Repo layout

```
ccdr/
  SPEC.md  DESIGN.md  PLAYTEST.md
  src/{data/cc2-layout.json, corpus/*.json+*.sources.json, config/progression.ts,
       engine/, components/}
  scripts/gen-corpus.ts   research/ (not shipped)   tests/ (vitest)   e2e/ (playwright)
```

## 12. Milestones & END-TO-END VERIFICATION

- **M0** — Scaffold; extract `cc2-layout.json`; pull research images.
- **M1** — Core engine: capture, WPM, accuracy, weakness-weighted selection (unit-tested).
- **M2** — Corpus pipeline + seed corpus, factual-review to zero errors.
- **M3** — CC2 hint visualization with proficiency-based fade.
- **M4** — Two-axis progression state machine wired to UI.
- **M5** — Autonomous visual polish loop + 2–3 variants.
- **M6** — Deploy to ccdr.dev via Porkbun DNS; verify HTTPS.

**End-to-end acceptance:** Playwright run that types `trainium` repeatedly at target speed
→ T0 unlock → advances to phrase/sentence → renders correct CC2 switch+direction hint per
char vs `cc2-layout.json` → correct WPM/accuracy → advances knowledge depth. Plus: all
unit + e2e green; factual-review zero spec errors on seed corpus; `https://ccdr.dev` serves.

## 13. Operating instructions

1. Read this whole file + the layout-extraction plan (§5).
2. `acceptEdits` + bash allowlist (§7).
3. Work milestone by milestone (§12). After each: run checks, update `PLAYTEST.md`, deploy preview.
4. Use the screenshot self-QA loop (§7) continuously.
5. Stop and surface only for: embodied "feel", variant selection, or exceeding iteration caps.
