import type { Locator, Page } from '@playwright/test'
import type { Program } from '@/blocks/interpreter/ast'
import { programToWorkspaceJson } from '@/blocks/serializer/programToWorkspaceJson'
import { MISSIONS } from '@/data/missions'
import { createInitialSave, recordAttempt, storeProgram } from '@/game/progress/progression'
import type { SaveData } from '@/game/progress/types'
import { SAVE_KEY } from '@/services/storage/saveStorage'
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from '@/services/storage/settingsStorage'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))

export function saveWithProgram(missionId: string, program: Program, completed: string[] = []): SaveData {
  let save = createInitialSave(refs, '2026-10-14T12:00:00.000Z')
  for (const id of completed) {
    save = recordAttempt(
      save,
      {
        missionId: id,
        timestamp: '2026-10-14T12:00:00.000Z',
        outcome: 'success',
        errorCode: null,
        actions: 1,
        blocks: 1,
        usage: { seeds: 0, water: 0, energy: 0 },
        efficiencyStars: 3,
        pseudocode: '',
      },
      refs,
    )
  }
  return storeProgram(save, missionId, JSON.stringify(programToWorkspaceJson(program)))
}

export async function seedStorage(page: Page, options: { settings?: Partial<Settings>; save?: SaveData }): Promise<void> {
  const settings = { ...DEFAULT_SETTINGS, motion: 'reduced', lowGraphics: true, defaultSpeed: 4, ...options.settings }
  await page.addInitScript(
    ({ settingsKey, settingsValue, saveKey, saveValue }) => {
      if (!window.localStorage.getItem(settingsKey)) window.localStorage.setItem(settingsKey, settingsValue)
      if (saveValue && !window.localStorage.getItem(saveKey)) window.localStorage.setItem(saveKey, saveValue)
    },
    {
      settingsKey: SETTINGS_KEY,
      settingsValue: JSON.stringify(settings),
      saveKey: SAVE_KEY,
      saveValue: options.save ? JSON.stringify(options.save) : null,
    },
  )
}

export async function openMission(page: Page, missionId: string): Promise<void> {
  await page.goto(`/#/jogar/${missionId}`)
  await page.getByRole('button', { name: 'Começar' }).click()
}

export function workspaceBlocks(page: Page) {
  return page.locator('.blocklySvg .blocklyDraggable')
}

export function blockPath(block: Locator): Locator {
  return block.locator('xpath=./*[contains(concat(" ", @class, " "), " blocklyPath ")][1]')
}

export async function stableBox(page: Page, target: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  let previous = await target.boundingBox()
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await page.waitForTimeout(100)
    const current = await target.boundingBox()
    if (previous && current && current.x === previous.x && current.y === previous.y && current.height === previous.height) return current
    previous = current
  }
  throw new Error('element never stopped moving')
}

export async function clickBlock(page: Page, block: Locator): Promise<void> {
  const box = await stableBox(page, blockPath(block))
  await page.mouse.click(box.x + 6, box.y + 12)
}

export async function dragFromToolbox(page: Page, category: string, label: string, dropBelow: 'hat' | number): Promise<void> {
  const anchor = dropBelow === 'hat' ? workspaceBlocks(page).first() : workspaceBlocks(page).nth(dropBelow + 1)
  const to = await stableBox(page, blockPath(anchor))
  await page.getByRole('treeitem', { name: new RegExp(category) }).click()
  const source = page.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: label }).first()
  const from = await stableBox(page, source)
  const target = dropBelow === 'hat' ? { x: to.x + 36, y: to.y + 62 } : { x: to.x + 14, y: to.y + to.height + 18 }
  await page.mouse.move(from.x + 12, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x, target.y, { steps: 20 })
  await page.mouse.up()
}

export async function registerStudent(page: Page, name = 'Ana Souza', school = 'Escola Azul'): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Quem está jogando?' })
  await dialog.getByLabel('Nome completo').fill(name)
  await dialog.getByLabel('Escola').fill(school)
  await dialog.getByRole('button', { name: 'Começar' }).click()
}
