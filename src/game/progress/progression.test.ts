import {
  continueMissionId,
  createInitialSave,
  failedAttempts,
  hasProgress,
  isBetterResult,
  recordAttempt,
  registerHint,
  storeProgram,
  syncMissions,
} from '@/game/progress/progression'
import type { AttemptInput } from '@/game/progress/types'

const missions = [
  { id: 'a', order: 0 },
  { id: 'b', order: 1 },
  { id: 'c', order: 2 },
  { id: 'd', order: 3 },
]
const now = '2026-10-14T12:00:00.000Z'

function attempt(missionId: string, outcome: AttemptInput['outcome'], actions = 10): AttemptInput {
  return {
    missionId,
    timestamp: now,
    outcome,
    errorCode: outcome === 'error' ? 'HIT_OBSTACLE' : null,
    actions,
    blocks: 4,
    usage: { seeds: 1, water: 2, energy: 3 },
    efficiencyStars: outcome === 'success' ? 2 : null,
    pseudocode: 'quando executar:',
  }
}

describe('progression', () => {
  it('starts with the first two missions available and the rest locked', () => {
    const save = createInitialSave(missions, now)
    expect(Object.values(save.missions).map((progress) => progress.status)).toEqual(['available', 'available', 'locked', 'locked'])
    expect(hasProgress(save)).toBe(false)
    expect(continueMissionId(save, missions)).toBeNull()
  })

  it('records failed attempts and error counts without unlocking', () => {
    const save = recordAttempt(createInitialSave(missions, now), attempt('b', 'error'), missions)
    expect(save.missions.b).toMatchObject({ status: 'available', attempts: 1, errorCounts: { HIT_OBSTACLE: 1 } })
    expect(save.missions.c.status).toBe('locked')
    expect(save.attempts[0]).toMatchObject({ id: 'b-1', attemptNumber: 1, hintsUsed: 0 })
    expect(failedAttempts(save, 'b')).toBe(1)
    expect(hasProgress(save)).toBe(true)
  })

  it('completes the mission, stores the best result and unlocks the next one', () => {
    const save = recordAttempt(createInitialSave(missions, now), attempt('b', 'success'), missions)
    expect(save.missions.b.status).toBe('completed')
    expect(save.missions.b.bestResult).toEqual({ actions: 10, blocks: 4, usage: { seeds: 1, water: 2, energy: 3 }, efficiencyStars: 2 })
    expect(save.missions.c.status).toBe('available')
    expect(save.missions.d.status).toBe('locked')
  })

  it('keeps the best result when a later success is worse', () => {
    let save = recordAttempt(createInitialSave(missions, now), attempt('b', 'success', 10), missions)
    save = recordAttempt(save, { ...attempt('b', 'success', 30), efficiencyStars: 1 }, missions)
    expect(save.missions.b.bestResult?.actions).toBe(10)
    expect(save.missions.b.attempts).toBe(2)
  })

  it('never re-locks a completed mission', () => {
    let save = recordAttempt(createInitialSave(missions, now), attempt('b', 'success'), missions)
    save = recordAttempt(save, attempt('b', 'error'), missions)
    expect(save.missions.b.status).toBe('completed')
  })

  it('counts revealed hints up to four and stamps them on attempts', () => {
    let save = createInitialSave(missions, now)
    for (let index = 0; index < 6; index += 1) save = registerHint(save, 'a')
    expect(save.missions.a.hintsUsed).toBe(4)
    save = recordAttempt(save, attempt('a', 'error'), missions)
    expect(save.attempts[0].hintsUsed).toBe(4)
  })

  it('stores programs per mission', () => {
    const save = storeProgram(createInitialSave(missions, now), 'a', '{"blocks":{}}')
    expect(save.missions.a.savedProgram).toBe('{"blocks":{}}')
  })

  it('continues at the first available mission not completed', () => {
    let save = recordAttempt(createInitialSave(missions, now), attempt('a', 'success'), missions)
    save = recordAttempt(save, attempt('b', 'success'), missions)
    expect(continueMissionId(save, missions)).toBe('c')
  })

  it('continues at the last mission when everything is completed', () => {
    let save = createInitialSave(missions, now)
    for (const mission of missions) save = recordAttempt(save, attempt(mission.id, 'success'), missions)
    expect(continueMissionId(save, missions)).toBe('d')
  })

  it('adds new missions to old saves with the right status', () => {
    const save = recordAttempt(createInitialSave(missions.slice(0, 3), now), attempt('c', 'success'), missions.slice(0, 3))
    const synced = syncMissions(save, missions)
    expect(synced.missions.d.status).toBe('available')
  })

  it('compares results by stars then actions', () => {
    const base = { actions: 10, blocks: 4, usage: { seeds: 0, water: 0, energy: 0 }, efficiencyStars: 2 as const }
    expect(isBetterResult(base, null)).toBe(true)
    expect(isBetterResult({ ...base, efficiencyStars: 3 }, base)).toBe(true)
    expect(isBetterResult({ ...base, actions: 8 }, base)).toBe(true)
    expect(isBetterResult({ ...base, actions: 12 }, base)).toBe(false)
  })
})
