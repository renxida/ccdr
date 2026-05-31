// Screenshot each training-screen variant (desktop + mobile) for side-by-side review.
import { chromium } from '@playwright/test'

const base = process.argv[2] ?? 'http://localhost:4173/'
const browser = await chromium.launch()

for (const v of ['a', 'b', 'c']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } })
  const page = await ctx.newPage()
  await page.goto(`${base}?variant=${v}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  const drillText = () => page.locator('[data-testid="drill-text"]').textContent()
  // a few full drills to populate streak + last-outcome
  for (let i = 0; i < 3; i++) {
    const t = (await drillText()) ?? ''
    await page.keyboard.type(t, { delay: 22 })
    await page.waitForTimeout(45)
  }
  // partial of the next drill to show the live cursor
  const t = (await drillText()) ?? ''
  await page.keyboard.type(t.slice(0, Math.ceil(t.length / 2)), { delay: 22 })

  await page.screenshot({ path: `screenshots/variant-${v}.png` })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: `screenshots/variant-${v}-mobile.png` })
  await ctx.close()
  console.log(`shot variant ${v}`)
}
await browser.close()
