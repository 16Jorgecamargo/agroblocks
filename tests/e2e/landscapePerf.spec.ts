import { expect, test, type Page } from '@playwright/test'
import { MISSIONS } from '@/data/missions'
import { storeAssessment } from '@/game/progress/progression'
import { missionSave, seedStorage } from './helpers'

const refs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))

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

test('the Milharal map and mission stay under the draw-call ceiling', async ({ page }) => {
  const garden = MISSIONS.filter((mission) => mission.world === 'garden').map((mission) => mission.id)
  let save = missionSave('cornfield-01', garden)
  for (const form of ['pre', 'post'] as const) save = storeAssessment(save, { world: 'garden', form, startedAt: 's', completedAt: 'c', skipped: false, answers: {} }, refs)
  await seedStorage(page, { settings: { lowGraphics: false }, save })
  await page.goto('/#/missoes')
  await expect(page.getByText('Mundo 2: Milharal')).toBeVisible()
  const map = await drawCalls(page)
  await page.goto('/#/jogar/cornfield-01')
  await page.getByRole('button', { name: 'Começar' }).click()
  const farm = await drawCalls(page)
  console.log(`cornfield draw calls map=${map} farm=${farm}`)
  expect(map).toBeLessThanOrEqual(BASELINE.map)
  expect(farm).toBeLessThanOrEqual(BASELINE.farm)
})
