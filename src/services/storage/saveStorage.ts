import { createInitialSave, syncMissions } from '@/game/progress/progression'
import type { MissionRef, SaveData } from '@/game/progress/types'
import { readJson, writeJson } from '@/services/storage/jsonStorage'
import { saveDataSchema } from '@/services/storage/saveDataSchema'

export const SAVE_KEY = 'agroblocks:v1'
export const CORRUPT_KEY = 'agroblocks:corrupt'

export function loadSave(storage: Storage | null, missions: MissionRef[], now: string): SaveData {
  const { value, corrupt, raw } = readJson(storage, SAVE_KEY, saveDataSchema)
  if (value) return syncMissions(value as SaveData, missions)
  if (corrupt && raw !== null) {
    try {
      storage?.setItem(CORRUPT_KEY, raw)
    } catch {
      return createInitialSave(missions, now)
    }
  }
  return createInitialSave(missions, now)
}

export function writeSave(storage: Storage | null, save: SaveData): void {
  writeJson(storage, SAVE_KEY, save)
}
