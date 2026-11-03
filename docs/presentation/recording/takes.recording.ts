import { expect, test, type Locator, type Page } from '@playwright/test'
import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_ITEMS } from '@/data/assessment/garden'
import { blockPath, saveWithProgram, seedStorage, stableBox, workspaceBlocks } from '../../../tests/e2e/helpers'
import { installGhostHand } from '../../../tests/howto/ghostHand'
import { FULL, Hand, Take, boxOf, fitWindow, frame, installOverlays, union } from './camera'

const RAW = process.env.RECORDING_RAW ?? '/tmp/agroblocks-recording-raw'
const SETTINGS = { motion: 'full', lowGraphics: false, defaultSpeed: 1, soundEnabled: false, musicEnabled: false } as const
const MOVE = () => act('moveForward')
const HARVEST = () => act('harvest')

async function idle(page: Page) {
  await expect(page.locator('.gameplay__body')).toHaveAttribute('data-running', 'false', { timeout: 40_000 })
}

async function centerWorkspace(page: Page) {
  await page.locator('.blocklyZoomReset').dispatchEvent('pointerdown')
  await page.waitForTimeout(450)
}

async function flyoutPoint(page: Page, hand: Hand, category: RegExp, label: string) {
  await hand.click(page.getByRole('treeitem', { name: category }))
  const source = page.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: label }).first()
  const box = await stableBox(page, source)
  return { x: box.x + 12, y: box.y + box.height / 2 }
}

async function hatDrop(page: Page) {
  const box = await stableBox(page, blockPath(workspaceBlocks(page).first()))
  return { x: box.x + 36, y: box.y + 62 }
}

async function belowDrop(page: Page, index: number) {
  const box = await stableBox(page, blockPath(workspaceBlocks(page).nth(index + 1)))
  return { x: box.x + 14, y: box.y + box.height + 18 }
}

async function sweep(hand: Hand, targets: Locator[], ms = 620, pause = 260) {
  for (const target of targets) {
    await hand.hover(target, ms)
    await target.page().waitForTimeout(pause)
  }
}

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installGhostHand)
  await page.addInitScript(installOverlays)
  await page.goto('/#/como-jogar')
  await fitWindow(page)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto('about:blank')
})

test('retorno', async ({ page }) => {
  await seedStorage(page, { settings: SETTINGS, save: saveWithProgram('garden-02', program([MOVE(), MOVE(), MOVE(), MOVE(), HARVEST()])) })
  await page.goto('/#/jogar/garden-02')
  await page.getByRole('button', { name: 'Começar' }).click()
  await expect(workspaceBlocks(page).first()).toBeVisible()
  await page.waitForTimeout(3500)
  const hand = new Hand(page)
  await hand.place()
  const take = new Take(page, 'retorno', RAW)
  await take.start()
  const panel = page.locator('.gameplay__side-panel')
  const tabs = page.getByRole('tab', { name: 'Console' })

  await take.clip('step-1', async () => {
    await page.waitForTimeout(400)
    await hand.click(page.getByRole('button', { name: 'Executar' }))
    await idle(page)
    await page.waitForTimeout(500)
    await centerWorkspace(page)
    const block = page.locator('.blocklyBlockCanvas .agro-error-block')
    await expect(block).toHaveCount(1)
    await take.focus(block, 40)
    await take.spot(block, 6)
    const box = await boxOf(block)
    await hand.rest({ x: box.x + box.width + 70, y: box.y + box.height + 34 })
    await page.waitForTimeout(1500)
  })

  await take.clip('step-2', async () => {
    await take.spot(null)
    await take.move(frame(union(await boxOf(tabs), await boxOf(panel)), 10), 900, false)
    const line = page.getByRole('log').locator('li').last()
    const lineBox = await boxOf(line)
    await hand.rest({ x: lineBox.x - 46, y: lineBox.y + lineBox.height / 2 }, 800)
    await take.spot(line, 4)
    await page.waitForTimeout(2400)
  })

  await take.clip('step-3', async () => {
    await take.spot(null)
    await hand.click(page.getByRole('tab', { name: 'Dicas' }))
    await page.waitForTimeout(500)
    await hand.click(page.getByRole('button', { name: /Pedir dica/ }))
    await page.waitForTimeout(1200)
    await hand.click(page.getByRole('button', { name: /Pedir dica/ }))
    await page.waitForTimeout(500)
    const panelBox = await boxOf(panel)
    await hand.rest({ x: panelBox.x - 50, y: panelBox.y + panelBox.height / 2 })
    await page.waitForTimeout(1500)
  })

  await take.clip('step-4', async () => {
    await hand.click(page.getByRole('tab', { name: 'Pseudocódigo' }))
    await page.waitForTimeout(400)
    const code = page.locator('.pseudocode-panel__code')
    await take.spot(code, 4)
    await hand.pointAt(code, 600)
    await page.waitForTimeout(2000)
  })

  await take.finish()
})

test('painel', async ({ page }) => {
  await seedStorage(page, { settings: SETTINGS })
  await page.goto('/#/painel')
  const dialog = page.getByRole('dialog', { name: 'Senha do professor' })
  await dialog.getByLabel('Senha').fill('dashboard')
  await dialog.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('button', { name: 'Dados de exemplo' }).first().click()
  await expect(page.locator('.summary')).toBeVisible()
  await page.waitForTimeout(2200)
  const hand = new Hand(page)
  await hand.place({ x: 640, y: 660 })
  const take = new Take(page, 'painel', RAW)
  await take.start()

  await take.clip('step-1', async () => {
    await page.waitForTimeout(300)
    const summary = page.locator('.summary')
    await take.scrollTo(summary, 70, 700)
    await take.focus(summary, 18, 800, false)
    await take.spot(summary, 6)
    await sweep(hand, await summary.locator('.figure').all())
    await page.waitForTimeout(700)
  })

  await take.clip('step-2', async () => {
    await take.spot(null)
    const block = page.locator('section.block', { has: page.locator('#field-title') })
    await take.scrollTo(block, 40, 800)
    await take.focus(block, 12, 800)
    await take.spot(block, 4)
    await block.locator('.class-field').evaluate((field) => {
      field.classList.remove('class-field--intro')
      void (field as HTMLElement).offsetWidth
      field.classList.add('class-field--intro')
    })
    await page.waitForTimeout(1500)
    await sweep(hand, (await block.locator('.plot--done').all()).slice(0, 3))
    await page.waitForTimeout(600)
  })

  await take.clip('step-3', async () => {
    await take.spot(null)
    const block = page.locator('section.block', { has: page.locator('#errors-title') })
    await take.scrollTo(block, 90, 800)
    await take.focus(block, 16, 800)
    await take.spot(block, 4)
    await sweep(hand, (await block.locator('.error-list__item').all()).slice(0, 4), 480, 220)
    const box = await boxOf(block)
    await hand.rest({ x: box.x + box.width + 40, y: box.y + box.height - 30 })
    await page.waitForTimeout(600)
  })

  await take.clip('step-4', async () => {
    await take.spot(null)
    const block = page.locator('section.block', { has: page.locator('#scores-title') })
    await take.focus(block, 16, 900, false)
    await take.spot(block, 4)
    await sweep(hand, (await block.locator('.scores__row:not(.scores__row--axis)').all()).slice(0, 5), 460, 200)
    const box = await boxOf(block)
    await hand.rest({ x: box.x - 36, y: box.y + box.height - 30 })
    await page.waitForTimeout(600)
  })

  await take.clip('step-5', async () => {
    await take.spot(null)
    const field = page.locator('section.block', { has: page.locator('#field-title') })
    await take.move(FULL, 700, false)
    await take.scrollTo(field, 40, 800)
    const open = field.getByRole('button', { name: /Ver detalhes/ }).nth(1)
    await hand.click(open)
    const drawer = page.locator('.drawer__panel')
    await expect(drawer).toBeVisible()
    await page.waitForTimeout(500)
    await take.focus(drawer, 10, 800)
    const plots = drawer.locator('.run__plots button')
    if (await plots.count()) {
      await hand.click(plots.nth(1), 500)
      await page.waitForTimeout(900)
    }
    await page.waitForTimeout(1400)
    await hand.click(drawer.getByRole('button', { name: 'Fechar' }))
    await take.move(FULL, 700)
    const csv = page.getByRole('button', { name: /Exportar CSV/ })
    await take.scrollTo(csv, 40, 600)
    await take.spot(csv, 6)
    await hand.pointAt(csv, 600)
    await page.waitForTimeout(1500)
  })

  await take.finish()
})

test('roteiro', async ({ page }) => {
  test.setTimeout(420_000)
  await seedStorage(page, { settings: SETTINGS })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeVisible()
  await page.waitForTimeout(3500)
  const hand = new Hand(page)
  await hand.place()
  const take = new Take(page, 'roteiro', RAW)
  await take.start()
  const panel = page.locator('.gameplay__side-panel')

  await take.clip('step-1', async () => {
    await page.waitForTimeout(600)
    await hand.click(page.getByRole('button', { name: 'Iniciar nova fazenda' }))
    const dialog = page.getByRole('dialog', { name: 'Quem está jogando?' })
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(500)
    await hand.type(dialog.getByLabel('Nome completo'), 'Ana Souza')
    await hand.type(dialog.getByLabel('Escola'), 'Escola do Campo')
    await hand.click(dialog.getByRole('button', { name: 'Começar' }))
    await expect(page).toHaveURL(/#\/jogar\/m0-training$/)
    await expect(page.getByRole('dialog', { name: 'Bem-vindo ao treinamento' })).toBeVisible()
    await page.waitForTimeout(2200)
  })

  await take.clip('step-2', async () => {
    await hand.click(page.getByRole('button', { name: 'Começar treinamento' }))
    await page.waitForTimeout(1500)
    await hand.click(page.getByRole('button', { name: 'Próximo' }))
    await page.waitForTimeout(1500)
    await hand.click(page.getByRole('button', { name: 'Próximo' }))
    const howTo = page.getByRole('dialog', { name: 'Como adicionar um bloco' })
    await expect(howTo).toBeVisible()
    await page.waitForTimeout(4000)
    await hand.click(howTo.getByRole('button', { name: 'Praticar' }))
    await expect(howTo).toBeHidden()
    await page.waitForTimeout(800)
    const target = await hatDrop(page)
    const from = await flyoutPoint(page, hand, /Movimento/, 'mover para frente')
    await hand.drag(from, target)
    await expect(page.getByTestId('tutorial-progress')).toHaveText('5/15')
    await page.waitForTimeout(1600)
  })

  await page.getByRole('dialog', { name: 'Como encaixar blocos' }).getByRole('button', { name: 'Praticar' }).click()
  await page.getByRole('button', { name: 'Pular tutorial' }).click()
  await page.getByRole('button', { name: 'Sair do treinamento' }).click()
  await expect(page).toHaveURL(/#\/missoes$/)
  await page.waitForTimeout(2800)

  await take.clip('step-3', async () => {
    await page.waitForTimeout(500)
    await hand.click(page.getByRole('region', { name: 'Prova inicial' }).getByRole('link', { name: 'Fazer a prova' }))
    await expect(page).toHaveURL(/#\/avaliacao\/garden\/pre$/)
    await page.waitForTimeout(1300)
    await hand.click(page.getByRole('button', { name: 'Começar' }))
    for (let question = 0; question < 5; question += 1) {
      await expect(page.getByText(`Questão ${question + 1} de 5`)).toBeVisible()
      await page.waitForTimeout(650)
      const prompt = (await page.locator('.assessment__prompt').innerText()).trim()
      const item = GARDEN_ITEMS.find((entry) => entry.prompt === prompt)
      if (!item) throw new Error(`unknown prompt: ${prompt}`)
      const right = question % 2 === 0
      const choice = right ? item.correctIndex : (item.correctIndex + 1) % item.options.length
      await hand.click(page.locator('.assessment__option').nth(choice), 420)
      await page.waitForTimeout(220)
      await hand.click(page.getByRole('button', { name: /Próxima|Concluir/ }), 420)
    }
    const score = page.getByRole('heading', { name: /^Você acertou \d de \d$/ })
    await expect(score).toBeVisible()
    await page.waitForTimeout(1500)
    const reviews = page.locator('.assessment__review-item')
    await take.scrollTo(reviews.nth(1), 110, 1300)
    await hand.hover(reviews.nth(1), 500)
    await page.waitForTimeout(1500)
  })

  await take.clip('step-4', async () => {
    await hand.click(page.getByRole('link', { name: /^Começar |^Ir para |^Ver missões$/ }))
    await expect(page).toHaveURL(/#\/jogar\/garden-01$/)
    await page.waitForTimeout(1500)
    await hand.click(page.getByRole('button', { name: 'Começar' }))
    await expect(workspaceBlocks(page).first()).toBeVisible()
    await page.waitForTimeout(1800)
    const target = await belowDrop(page, 1)
    const from = await flyoutPoint(page, hand, /Agricultura/, 'colher planta')
    await hand.drag(from, target)
    await expect(workspaceBlocks(page)).toHaveCount(4)
    await page.waitForTimeout(400)
    await hand.click(page.getByRole('button', { name: 'Executar' }))
    await idle(page)
    await page.waitForTimeout(500)
    await centerWorkspace(page)
    const line = page.getByRole('log').locator('li').last()
    await take.move(frame(union(await boxOf(page.getByRole('tab', { name: 'Console' })), await boxOf(panel)), 10), 900, false)
    await take.spot(line, 4)
    const lineBox = await boxOf(line)
    await hand.rest({ x: lineBox.x - 46, y: lineBox.y + lineBox.height / 2 }, 700)
    await page.waitForTimeout(2200)
  })

  await take.clip('step-5', async () => {
    await take.spot(null)
    await hand.click(page.getByRole('tab', { name: 'Dicas' }))
    await page.waitForTimeout(400)
    await hand.click(page.getByRole('button', { name: /Pedir dica/ }))
    await page.waitForTimeout(1500)
    await hand.click(page.getByRole('tab', { name: 'Pseudocódigo' }))
    await page.waitForTimeout(1600)
    await take.move(FULL, 800, false)
    await page.getByRole('treeitem', { name: /Movimento/ }).waitFor()
    const target = await belowDrop(page, 1)
    const from = await flyoutPoint(page, hand, /Movimento/, 'mover para frente')
    await hand.drag(from, target)
    await expect(workspaceBlocks(page)).toHaveCount(5)
    await page.waitForTimeout(800)
    await hand.click(page.getByRole('button', { name: 'Executar' }))
    await expect(page).toHaveURL(/#\/resultado\/garden-01$/, { timeout: 40_000 })
    await expect(page.getByRole('heading', { name: 'Missão concluída!' })).toBeVisible()
    await hand.rest({ x: 300, y: 560 }, 700)
    await page.waitForTimeout(3000)
  })

  await page.waitForTimeout(3000)
  await page.goto('/#/painel')
  await expect(page.getByRole('dialog', { name: 'Senha do professor' })).toBeVisible()
  await page.waitForTimeout(800)

  await take.clip('step-6', async () => {
    const dialog = page.getByRole('dialog', { name: 'Senha do professor' })
    await page.waitForTimeout(300)
    await hand.type(dialog.getByLabel('Senha'), 'dashboard', 70)
    await hand.click(dialog.getByRole('button', { name: 'Entrar' }))
    const row = page.getByRole('table', { name: 'Alunos' }).getByRole('row').filter({ hasText: 'Ana Souza' })
    await expect(row).toBeVisible()
    await page.waitForTimeout(1500)
    await take.spot(row, 3)
    await hand.hover(row, 700)
    await page.waitForTimeout(1200)
    await take.spot(null)
    await hand.click(row.getByRole('button', { name: /Ver detalhes/ }))
    await expect(page.locator('.drawer__panel')).toBeVisible()
    await page.waitForTimeout(600)
    await take.focus(page.locator('.drawer__panel'), 10, 800)
    await page.waitForTimeout(2200)
  })

  await take.finish()
})
