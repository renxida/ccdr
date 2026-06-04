// Visual QA driver: seed progression to a target tier, drive synthetic typing,
// and capture key states (desktop + mobile) for vision inspection.
// Usage: node scripts/qa.mjs <variant a|b|c> <level 0..3>
import { chromium } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'

const variant = process.argv[2] ?? 'b'
const level = Number(process.argv[3] ?? 0)
const base = 'http://localhost:4173/'

// All concept ids from the corpus → seed every concept at `level` so the next
// drill is at that tier (0 token, 1 phrase, 2 sentence, 3 paragraph).
const ids = []
for (const f of readdirSync('src/corpus').filter((f) => f.endsWith('.json') && !f.endsWith('.sources.json'))) {
  const c = JSON.parse(readFileSync(`src/corpus/${f}`, 'utf8'))
  for (const con of c.concepts) ids.push(con.id)
}
const concepts = Object.fromEntries(ids.map((id) => [id, { level, consecutivePasses: 0, attempts: 0 }]))
// Seed some char stats: a few mastered (fade hint), a few weak.
const stat = (acc, lat, n) => ({ char: 'x', samples: n, ewmaAccuracy: acc, ewmaLatencyMs: lat, lastSeen: 0 })
const charStats = {
  e: stat(1, 120, 12), t: stat(1, 130, 12), a: stat(1, 140, 12), o: stat(1, 150, 12),
  q: stat(0.6, 500, 6), z: stat(0.55, 520, 6),
}
const state = { version: 1, concepts, charStats }

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.addInitScript((s) => localStorage.setItem('ccdr.state.v1', JSON.stringify(s)), state)

const tag = `qa-${variant}-L${level}`
const drillText = () => page.locator('[data-testid=drill-text]').textContent()

async function shoot(name, w, h) {
  await page.setViewportSize({ width: w, height: h })
  await page.screenshot({ path: `screenshots/${name}.png` })
}

await page.goto(`${base}?variant=${variant}`, { waitUntil: 'networkidle' })
await shoot(`${tag}-idle`, 1280, 800)

// mid-drill: type ~60% of the current drill to show typed/cursor/upcoming + hint
const text = (await drillText()) ?? ''
await page.keyboard.type(text.slice(0, Math.ceil(text.length * 0.6)), { delay: 12 })
await shoot(`${tag}-mid`, 1280, 800)
await shoot(`${tag}-mid-mobile`, 390, 844)

console.log(JSON.stringify({ tag, drillLen: text.length, sample: text.slice(0, 70) }))
await browser.close()
