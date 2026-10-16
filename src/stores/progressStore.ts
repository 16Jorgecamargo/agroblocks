import { create } from 'zustand'
import { MISSIONS } from '@/data/missions'
import {
  createInitialSave,
  recordAttempt,
  registerHint,
  storeAssessment,
  storeProgram,
} from '@/game/progress/progression'
import type { AssessmentResponse, AttemptInput, AttemptRecord, SaveData } from '@/game/progress/types'
import { safeStorage } from '@/services/storage/jsonStorage'
import { loadSave, writeSave } from '@/services/storage/saveStorage'

const missionRefs = MISSIONS.map(({ id, order }) => ({ id, order }))

interface ProgressState {
  save: SaveData
  recordAttempt: (input: AttemptInput) => AttemptRecord
  registerHint: (missionId: string) => void
  storeProgram: (missionId: string, json: string) => void
  storeAssessment: (response: AssessmentResponse) => void
  resetProgress: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => {
  const commit = (save: SaveData) => {
    writeSave(safeStorage(), save)
    set({ save })
  }
  return {
    save: loadSave(safeStorage(), missionRefs, new Date().toISOString()),
    recordAttempt: (input) => {
      const save = recordAttempt(get().save, input, missionRefs)
      commit(save)
      const record = save.attempts.at(-1)
      if (!record) throw new Error('Attempt was not recorded')
      return record
    },
    registerHint: (missionId) => commit(registerHint(get().save, missionId)),
    storeProgram: (missionId, json) => commit(storeProgram(get().save, missionId, json)),
    storeAssessment: (response) => commit(storeAssessment(get().save, response)),
    resetProgress: () => commit(createInitialSave(missionRefs, new Date().toISOString())),
  }
})
