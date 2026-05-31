// Drive the trainer with synthetic keypresses and capture key states to disk.
// Usage: node scripts/play.mjs [url]
import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://localhost:4173/'
const SHOTS = 'screenshots'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })
await page.goto(url, { waitUntil: 'networkidle' })

const drillText = () => page.locator('[data-testid="drill-text"]').textContent()
const progressWidth = () =>
  page.locator('[data-testid="overall-progress"]').evaluate((el) => el.style.width)
const readNum = (id) => page.locator(`[data-testid="${id}"]`).first().textContent()

// idle
await page.screenshot({ path: `${SHOTS}/m4-idle.png` })

// mid-drill: type half of the first drill
let text = await drillText()
const half = Math.max(1, Math.floor(text.length / 2))
await page.keyboard.type(text.slice(0, half), { delay: 35 })
await page.screenshot({ path: `${SHOTS}/m4-mid.png` })

// error state: type a deliberate wrong key, capture, then correct
await page.keyboard.press('Backquote') // '`' — wrong for any letter target
await page.waitForTimeout(30)
await page.screenshot({ path: `${SHOTS}/m4-error.png` })
// finish this drill correctly
await page.keyboard.type(text.slice(half), { delay: 35 })
await page.waitForTimeout(60)

// drill many times; type whatever is shown; watch for an unlock + progress
let unlockShot = false
let drills = 0
for (let i = 0; i < 60; i++) {
  text = (await drillText()) ?? ''
  if (!text) break
  await page.keyboard.type(text, { delay: 28 })
  drills++
  await page.waitForTimeout(50)
  if (!unlockShot && (await page.locator('[data-testid="unlock-banner"]').count()) > 0) {
    await page.screenshot({ path: `${SHOTS}/m4-unlock.png` })
    unlockShot = true
  }
  const w = await progressWidth()
  if (w && w !== '0%' && i > 8) break
}

await page.screenshot({ path: `${SHOTS}/m4-progress.png` })
const finalProgress = await progressWidth()
const wpm = await readNum('wpm')
const acc = await readNum('accuracy')

// results overlay
await page.keyboard.press('Escape')
await page.waitForTimeout(120)
await page.screenshot({ path: `${SHOTS}/m4-results.png` })

console.log(JSON.stringify({ drills, finalProgress, wpm, acc, unlockShot }, null, 2))
await browser.close()
