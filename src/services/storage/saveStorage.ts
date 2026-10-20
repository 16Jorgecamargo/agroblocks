import { createInitialSave, syncMissions } from '@/game/progress/progression'
import type { MissionRef, SaveData } from '@/game/progress/types'
import { readJson, writeJson } from '@/services/storage/jsonStorage'
import { legacySaveSchema, saveDataSchema } from '@/services/storage/saveDataSchema'

export const SAVE_KEY = 'agroblocks:v1'
export const CORRUPT_KEY = 'agroblocks:corrupt'

export function loadSave(storage: Storage | null, missions: MissionRef[], now: string): SaveData {
  const { value, corrupt, raw } = readJson(storage, SAVE_KEY, saveDataSchema)
  if (value) return syncMissions(value as SaveData, missions)
  const migrated = raw === null ? null : migrateSave(raw, missions, now)
  if (migrated) return migrated
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

export function migrateSave(raw: string, missions: MissionRef[], now: string): SaveData | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const legacy = legacySaveSchema.safeParse(parsed)
  if (!legacy.success) return null
  const fresh = createInitialSave(missions, now)
  const training = legacy.data.missions['m0-training']
  const missionsState = training && fresh.missions['m0-training'] ? { ...fresh.missions, 'm0-training': { ...fresh.missions['m0-training'], ...training } } : fresh.missions
  return syncMissions(
    { ...fresh, runId: legacy.data.runId, student: legacy.data.student, tutorial: legacy.data.tutorial, createdAt: legacy.data.createdAt, missions: missionsState },
    missions,
  )
}
