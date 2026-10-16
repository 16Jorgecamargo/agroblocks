import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { act, program } from '@/blocks/interpreter/programBuilder'
import type { Program } from '@/blocks/interpreter/ast'
import { CLIP_NAMES, clipPosterPath, clipVideoPath, type ClipName } from '@/features/tutorial/howto/howtoClips'
import { blockPath, saveWithProgram, seedStorage, stableBox, workspaceBlocks } from '../e2e/helpers'
import { startCapture } from './capture'
import { installGhostHand } from './ghostHand'

const SIZE = { width: 1280, height: 800 }
const PUBLIC_DIR = join(process.cwd(), 'public')

interface Point {
  x: number
  y: number
}

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function center(box: { x: number; y: number; width: number; height: number }): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

class Hand {
  private at: Point = { x: SIZE.width * 0.42, y: SIZE.height * 0.7 }

  constructor(private readonly page: Page) {}

  async place(point: Point = this.at) {
    this.at = point
    await this.page.mouse.move(point.x, point.y)
  }

  async glide(to: Point, ms = 700) {
    const from = this.at
    const distance = Math.hypot(to.x - from.x, to.y - from.y)
    const bend = Math.min(60, distance * 0.12)
    const normal = distance === 0 ? { x: 0, y: 0 } : { x: -(to.y - from.y) / distance, y: (to.x - from.x) / distance }
    const started = Date.now()
    for (let progress = 0; progress < 1; progress = Math.min(1, (Date.now() - started) / ms)) {
      const t = ease(progress)
      const arc = Math.sin(Math.PI * progress) * bend
      await this.page.mouse.move(from.x + (to.x - from.x) * t + normal.x * arc, from.y + (to.y - from.y) * t + normal.y * arc)
      await this.page.waitForTimeout(12)
    }
    await this.page.mouse.move(to.x, to.y)
    this.at = to
  }

  async click(to: Point) {
    await this.glide(to)
    await this.page.waitForTimeout(220)
    await this.page.mouse.down()
    await this.page.waitForTimeout(130)
    await this.page.mouse.up()
    await this.page.waitForTimeout(450)
  }

  async drag(from: Point, to: Point, ms = 1200) {
    await this.glide(from)
    await this.page.waitForTimeout(250)
    await this.page.mouse.down()
    await this.page.waitForTimeout(250)
    await this.glide({ x: from.x + 12, y: from.y + 6 }, 160)
    await this.glide(to, ms)
    await this.page.waitForTimeout(280)
    await this.page.mouse.up()
    await this.page.waitForTimeout(500)
  }

  async key(name: string) {
    await this.page.waitForTimeout(300)
    await this.page.keyboard.down(name)
    await this.page.waitForTimeout(380)
    await this.page.keyboard.up(name)
    await this.page.waitForTimeout(700)
  }
}

const MOVE = () => act('moveForward')
const HARVEST = () => act('harvest')

async function grabPoint(page: Page, block: Locator): Promise<Point> {
  const box = await stableBox(page, blockPath(block))
  return { x: box.x + 12, y: box.y + 14 }
}

async function hatDrop(page: Page): Promise<Point> {
  const box = await stableBox(page, blockPath(workspaceBlocks(page).first()))
  return { x: box.x + 36, y: box.y + 62 }
}

async function belowDrop(page: Page, index: number): Promise<Point> {
  const box = await stableBox(page, blockPath(workspaceBlocks(page).nth(index + 1)))
  return { x: box.x + 14, y: box.y + box.height + 18 }
}

async function flyoutMove(page: Page, hand: Hand): Promise<Point> {
  await hand.click(center(await stableBox(page, page.getByRole('treeitem', { name: /Movimento/ }))))
  const source = page.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: 'mover para frente' }).first()
  const box = await stableBox(page, source)
  return { x: box.x + 12, y: box.y + box.height / 2 }
}

async function boxOf(page: Page, locator: Locator): Promise<Point> {
  return center(await stableBox(page, locator))
}

async function waitIdle(page: Page) {
  await expect(page.locator('.gameplay__body')).toHaveAttribute('data-running', 'false', { timeout: 20_000 })
}

interface Recipe {
  start: Program
  play: (page: Page, hand: Hand, poster: () => void) => Promise<void>
}

const RECIPES: Record<ClipName, Recipe> = {
  'add-block': {
    start: program([]),
    play: async (page, hand, poster) => {
      const target = await hatDrop(page)
      const from = await flyoutMove(page, hand)
      await hand.glide(from)
      poster()
      await hand.drag(from, target)
      await expect(workspaceBlocks(page)).toHaveCount(2)
    },
  },
  'snap-blocks': {
    start: program([MOVE()]),
    play: async (page, hand, poster) => {
      const target = await belowDrop(page, 0)
      const from = await flyoutMove(page, hand)
      await hand.glide(from)
      poster()
      await hand.drag(from, target)
      await expect(workspaceBlocks(page)).toHaveCount(3)
    },
  },
  'delete-trash': {
    start: program([MOVE(), MOVE()]),
    play: async (page, hand, poster) => {
      const from = await grabPoint(page, workspaceBlocks(page).nth(2))
      const trash = await boxOf(page, page.locator('.blocklyTrash'))
      await hand.glide(from)
      poster()
      await hand.drag(from, trash, 1400)
      await expect(workspaceBlocks(page)).toHaveCount(2)
    },
  },
  'delete-library': {
    start: program([MOVE(), MOVE()]),
    play: async (page, hand, poster) => {
      const from = await grabPoint(page, workspaceBlocks(page).nth(2))
      const library = await boxOf(page, page.getByRole('treeitem', { name: /Agricultura/ }))
      await hand.glide(from)
      poster()
      await hand.drag(from, { x: library.x, y: library.y + 60 }, 1300)
      await expect(workspaceBlocks(page)).toHaveCount(2)
    },
  },
  'delete-key': {
    start: program([MOVE(), MOVE()]),
    play: async (page, hand, poster) => {
      await hand.click(await grabPoint(page, workspaceBlocks(page).nth(2)))
      poster()
      await hand.key('Delete')
      await expect(workspaceBlocks(page)).toHaveCount(2)
    },
  },
  'open-pseudocode': {
    start: program([MOVE(), MOVE(), HARVEST()]),
    play: async (page, hand, poster) => {
      await hand.click(await boxOf(page, page.getByRole('tab', { name: 'Pseudocódigo' })))
      poster()
      const panel = await boxOf(page, page.locator('.gameplay__side-panel'))
      await hand.glide({ x: panel.x, y: panel.y + 30 }, 900)
      await page.waitForTimeout(1200)
    },
  },
  'run-stop': {
    start: program([MOVE(), MOVE()]),
    play: async (page, hand, poster) => {
      await hand.click(await boxOf(page, page.getByRole('button', { name: 'Executar' })))
      await page.waitForTimeout(1300)
      poster()
      await hand.click(await boxOf(page, page.getByRole('button', { name: 'Parar' })))
      await waitIdle(page)
      await page.waitForTimeout(900)
    },
  },
  'step-mode': {
    start: program([MOVE(), MOVE()]),
    play: async (page, hand, poster) => {
      await hand.click(await boxOf(page, page.getByRole('switch', { name: 'Passo a passo' })))
      await hand.click(await boxOf(page, page.getByRole('button', { name: 'Executar' })))
      await page.waitForTimeout(1200)
      poster()
      await hand.click(await boxOf(page, page.getByRole('button', { name: 'Próximo' })))
      await page.waitForTimeout(1500)
    },
  },
  hints: {
    start: program([]),
    play: async (page, hand, poster) => {
      await hand.click(await boxOf(page, page.getByRole('tab', { name: 'Dicas' })))
      await hand.click(await boxOf(page, page.getByRole('button', { name: /Pedir dica/ })))
      poster()
      await page.waitForTimeout(1500)
    },
  },
  'error-experiment': {
    start: program([MOVE(), MOVE(), MOVE(), HARVEST()]),
    play: async (page, hand, poster) => {
      await hand.click(await boxOf(page, page.getByRole('button', { name: 'Executar' })))
      await waitIdle(page)
      await page.waitForTimeout(400)
      await hand.click(await boxOf(page, page.getByRole('tab', { name: 'Console' })))
      const panel = await boxOf(page, page.locator('.gameplay__side-panel'))
      await hand.glide({ x: panel.x, y: panel.y + 20 }, 800)
      poster()
      await page.waitForTimeout(1600)
    },
  },
  fix: {
    start: program([MOVE(), MOVE(), MOVE(), HARVEST()]),
    play: async (page, hand, poster) => {
      await hand.click(await grabPoint(page, workspaceBlocks(page).nth(3)))
      await hand.key('Delete')
      await expect(workspaceBlocks(page)).toHaveCount(4)
      await hand.click(await boxOf(page, page.getByRole('button', { name: 'Executar' })))
      await waitIdle(page)
      poster()
      await page.waitForTimeout(1600)
    },
  },
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await mkdir(join(PUBLIC_DIR, 'howto'), { recursive: true })
})

for (const name of CLIP_NAMES) {
  test(`records ${name}`, async ({ page }) => {
    const recipe = RECIPES[name]
    await page.addInitScript(installGhostHand)
    await seedStorage(page, {
      settings: { motion: 'full', renderMode: '3d', defaultSpeed: 1, soundEnabled: false },
      save: saveWithProgram('m0-training', recipe.start),
    })
    await page.goto('/#/jogar/m0-training')
    await expect(workspaceBlocks(page).first()).toBeVisible()
    await page.waitForTimeout(3000)
    const hand = new Hand(page)
    await hand.place()
    const capture = await startCapture(page, SIZE)
    await page.waitForTimeout(600)
    await recipe.play(page, hand, capture.poster)
    await page.waitForTimeout(500)
    await capture.finish(join(PUBLIC_DIR, clipVideoPath(name)), join(PUBLIC_DIR, clipPosterPath(name)))
  })
}
