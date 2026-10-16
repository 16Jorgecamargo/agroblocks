import { expect, test, type Page } from '@playwright/test'
import { clickBlock, dragFromToolbox, openMission, seedStorage, workspaceBlocks } from './helpers'

async function progress(page: Page, value: string) {
  await expect(page.getByTestId('tutorial-progress')).toHaveText(value)
}

async function practise(page: Page, title: string) {
  const dialog = page.getByRole('dialog', { name: title })
  await expect(dialog).toBeVisible()
  await expect.poll(() => dialog.locator('.howto-video video').evaluate((video: HTMLVideoElement) => video.videoWidth)).toBe(1280)
  await dialog.getByRole('button', { name: 'Praticar' }).click()
  await expect(dialog).toBeHidden()
}

async function settle(page: Page) {
  await expect(page.locator('.gameplay__body')).toHaveAttribute('data-running', 'false')
  await page.waitForTimeout(1200)
}

async function calloutClearOfTarget(page: Page, target: string) {
  const callout = await page.locator('.tutorial-callout').boundingBox()
  const area = await page.locator(`[data-tutorial="${target}"]`).boundingBox()
  if (!callout || !area) throw new Error('missing boxes')
  const overlapX = Math.min(callout.x + callout.width, area.x + area.width) - Math.max(callout.x, area.x)
  const overlapY = Math.min(callout.y + callout.height, area.y + area.height) - Math.max(callout.y, area.y)
  expect(overlapX <= 0 || overlapY <= 0).toBe(true)
}

test('the training teaches every part of the screen with real actions', async ({ page }) => {
  test.setTimeout(120_000)
  await seedStorage(page, { settings: { motion: 'reduced' } })
  await openMission(page, 'm0-training')
  await progress(page, '2/15')
  await calloutClearOfTarget(page, 'hud-goal')
  await page.getByRole('button', { name: 'Próximo' }).click()
  await progress(page, '3/15')
  await calloutClearOfTarget(page, 'farm')
  await page.getByRole('button', { name: 'Próximo' }).click()

  await progress(page, '4/15')
  await practise(page, 'Como adicionar um bloco')
  await calloutClearOfTarget(page, 'editor')
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 'hat')
  await progress(page, '5/15')
  await practise(page, 'Como encaixar blocos')
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 0)
  await progress(page, '6/15')

  await practise(page, 'Como apagar um bloco')
  await clickBlock(page, workspaceBlocks(page).last())
  await page.keyboard.press('Delete')
  await progress(page, '7/15')

  await practise(page, 'Como ver o pseudocódigo')
  await page.getByRole('tab', { name: 'Pseudocódigo' }).click()
  await progress(page, '8/15')

  await practise(page, 'Como executar e parar')
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 0)
  await page.getByRole('button', { name: 'Executar' }).click()
  await page.getByRole('button', { name: 'Parar' }).click()
  await progress(page, '9/15')

  await practise(page, 'Como usar o passo a passo')
  await page.getByRole('switch', { name: 'Passo a passo' }).click()
  await page.locator('.execution-panel').getByRole('button', { name: 'Executar' }).click()
  await progress(page, '9/15')
  await page.locator('.execution-panel').getByRole('button', { name: 'Parar' }).click()
  await progress(page, '10/15')

  await practise(page, 'Como pedir uma dica')
  await page.getByRole('tab', { name: 'Dicas' }).click()
  await page.getByRole('button', { name: /Pedir dica/ }).click()
  await progress(page, '11/15')

  await practise(page, 'Como fazer o experimento')
  await page.getByRole('switch', { name: 'Passo a passo' }).click()
  await settle(page)
  await dragFromToolbox(page, 'Movimento', 'mover para frente', 1)
  await dragFromToolbox(page, 'Agricultura', 'colher planta', 2)
  await page.getByRole('button', { name: 'Executar' }).click()
  await progress(page, '12/15')
  await expect(page.getByRole('tab', { name: 'Console' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('log')).toContainText('pedra')
  await page.getByRole('button', { name: 'Próximo' }).click()

  await practise(page, 'Como corrigir o programa')
  await settle(page)
  await clickBlock(page, workspaceBlocks(page).nth(3))
  await page.keyboard.press('Delete')
  await page.getByRole('button', { name: 'Executar' }).click()
  await progress(page, '14/15')
  await page.getByRole('button', { name: 'Próximo' }).click()

  await expect(page.getByRole('dialog', { name: 'Treinamento concluído!' })).toBeVisible()
  await page.getByRole('button', { name: 'Ir para as missões' }).click()
  await expect(page).toHaveURL(/#\/missoes$/)
})

test('the spotlight blocks clicks outside the current area', async ({ page }) => {
  await seedStorage(page, {})
  await openMission(page, 'm0-training')
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('dialog', { name: 'Como adicionar um bloco' }).getByRole('button', { name: 'Praticar' }).click()
  const run = await page.getByRole('button', { name: 'Executar' }).boundingBox()
  if (!run) throw new Error('missing run button')
  await page.mouse.click(run.x + run.width / 2, run.y + run.height / 2)
  await expect(page.getByRole('button', { name: 'Executar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Parar' })).toHaveCount(0)
  await progress(page, '4/15')
})
