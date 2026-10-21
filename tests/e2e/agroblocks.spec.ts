import { expect, test } from '@playwright/test'
import { act, program } from '@/blocks/interpreter/programBuilder'
import { getMission } from '@/data/missions'
import { missionSave, openMission, registerStudent, saveWithProgram, seedStorage } from './helpers'

const firstHarvest = getMission('garden-04')
if (!firstHarvest) throw new Error('mission missing')

test('starts a new farm from the home screen at the guided training', async ({ page }) => {
  await seedStorage(page, {})
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuar missão/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Iniciar nova fazenda' }).click()
  await registerStudent(page)
  await expect(page).toHaveURL(/#\/jogar\/m0-training$/)
  await expect(page.getByRole('dialog', { name: 'Bem-vindo ao treinamento' })).toBeVisible()
  await page.getByRole('button', { name: 'Começar treinamento' }).click()
  await expect(page.getByTestId('tutorial-progress')).toHaveText('2/15')
})

test('explains an error and highlights the failing state', async ({ page }) => {
  const wrong = program([act('moveForward'), act('moveForward'), act('moveForward'), act('harvest')])
  await seedStorage(page, { save: saveWithProgram('garden-04', wrong) })
  await openMission(page, 'garden-04')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page.getByRole('log')).toContainText('Não há planta para colher neste canteiro.')
  await expect(page.getByRole('log')).toContainText('O robô colheu no lugar errado')
  await expect(page.locator('.blocklyBlockCanvas .agro-error-block')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Executar' })).toBeVisible()
})

test('step mode executes one instruction per click', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('garden-04', firstHarvest.referenceSolution) })
  await openMission(page, 'garden-04')
  await page.getByRole('switch', { name: 'Passo a passo' }).click()
  await page.getByRole('button', { name: 'Executar' }).click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await expect(page.getByRole('log').getByText(/Robô: mover para frente/)).toHaveCount(2)
  await expect(page.getByRole('group', { name: 'Controles do passo a passo' }).getByRole('button', { name: 'Parar' })).toBeVisible()
  await expect(page.getByText(/Robô na coluna 1, linha 3/)).toBeAttached()
})

test('completes a phase, shows the result and advances to the next phase', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('garden-04', firstHarvest.referenceSolution, ['garden-01', 'garden-02', 'garden-03']) })
  await openMission(page, 'garden-04')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page.getByRole('log')).toContainText('Missão cumprida!')
  await expect(page).toHaveURL(/#\/resultado\/garden-04$/)
  await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Comandos executados' })).toContainText('8')
  await page.getByRole('link', { name: 'Próxima missão' }).click()
  await expect(page).toHaveURL(/#\/jogar\/garden-05$/)
})

test('reloading the page keeps progress and the saved program', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('garden-04', firstHarvest.referenceSolution, ['m0-training']) })
  await openMission(page, 'garden-04')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/garden-04$/)
  await page.goto('/')
  await page.reload()
  const continueButton = page.getByRole('button', { name: /Continuar missão/ })
  await expect(continueButton).toBeEnabled()
  await expect(continueButton).toContainText('Horta · Missão 1 - Primeiros passos')
  await page.goto('/#/jogar/garden-04')
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await expect(page.locator('.pseudocode-panel__code')).toContainText('virar à direita')
})

test('renders the 3D farm without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { motion: 'full' }, save: missionSave('garden-04') })
  await openMission(page, 'garden-04')
  await expect(page.locator('.farm-view canvas')).toBeVisible()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('the workspace cannot be edited while the program runs', async ({ page }) => {
  test.setTimeout(120_000)
  await seedStorage(page, { settings: { defaultSpeed: 0.5 }, save: saveWithProgram('garden-04', firstHarvest.referenceSolution) })
  await openMission(page, 'garden-04')
  await page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: 'colher planta' }).last().click()
  await page.keyboard.press('Control+Enter')
  await expect(page.getByRole('button', { name: 'Parar' })).toBeVisible()
  const remove = page.locator('.blocklyContextMenu .blocklyMenuItem').filter({ hasText: /xcluir|eletar|pagar/i }).first()
  if (await remove.isVisible()) await remove.click({ force: true })
  await expect(page.getByRole('log')).toContainText('Missão cumprida!', { timeout: 60_000 })
  const attempt = await page.evaluate(() => JSON.parse(window.localStorage.getItem('agroblocks:v1') ?? '{}').attempts[0])
  expect(attempt.blocks).toBe(8)
  await page.keyboard.press('Escape')
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await expect(page.locator('.pseudocode-panel__code')).toContainText('colher planta')
})

test('blocks in the category list keep their size when the workspace zooms', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('garden-04', firstHarvest.referenceSolution) })
  await openMission(page, 'garden-04')
  const category = page.getByRole('treeitem', { name: 'Movimento' })
  const flyoutBlockWidth = async () => {
    await category.click()
    const block = page.locator('.blocklyFlyout .blocklyDraggable').first()
    await expect(block).toBeVisible()
    await page.waitForTimeout(300)
    const box = await block.boundingBox()
    await category.click()
    return box?.width ?? 0
  }
  const workspaceBlock = page.locator('.injectionDiv > .blocklySvg .blocklyBlockCanvas .blocklyDraggable').first()
  const before = await flyoutBlockWidth()
  const workspaceBefore = (await workspaceBlock.boundingBox())?.width ?? 0
  for (let index = 0; index < 2; index += 1) {
    await page.locator('.blocklyZoomOut').dispatchEvent('pointerdown', { isPrimary: true, button: 0, pointerType: 'mouse' })
    await page.waitForTimeout(300)
  }
  expect((await workspaceBlock.boundingBox())?.width ?? 0).toBeLessThan(workspaceBefore - 10)
  const after = await flyoutBlockWidth()
  expect(before).toBeGreaterThan(0)
  expect(Math.abs(after - before)).toBeLessThan(4)
})

test('the program view follows the block being executed', async ({ page }) => {
  const mission = getMission('homestead-10')
  if (!mission) throw new Error('mission missing')
  await seedStorage(page, { settings: { motion: 'full', defaultSpeed: 1 }, save: saveWithProgram(mission.id, mission.referenceSolution, ['m0-training', 'garden-04', 'cornfield-02', 'orchard-04', 'greenhouse-03', 'barnyard-05']) })
  await openMission(page, mission.id)
  for (let index = 0; index < 6; index += 1) {
    await page.locator('.blocklyZoomIn').dispatchEvent('pointerdown', { isPrimary: true, button: 0, pointerType: 'mouse' })
    await page.waitForTimeout(120)
  }
  await page.getByRole('button', { name: 'Executar' }).click()
  const insideView = async () =>
    page.evaluate(() => {
      const host = document.querySelector('.blockly-editor__host')?.getBoundingClientRect()
      const block = document.querySelector('.agro-running-block')?.getBoundingClientRect()
      if (!host || !block) return false
      const cy = block.top + Math.min(block.height, 48) / 2
      const cx = block.left + Math.min(block.width, 60) / 2
      const marginY = host.height * 0.2
      return cx > host.left && cx < host.right && cy > host.top + marginY && cy < host.bottom - marginY
    })
  for (let sample = 0; sample < 4; sample += 1) {
    await page.waitForTimeout(1500)
    await expect.poll(insideView, { timeout: 2000 }).toBe(true)
  }
})

test('the farm panel opens and closes over a fixed, centered 3D view', async ({ page }) => {
  const short = program([act('moveForward'), act('moveForward')])
  await seedStorage(page, { settings: { motion: 'full', defaultSpeed: 0.5 }, save: saveWithProgram('garden-04', short) })
  await openMission(page, 'garden-04')
  await expect(page.locator('.farm-view canvas')).toBeVisible()
  const measure = () =>
    page.evaluate(() => {
      const panel = document.querySelector('.farm-view')?.getBoundingClientRect()
      const canvas = document.querySelector('.farm-view canvas')?.getBoundingClientRect()
      return {
        panelWidth: Math.round(panel?.width ?? 0),
        canvasWidth: Math.round(canvas?.width ?? 0),
        centerOffset: Math.round(((canvas?.left ?? 0) + (canvas?.width ?? 0) / 2) - ((panel?.left ?? 0) + (panel?.width ?? 0) / 2)),
      }
    })
  await page.waitForTimeout(1500)
  const before = await measure()
  await page.getByRole('button', { name: 'Executar' }).click()
  await page.waitForTimeout(1200)
  const during = await measure()
  await expect(page.getByRole('log')).toContainText('O programa terminou', { timeout: 20_000 })
  await page.waitForTimeout(2000)
  const after = await measure()
  expect(during.panelWidth).toBeGreaterThan(before.panelWidth)
  expect(during.canvasWidth).toBe(before.canvasWidth)
  expect(after.canvasWidth).toBe(before.canvasWidth)
  expect(Math.abs(after.panelWidth - before.panelWidth)).toBeLessThan(3)
  for (const state of [before, during, after]) expect(Math.abs(state.centerOffset)).toBeLessThan(2)
})

test('the program view returns to where it was when the run stops', async ({ page }) => {
  const mission = getMission('homestead-10')
  if (!mission) throw new Error('mission missing')
  await seedStorage(page, { settings: { motion: 'full', defaultSpeed: 1 }, save: saveWithProgram(mission.id, mission.referenceSolution, ['m0-training', 'garden-04', 'cornfield-02', 'orchard-04', 'greenhouse-03', 'barnyard-05']) })
  await openMission(page, mission.id)
  const firstBlock = page.locator('.injectionDiv > .blocklySvg .blocklyBlockCanvas .blocklyDraggable').first()
  await page.waitForTimeout(800)
  const before = await firstBlock.boundingBox()
  await page.getByRole('button', { name: 'Executar' }).click()
  await page.waitForTimeout(4000)
  await page.getByRole('button', { name: 'Parar' }).click()
  await page.waitForTimeout(1500)
  const after = await firstBlock.boundingBox()
  expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(3)
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(3)
})
