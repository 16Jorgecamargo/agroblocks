import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { getMission } from '@/data/missions'
import { openMission, saveWithProgram, seedStorage } from './helpers'

const generated = JSON.parse(readFileSync('src/render/models/manifest.generated.json', 'utf8')) as { models: unknown[] }
const firstHarvest = getMission('garden-04')
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
  await seedStorage(page, { settings: { motion: 'full' } })
  await openMission(page, 'garden-04')
  await expect(page.locator('.farm-view canvas')).toBeVisible()
  await page.waitForTimeout(2500)
  expect(errors).toEqual([])
  expect(external).toEqual([])
  expect(models.length > 0).toBe(generated.models.length > 0)
})

test('reduced motion starts screens without transform animations and without confetti', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'reduced' }, save: saveWithProgram('garden-04', firstHarvest.referenceSolution) })
  await page.goto('/')
  const transform = await page.locator('.home__tagline').evaluate((element) => getComputedStyle(element).transform)
  expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true)
  await openMission(page, 'garden-04')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/garden-04$/)
  await expect(page.locator('.confetti__piece')).toHaveCount(0)
})

test('the running block glows and the harvest flies to the counter in full motion', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'full', defaultSpeed: 0.5 }, save: saveWithProgram('garden-04', firstHarvest.referenceSolution) })
  await openMission(page, 'garden-04')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect
    .poll(async () => page.locator('.blocklyBlockCanvas .blocklyPath').evaluateAll((paths) => paths.some((path) => (path as SVGElement).style.filter.includes('drop-shadow'))))
    .toBe(true)
  await expect
    .poll(async () =>
      page.locator('.blocklyBlockCanvas .agro-running-block > .blocklyPath').evaluateAll((paths) =>
        paths.some((path) => getComputedStyle(path).strokeDasharray !== 'none' && (path as SVGElement).style.strokeDashoffset !== ''),
      ),
    )
    .toBe(true)
  await expect(page.locator('.harvest-flight')).toHaveCount(1, { timeout: 20_000 })
  await expect(page.getByRole('group', { name: 'Colheita: 1' })).toBeVisible({ timeout: 20_000 })
})
test('the mission map and the home screen render their 3D worlds without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { motion: 'full' } })
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
  await seedStorage(page, { settings: { motion: 'full' } })
  await openMission(page, 'garden-04')
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
  await seedStorage(page, { settings: { motion: 'full' }, save: saveWithProgram('garden-04', firstHarvest.referenceSolution, ['garden-04']) })
  await page.goto('/#/resultado/garden-04')
  await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible()
  await expect(page.locator('.results__scene canvas')).toBeVisible()
  await expect(page.locator('.results__scene .scene-splash')).toHaveCount(0, { timeout: 30_000 })
  expect(errors).toEqual([])
})

test('screens fill the window without page scroll or overscroll bounce', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'reduced' } })
  for (const route of ['/', '/#/missoes', '/#/jogar/garden-04']) {
    await page.goto(route)
    await page.mouse.move(700, 450)
    await page.mouse.wheel(0, 800)
    await page.waitForTimeout(300)
    const state = await page.evaluate(() => ({
      scrollY: window.scrollY,
      fits: document.documentElement.scrollHeight <= window.innerHeight,
      overscroll: [getComputedStyle(document.documentElement).overscrollBehaviorY, getComputedStyle(document.body).overscrollBehaviorY],
    }))
    expect(state).toEqual({ scrollY: 0, fits: true, overscroll: ['none', 'none'] })
  }
})

test('farm view tool buttons animate, and the rotate arrows spin with the camera', async ({ page }) => {
  await seedStorage(page, { settings: { motion: 'full' } })
  await openMission(page, 'garden-04')
  const right = page.getByRole('button', { name: 'Girar câmera para a direita' })
  await right.click()
  await expect(right.locator('[data-turns]')).toHaveAttribute('data-turns', '1')
  await expect.poll(() => right.locator('[data-turns]').evaluate((element) => getComputedStyle(element).transform)).not.toBe('none')
  const left = page.getByRole('button', { name: 'Girar câmera para a esquerda' })
  await left.click()
  await left.click()
  await expect(left.locator('[data-turns]')).toHaveAttribute('data-turns', '-1')
  for (const name of ['Aproximar câmera', 'Afastar câmera', 'Legenda']) {
    await expect(page.getByRole('button', { name }).first()).toHaveAttribute('data-pressable', 'true')
  }
})
