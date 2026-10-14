import type { Page } from '@playwright/test'
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
  const settings = { ...DEFAULT_SETTINGS, renderMode: '2d', motion: 'reduced', defaultSpeed: 4, soundEnabled: false, ...options.settings }
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
