# PLAYTEST.md — M5 (variants live)

## ▶ Play it now (live, on your CC2)
**https://renresear.ch/ccdr/** — deployed via GitHub Pages, HTTPS verified.
(Interim URL on your account's Pages domain; ccdr.dev is one DNS step away — see below.)

Compare the three training-screen directions live:
- **A — Stack** (balanced, keybr-like): https://renresear.ch/ccdr/?variant=a
- **B — Focus** (text is the hero, single active-hand hint): https://renresear.ch/ccdr/?variant=b
- **C — Split** (cockpit: text left, full hint always on the right): https://renresear.ch/ccdr/?variant=c

Screenshots of each are in `screenshots/variant-{a,b,c}.png` (+ `-mobile`).

## The three variants, in one line each
- **A Stack** — metrics row on top, drill card centered, both-hands hint below. Calm, familiar.
- **B Focus** — big centered text, metrics shrink to a faint top-right readout, hint is just
  the hand you need, larger. Most spartan; fewest things competing with the text.
- **C Split** — drill text + streak on the left, the full CC2 both-hands diagram pinned on
  the right so the device stays in your peripheral vision. Best for *learning* the layout.

## What to FEEL for (your call)
1. **Which variant** do your eyes + hands prefer for a real session? (I'll make it the default.)
2. **Hint usefulness/timing** — does the lit switch+direction actually help you find keys on
   the CC2, and does the fade-out (as you master a char) happen at the right time?
3. **Ramp under the fingers** — do the per-tier WPM gates (25→30→35→40) + "3 passes to
   unlock" feel right?
4. **Rhythm** — auto-advance between drills: good, or do you want a beat to see the result?

## ccdr.dev — one step left (needs your go-ahead; DNS is gated)
The build is live; pointing **ccdr.dev** at it needs Porkbun DNS records, which I won't
change without your sign-off. Two options (see the chat question):
- I add them via the Porkbun API (point me to the key), **or** you add them and I'll verify.
- Records: apex `A` → `185.199.108.153 / .109.153 / .110.153 / .111.153`; `www` `CNAME` →
  `renxida.github.io`. Then I re-add the `ccdr.dev` CNAME file and GitHub provisions HTTPS.

## Status
M0–M5 done (engine, fact-checked corpus, hint+fade, two-axis progression, 3 variants).
57 unit tests green; full flow verified via synthetic keypresses; live build serves over HTTPS.
M6 (ccdr.dev) pending the DNS go-ahead above.
