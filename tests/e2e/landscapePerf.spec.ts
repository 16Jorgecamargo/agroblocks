import { expect, test, type Page } from '@playwright/test'
import { missionSave, seedStorage } from './helpers'

const BASELINE = { map: 310, farm: 390 }

async function drawCalls(page: Page): Promise<number> {
  const canvas = page.locator('canvas[data-draw-calls]')
  await expect(canvas).toHaveCount(1, { timeout: 30_000 })
  await page.waitForTimeout(1500)
  return Number(await canvas.getAttribute('data-draw-calls'))
}

test('the Horta map and mission stay under the draw-call ceiling', async ({ page }) => {
  await seedStorage(page, { settings: { lowGraphics: false }, save: missionSave('garden-01') })
  await page.goto('/#/missoes')
  const map = await drawCalls(page)
  await page.goto('/#/jogar/garden-01')
  await page.getByRole('button', { name: 'Começar' }).click()
  const farm = await drawCalls(page)
  console.log(`draw calls map=${map} farm=${farm}`)
  expect(map).toBeLessThanOrEqual(BASELINE.map)
  expect(farm).toBeLessThanOrEqual(BASELINE.farm)
})
