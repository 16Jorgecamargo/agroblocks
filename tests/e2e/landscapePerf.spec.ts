import { expect, test, type Page } from '@playwright/test'
import { MISSIONS } from '@/data/missions'
import { WORLDS } from '@/data/worlds'
import { storeAssessment } from '@/game/progress/progression'
import { missionSave, seedStorage } from './helpers'

const BASELINE = { map: 310, farm: 390 }

const refs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))

async function drawCalls(page: Page): Promise<number> {
  const canvas = page.locator('canvas[data-draw-calls]')
  await expect(canvas).toHaveCount(1, { timeout: 30_000 })
  await page.waitForTimeout(1500)
  return Number(await canvas.getAttribute('data-draw-calls'))
}

for (const world of WORLDS) {
  test(`the ${world.name} map and first mission stay under the draw-call ceiling`, async ({ page }) => {
    const earlier = WORLDS.filter((item) => item.order < world.order)
    const done = MISSIONS.filter((mission) => earlier.some((item) => item.id === mission.world)).map((mission) => mission.id)
    const first = MISSIONS.find((mission) => mission.world === world.id && mission.slot === 1)!
    let save = missionSave(first.id, done)
    for (const item of earlier) for (const form of ['pre', 'post'] as const) save = storeAssessment(save, { world: item.id, form, startedAt: 's', completedAt: 'c', skipped: false, answers: {} }, refs)
    await seedStorage(page, { settings: { lowGraphics: false }, save })
    await page.goto('/#/missoes')
    await expect(page.getByText(`Mundo ${world.order}: ${world.name}`)).toBeVisible()
    const map = await drawCalls(page)
    await page.goto(`/#/jogar/${first.id}`)
    await page.getByRole('button', { name: 'Começar' }).click()
    const farm = await drawCalls(page)
    console.log(`${world.id} draw calls map=${map} farm=${farm}`)
    expect(map).toBeLessThanOrEqual(BASELINE.map)
    expect(farm).toBeLessThanOrEqual(BASELINE.farm)
  })
}
