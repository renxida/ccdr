// Browser monkey-fuzzer: hammer the UI with erratic input and watch for console
// errors, thrown exceptions, NaN/garbage metrics, or stuck/empty DOM state.
// Usage: node scripts/fuzz.mjs [url] [iterations]
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://localhost:4173/'
const ITERS = Number(process.argv[3] ?? 1200)
const KEYS = 'abcdefghijklmnopqrstuvwxyz0123456789 .,/'.split('')
const GARBAGE = ['`', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '\\', '|', '<', '>']
const NONCHAR = ['Shift', 'Backspace', 'Enter', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']

const anomalies = []
const consoleErrors = []

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message))

let rngState = 0x1234abcd
const rnd = () => {
  rngState = (Math.imul(rngState ^ (rngState >>> 15), 0x2c9277b5) + 0x1) >>> 0
  return rngState / 4294967296
}
const pick = (a) => a[Math.floor(rnd() * a.length)]

await page.goto(`${url}?variant=b`, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })

async function readState() {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s)?.textContent ?? null
    const all = (s) => [...document.querySelectorAll(s)].map((e) => e.textContent)
    return {
      drill: q('[data-testid=drill-text]'),
      wpms: all('[data-testid=wpm]'),
      accs: all('[data-testid=accuracy]'),
      results: !!q('[data-testid=results]'),
    }
  })
}

async function checkInvariants(where) {
  const s = await readState()
  if (!s.results && (s.drill === null || s.drill === '')) anomalies.push(`${where}: empty drill text`)
  for (const w of s.wpms) {
    const n = Number(w)
    if (!Number.isFinite(n) || n < 0) anomalies.push(`${where}: bad wpm "${w}"`)
  }
  for (const a of s.accs) {
    if (a !== null && !/^\d+%$/.test(a)) anomalies.push(`${where}: bad accuracy "${a}"`)
    const n = a === null ? 0 : Number(a.replace('%', ''))
    if (n < 0 || n > 100) anomalies.push(`${where}: accuracy out of range "${a}"`)
  }
}

const variants = ['a', 'b', 'c']
let summaryOpen = false
for (let i = 0; i < ITERS; i++) {
  const r = rnd()
  try {
    if (r < 0.55) {
      // type the correct next char (advance drills)
      const drill = await page.locator('[data-testid=drill-text]').textContent()
      const idx = await page.evaluate(() => {
        const spans = [...document.querySelectorAll('[data-testid=drill-text] span')]
        return spans.findIndex((s) => /bg-accent|bg-error/.test(s.className))
      })
      const ch = drill && idx >= 0 ? drill[idx] : pick(KEYS)
      await page.keyboard.type(ch ?? 'a', { delay: rnd() < 0.3 ? 0 : Math.floor(rnd() * 40) })
    } else if (r < 0.75) {
      await page.keyboard.press(pick(KEYS) === ' ' ? 'Space' : pick(KEYS).toUpperCase()) // random correct-ish/wrong letter
    } else if (r < 0.86) {
      await page.keyboard.type(pick(GARBAGE)) // garbage char (wrong)
    } else if (r < 0.93) {
      await page.keyboard.press(pick(NONCHAR)) // non-char key
    } else if (r < 0.965) {
      await page.keyboard.press('Escape') // open summary
      summaryOpen = true
    } else if (r < 0.985) {
      // click reset progress if visible
      const btn = page.locator('button', { hasText: 'reset progress' })
      if (await btn.count()) await btn.first().click({ timeout: 500 }).catch(() => {})
    } else {
      // switch variant (reload) — keeps localStorage
      await page.goto(`${url}?variant=${pick(variants)}`, { waitUntil: 'domcontentloaded' })
      summaryOpen = false
    }
  } catch (e) {
    anomalies.push(`iter ${i}: action threw ${e.message}`)
  }
  if (i % 50 === 0) await checkInvariants(`iter ${i}`)
}

await checkInvariants('final')
// ensure still interactive: type a full drill and confirm it advances
const before = await page.locator('[data-testid=drill-text]').textContent()
if (before) {
  await page.keyboard.type(before, { delay: 5 })
  await page.waitForTimeout(80)
}

console.log(JSON.stringify({
  iterations: ITERS,
  consoleErrors: consoleErrors.slice(0, 20),
  consoleErrorCount: consoleErrors.length,
  anomalies: anomalies.slice(0, 30),
  anomalyCount: anomalies.length,
}, null, 2))
await browser.close()
process.exit(anomalies.length || consoleErrors.length ? 1 : 0)
