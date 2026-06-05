# ccdr

A spartan, keybr-style adaptive typing trainer for the **CharaChorder 2** that teaches the
device's character-entry layout *and* real accelerator / distributed-systems knowledge at the
same time. Every drill is true, source-cited technical content — never pseudo-words.

**Live:** https://renresear.ch/ccdr/ &nbsp;·&nbsp; **Spec:** [`SPEC.md`](./SPEC.md) &nbsp;·&nbsp; **Design checklist:** [`DESIGN.md`](./DESIGN.md)

## What it does
- **Real corpus.** Trainium / TPU / NVIDIA GPU hierarchies + roofline/perf math, fact-checked
  to zero errors against cited sources (`src/corpus/*.json` + `*.sources.json`).
- **First-class CC2 hint.** A live render of the device highlights the exact switch + direction
  for the next character (from the real layout in `src/data/cc2-layout.json`), fading as you
  master each key.
- **Two-axis progression.** Difficulty advances on typing complexity (word → phrase → sentence
  → paragraph) and knowledge depth, gated by sustained WPM + accuracy. Weakness-weighted
  drill selection, keybr-style. All tunables in `src/config/progression.ts`.
- **Three layouts** (`?variant=a|b|c`): Stack, Focus (default), Split.

## Develop
```bash
npm install
npm run dev        # local dev server
npm test           # vitest unit + property/fuzz tests
npm run e2e        # playwright end-to-end
npm run build      # type-check + production build
```

## Add a corpus topic
```bash
ANTHROPIC_API_KEY=... npm run gen-corpus -- --topic "tpu pod topology"
node scripts/normalize-corpus.mjs   # ASCII-normalize drill text
# then run the factual-review pass before shipping
```

## Stack
Vite · React · TypeScript · Tailwind v4 · Vitest · Playwright. Static SPA, progress in
`localStorage`, deployed via GitHub Pages.
