// Reusable screenshot harness for the visual self-QA loop.
// Usage: node scripts/shoot.mjs <url> <outfile> [width height]
import { chromium } from '@playwright/test'

const [, , url = 'http://localhost:4173/', out = 'screenshots/shot.png', w = '1280', h = '800'] =
  process.argv

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(250)
await page.screenshot({ path: out })
await browser.close()
console.log(`shot ${url} -> ${out} (${w}x${h})`)
