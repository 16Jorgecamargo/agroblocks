import { CORRUPT_KEY, loadSave, SAVE_KEY, writeSave } from '@/services/storage/saveStorage'
import { createInitialSave, recordAttempt } from '@/game/progress/progression'
import type { MissionRef } from '@/game/progress/types'

const missions: MissionRef[] = [
  { id: 'a', order: 0, world: null },
  { id: 'b', order: 1, world: 'garden' },
]
const now = '2026-10-14T12:00:00.000Z'

describe('saveStorage', () => {
  it('creates a fresh save when nothing is stored', () => {
    expect(loadSave(window.localStorage, missions, now)).toEqual(createInitialSave(missions, now))
  })

  it('round-trips a save', () => {
    const save = recordAttempt(
      createInitialSave(missions, now),
      {
        missionId: 'a',
        timestamp: now,
        outcome: 'success',
        errorCode: null,
        actions: 3,
        blocks: 3,
        usage: { seeds: 0, water: 0, energy: 3 },
        efficiencyStars: 3,
        pseudocode: 'x',
      },
      missions,
    )
    writeSave(window.localStorage, save)
    expect(loadSave(window.localStorage, missions, now)).toEqual(save)
  })

  it('keeps the game playable when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    } as unknown as Storage
    expect(loadSave(blocked, missions, now)).toEqual(createInitialSave(missions, now))
    expect(() => writeSave(blocked, createInitialSave(missions, now))).not.toThrow()
    expect(loadSave(null, missions, now).missions.a.status).toBe('available')
  })

  it('backs up corrupt data and starts clean', () => {
    window.localStorage.setItem(SAVE_KEY, '{"version":99}')
    const save = loadSave(window.localStorage, missions, now)
    expect(save).toEqual(createInitialSave(missions, now))
    expect(window.localStorage.getItem(CORRUPT_KEY)).toBe('{"version":99}')
  })
})

describe('legacy saves', () => {
  it('loads a save with participantCode and no run fields', () => {
    const legacy = {
      version: 1,
      participantCode: 'ALUNO-07',
      createdAt: '2026-10-14T12:00:00.000Z',
      missions: {},
      attempts: [],
      assessments: { pre: null, post: null },
    }
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(legacy))
    const save = loadSave(window.localStorage, [{ id: 'm0-training', order: 0, world: null }], 'now')
    expect(save.createdAt).toBe('2026-10-14T12:00:00.000Z')
    expect(save).toMatchObject({ runId: null, student: null, tutorial: null })
    expect(save).not.toHaveProperty('participantCode')
  })

  it('migrates a version 1 save', () => {
    const versionOneSave = {
      version: 1,
      runId: 'run-7',
      student: { name: 'Ana Souza', school: 'Escola Azul' },
      tutorial: { status: 'completed', step: 15, at: 't' },
      createdAt: '2026-10-14T12:00:00.000Z',
      missions: {
        'm0-training': { status: 'completed', attempts: 1, bestResult: null, hintsUsed: 0, errorCounts: {}, savedProgram: null },
        'm1-first-harvest': { status: 'completed', attempts: 2, bestResult: null, hintsUsed: 0, errorCounts: {}, savedProgram: null },
      },
      attempts: [],
      assessments: { pre: null, post: null },
    }
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(versionOneSave))
    const save = loadSave(window.localStorage, missions, now)
    expect(save.version).toBe(2)
    expect(save.runId).toBe('run-7')
    expect(save.student).toEqual(versionOneSave.student)
    expect(save.tutorial).toEqual(versionOneSave.tutorial)
    expect(window.localStorage.getItem(CORRUPT_KEY)).toBeNull()
    expect(save.assessments.garden).toEqual({ pre: null, post: null })
    expect(save.missions['m1-first-harvest']).toBeUndefined()
  })
})
