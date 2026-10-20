import { create } from 'zustand'
import { MISSIONS } from '@/data/missions'
import {
  assignStudent,
  createInitialSave,
  recordAttempt,
  recordTutorial as recordTutorialOutcome,
  registerHint,
  storeAssessment,
  storeProgram,
} from '@/game/progress/progression'
import type { AssessmentResponse, AttemptInput, AttemptRecord, SaveData } from '@/game/progress/types'
import { safeStorage } from '@/services/storage/jsonStorage'
import type { StudentInfo } from '@/shared/student'
import { loadSave, writeSave } from '@/services/storage/saveStorage'

const missionRefs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))

interface ProgressState {
  save: SaveData
  recordAttempt: (input: AttemptInput) => AttemptRecord
  registerHint: (missionId: string) => void
  storeProgram: (missionId: string, json: string) => void
  storeAssessment: (response: AssessmentResponse) => void
  resetProgress: () => void
  startRun: (student: StudentInfo) => void
  registerStudent: (student: StudentInfo) => void
  recordTutorial: (status: 'completed' | 'skipped', step: number) => void
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
    startRun: (student) => commit(assignStudent(createInitialSave(missionRefs, new Date().toISOString()), student, crypto.randomUUID())),
    registerStudent: (student) => {
      const save = get().save
      commit(assignStudent(save, student, save.runId ?? crypto.randomUUID()))
    },
    recordTutorial: (status, step) => commit(recordTutorialOutcome(get().save, { status, step, at: new Date().toISOString() })),
  }
})
