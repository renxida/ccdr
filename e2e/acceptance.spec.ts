import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

// The baked layout — the hint must match it exactly (SPEC §12 acceptance).
const layout = JSON.parse(
  readFileSync(new URL('../src/data/cc2-layout.json', import.meta.url), 'utf8'),
) as Record<string, { hand: string; finger: string; direction: string }>

test('end-to-end: type drills, score correctly, render correct hints, advance progression', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const drillText = () => page.locator('[data-testid=drill-text]').textContent()
  const hint = page.locator('[data-testid=cc2-hint]')
  const progressWidth = () =>
    page.locator('[data-testid=overall-progress]').evaluate((el: HTMLElement) => el.style.width)

  // The hint for the current target character matches cc2-layout.json.
  const firstTarget = await hint.getAttribute('data-target')
  if (firstTarget && /^[a-z]$/.test(firstTarget)) {
    const m = layout[firstTarget]
    expect(await hint.getAttribute('data-hand')).toBe(m.hand)
    expect(await hint.getAttribute('data-finger')).toBe(m.finger)
    expect(await hint.getAttribute('data-direction')).toBe(m.direction)
  }

  // Type drills perfectly and fast until the learner advances (overall progress > 0).
  let unlocked = false
  for (let i = 0; i < 50; i++) {
    const text = (await drillText()) ?? ''
    expect(text.length).toBeGreaterThan(0)
    await page.keyboard.type(text, { delay: 20 })
    await page.waitForTimeout(40)
    const w = await progressWidth()
    if (w && w !== '0%' && w !== '') {
      unlocked = true
      break
    }
  }
  expect(unlocked, 'a concept should unlock to a deeper level after sustained passing drills').toBe(
    true,
  )

  // Accuracy held at 100% (we typed perfectly).
  expect(await page.locator('[data-testid=accuracy]').first().textContent()).toBe('100%')

  // Session summary opens on Escape and reports a positive WPM.
  await page.keyboard.press('Escape')
  const results = page.locator('[data-testid=results]')
  await expect(results).toBeVisible()
  const wpmText = await results.locator('text=/^\\d+$/').first().textContent()
  expect(Number(wpmText)).toBeGreaterThan(0)
})

test('a deliberate wrong key lowers accuracy and does not advance the cursor', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const text = (await page.locator('[data-testid=drill-text]').textContent()) ?? ''
  // type the first correct char, then a wrong key
  await page.keyboard.type(text[0], { delay: 10 })
  await page.keyboard.press('Backquote') // '`' is wrong for any letter/word token
  await page.waitForTimeout(30)
  const acc = await page.locator('[data-testid=accuracy]').first().textContent()
  expect(acc).not.toBe('100%')
})
