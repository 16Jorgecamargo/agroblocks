import { expect, test } from '@playwright/test'
import { act, program } from '@/blocks/interpreter/programBuilder'
import { getMission } from '@/data/missions'
import { openMission, saveWithProgram, seedStorage } from './helpers'

const firstHarvest = getMission('m1-first-harvest')
if (!firstHarvest) throw new Error('mission missing')

test('starts a new farm from the home screen at the guided training', async ({ page }) => {
  await seedStorage(page, {})
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuar missão/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Iniciar nova fazenda' }).click()
  await expect(page).toHaveURL(/#\/jogar\/m0-training$/)
  await page.getByRole('button', { name: 'Começar' }).click()
  await expect(page.getByText('1/6')).toBeVisible()
})

test('builds a program by dragging a real block into the editor', async ({ page }) => {
  await seedStorage(page, {})
  await openMission(page, 'm0-training')
  await page.getByRole('button', { name: 'Próximo' }).click()
  await expect(page.getByText('2/6')).toBeVisible()

  await page.getByRole('treeitem', { name: /Movimento/ }).click()
  const source = page.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: 'mover para frente' }).first()
  const hat = page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: 'quando executar' }).first()
  const from = await source.boundingBox()
  const to = await hat.boundingBox()
  if (!from || !to) throw new Error('blocks not visible')
  await page.mouse.move(from.x + 12, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + 36, to.y + 62, { steps: 20 })
  await page.mouse.up()

  await expect(page.getByText('3/6')).toBeVisible()
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await expect(page.locator('.pseudocode-panel__code')).toContainText('quando executar:\n    mover para frente')
})

test('explains an error and highlights the failing state', async ({ page }) => {
  const wrong = program([act('moveForward'), act('moveForward'), act('moveForward'), act('harvest')])
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', wrong) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page.getByRole('log')).toContainText('Não há planta para colher neste canteiro.')
  await expect(page.getByRole('log')).toContainText('O robô colheu no lugar errado')
  await expect(page.locator('.blocklyBlockCanvas .agro-error-block')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Executar' })).toBeVisible()
})

test('step mode executes one instruction per click', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('switch', { name: 'Passo a passo' }).click()
  await page.getByRole('button', { name: 'Executar' }).click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await expect(page.getByRole('log').getByText(/Robô: mover para frente/)).toHaveCount(2)
  await expect(page.getByRole('group', { name: 'Controles do passo a passo' }).getByRole('button', { name: 'Parar' })).toBeVisible()
  await expect(page.getByRole('gridcell', { name: /coluna 1, linha 3: .*robô/ })).toBeVisible()
})

test('completes a phase, shows the result and advances to the next phase', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page.getByRole('log')).toContainText('Missão cumprida!')
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Comandos executados' })).toContainText('8')
  await page.getByRole('link', { name: 'Próxima fase' }).click()
  await expect(page).toHaveURL(/#\/jogar\/m2-row-planting$/)
})

test('reloading the page keeps progress and the saved program', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution, ['m0-training']) })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await page.goto('/')
  await page.reload()
  const continueButton = page.getByRole('button', { name: /Continuar missão/ })
  await expect(continueButton).toBeEnabled()
  await expect(continueButton).toContainText('Fase 2 - Plantação em série')
  await page.goto('/#/jogar/m1-first-harvest')
  await page.getByRole('button', { name: 'Começar' }).click()
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await expect(page.locator('.pseudocode-panel__code')).toContainText('virar à direita')
})

test('the dashboard shows real recorded data and the empty state before it', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await page.goto('/#/painel')
  await expect(page.getByText('Ainda não existem registros neste navegador.')).toBeVisible()
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Executar' }).click()
  await expect(page).toHaveURL(/#\/resultado\/m1-first-harvest$/)
  await page.goto('/#/painel')
  await expect(page.getByRole('group', { name: 'Fases concluídas' })).toContainText('1 de 6')
})

test('renders the 3D farm without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await openMission(page, 'm1-first-harvest')
  await expect(page.locator('.farm-view canvas')).toBeVisible()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('the workspace cannot be edited while the program runs', async ({ page }) => {
  await seedStorage(page, { settings: { defaultSpeed: 0.5 }, save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  await page.locator('.blocklyBlockCanvas .blocklyDraggable').filter({ hasText: 'colher planta' }).last().click()
  await page.keyboard.press('Control+Enter')
  await expect(page.getByRole('button', { name: 'Parar' })).toBeVisible()
  const remove = page.locator('.blocklyContextMenu .blocklyMenuItem').filter({ hasText: /xcluir|eletar|pagar/i }).first()
  if (await remove.isVisible()) await remove.click({ force: true })
  await expect(page.getByRole('log')).toContainText('Missão cumprida!', { timeout: 30_000 })
  const attempt = await page.evaluate(() => JSON.parse(window.localStorage.getItem('agroblocks:v1') ?? '{}').attempts[0])
  expect(attempt.blocks).toBe(8)
  await page.keyboard.press('Escape')
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await expect(page.locator('.pseudocode-panel__code')).toContainText('colher planta')
})

test('blocks in the category list keep their size when the workspace zooms', async ({ page }) => {
  await seedStorage(page, { save: saveWithProgram('m1-first-harvest', firstHarvest.referenceSolution) })
  await openMission(page, 'm1-first-harvest')
  const category = page.getByRole('treeitem', { name: 'Movimento' })
  const flyoutBlockWidth = async () => {
    await category.click()
    const block = page.locator('.blocklyFlyout .blocklyDraggable').first()
    await expect(block).toBeVisible()
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
  expect(Math.abs(after - before)).toBeLessThan(1)
})

test('the program view follows the block being executed', async ({ page }) => {
  const mission = getMission('m6-efficient-farm')
  if (!mission) throw new Error('mission missing')
  await seedStorage(page, { settings: { motion: 'full', defaultSpeed: 1 }, save: saveWithProgram(mission.id, mission.referenceSolution, ['m0-training', 'm1-first-harvest', 'm2-row-planting', 'm3-smart-irrigation', 'm4-auto-harvest', 'm5-limited-resources']) })
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
