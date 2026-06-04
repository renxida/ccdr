// Edge fuzz: drive the trainer to the terminal "everything mastered" state and
// confirm progress caps at 100%, completed concepts still render (clamped to the
// last depth entry), and nothing breaks / no console errors.
import { chromium } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:4173/'

// Seed every concept one unlock away from complete.
const concepts = {}
for (const f of readdirSync('src/corpus').filter((f) => f.endsWith('.json') && !f.endsWith('.sources.json'))) {
  const c = JSON.parse(readFileSync(`src/corpus/${f}`, 'utf8'))
  for (const con of c.concepts) concepts[con.id] = { level: con.depth.length - 1, consecutivePasses: 0, attempts: 0 }
}
const state = { version: 1, concepts, charStats: {} }

const errors = []
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
await page.addInitScript((s) => localStorage.setItem('ccdr.state.v1', JSON.stringify(s)), state)
await page.goto(`${url}?variant=b`, { waitUntil: 'networkidle' })

const width = () => page.locator('[data-testid=overall-progress]').evaluate((e) => e.style.width)
const drill = () => page.locator('[data-testid=drill-text]').textContent()

const ITERS = Number(process.argv[3] ?? 120)
let maxWidth = '0%'
let rendered = 0
for (let i = 0; i < ITERS; i++) {
  const t = (await drill()) ?? ''
  if (t) rendered++
  await page.keyboard.type(t, { delay: 4 })
  await page.waitForTimeout(25)
  const w = await width()
  if (parseInt(w) >= parseInt(maxWidth)) maxWidth = w
}

// After completion, app must still render a drill (clamped) and stay interactive.
const stillRenders = !!(await drill())
const finalWidth = await width()
// type one more full drill to confirm no crash at the terminal state
const last = (await drill()) ?? ''
await page.keyboard.type(last, { delay: 4 })
await page.waitForTimeout(40)
const interactiveAfter = !!(await drill())

console.log(JSON.stringify({
  rendered, maxWidth, finalWidth, stillRenders, interactiveAfter,
  consoleErrors: errors.slice(0, 10), consoleErrorCount: errors.length,
}, null, 2))
await browser.close()
const ok = errors.length === 0 && stillRenders && interactiveAfter && parseInt(maxWidth) === 100
process.exit(ok ? 0 : 1)
