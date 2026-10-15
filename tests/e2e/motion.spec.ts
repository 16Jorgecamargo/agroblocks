import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { getMission } from '@/data/missions'
import { openMission, saveWithProgram, seedStorage } from './helpers'

const generated = JSON.parse(readFileSync('src/render/models/manifest.generated.json', 'utf8')) as { models: unknown[] }
const firstHarvest = getMission('m1-first-harvest')
if (!firstHarvest) throw new Error('mission missing')

test('a game dialog closes, leaves the DOM and returns focus to its opener', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'full' } })
  await page.goto('/')
  const opener = page.getByRole('button', { name: 'Configurações' })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Configurações' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.game-dialog__header')).toBeVisible()
  await page.getByRole('button', { name: 'Fechar' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('the 3D farm loads only local assets, including any GLB models, without errors', async ({ page }) => {
  const errors: string[] = []
  const external: string[] = []
  const models: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/models/') && url.endsWith('.glb')) models.push(url)
    const local = url.startsWith('http://localhost:4173') || url.startsWith('data:') || url.startsWith('blob:')
    const font = url.startsWith('https://fonts.googleapis.com') || url.startsWith('https://fonts.gstatic.com')
    if (!local && !font) external.push(url)
  })
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await openMission(page, 'm1-first-harvest')
  await expect(page.locator('.farm-view canvas')).toBeVisible()
  await page.waitForTimeout(2500)
  expect(errors).toEqual([])
  expect(external).toEqual([])
  expect(models.length > 0).toBe(generated.models.length > 0)
})

test('reduced motion starts screens without transform animations and without confetti', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'reduced' }, save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await page.goto('/')
  const transform = await page.locator('.home__tagline').evaluate((element) => getComputedStyle(element).transform)
  expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true)
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await expect(page.locator('.confetti__piece')).toHaveCount(0)
})

test('the running block glows and the harvest flies to the counter in full motion', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'full', renderMode: '2d', defaultSpeed: 0.5 }, save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect
    .poll(async () => page.locator('.blocklyBlockCanvas .blocklyPath').evaluateAll((paths) => paths.some((path) => (path as SVGElement).style.filter.includes('drop-shadow'))))
    .toBe(true)
  await expect(page.locator('.harvest-flight')).toHaveCount(1, { timeout: 20_000 })
  await expect(page.getByRole('group', { name: 'Colheita: 1' })).toBeVisible({ timeout: 20_000 })
})
test('the mission map and the home screen render their 3D worlds without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await page.goto('/')
  await expect(page.locator('.home-scene canvas')).toBeVisible()
  await expect(page.locator('.home-scene .scene-splash')).toHaveCount(0, { timeout: 30_000 })
  await page.goto('/#/missoes')
  await expect(page.locator('.map-scene canvas')).toBeVisible()
  await expect(page.locator('.mission-select__map .scene-splash')).toHaveCount(0, { timeout: 30_000 })
  expect(errors).toEqual([])
})

test('the legend opens as a paged dialog with one 3D preview and closes', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Legenda' }).click()
  const dialog = page.getByRole('dialog', { name: 'Legenda' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Vazio' })).toBeVisible()
  await dialog.getByRole('tab', { name: 'Pronto para colher' }).click()
  await expect(dialog.getByRole('heading', { name: 'Pronto para colher' })).toBeVisible()
  await expect(dialog.locator('canvas')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(errors).toEqual([])
})

test('the success screen renders a full 3D celebration without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' }, save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution, ['m1-first-harvest']) })
  await page.goto('/#/resultado/m1-first-harvest')
  await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible()
  await expect(page.locator('.results__scene canvas')).toBeVisible()
  await expect(page.locator('.results__scene .scene-splash')).toHaveCount(0, { timeout: 30_000 })
  expect(errors).toEqual([])
})
