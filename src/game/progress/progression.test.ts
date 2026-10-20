import {
  assignStudent,
  continueMissionId,
  createInitialSave,
  currentWorld,
  isWorldOpen,
  refreshUnlocks,
  storeAssessment,
  worldStep,
  failedAttempts,
  hasProgress,
  isBetterResult,
  recordAttempt,
  recordTutorial,
  registerHint,
  storeProgram,
  syncMissions,
} from '@/game/progress/progression'
import { MISSIONS } from '@/data/missions'
import { missionsOfWorld } from '@/data/worlds'
import type { AssessmentForm, AssessmentResponse, AttemptInput, MissionRef, SaveData } from '@/game/progress/types'
import { WORLD_IDS, type WorldId } from '@/game/worlds/worldTypes'

const missions: MissionRef[] = [
  { id: 'a', order: 0, world: null },
  { id: 'b', order: 1, world: 'garden' },
  { id: 'c', order: 2, world: 'garden' },
  { id: 'd', order: 3, world: 'garden' },
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
    save = storeAssessment(save, { world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: {} }, missions)
    save = recordAttempt(save, attempt('b', 'success'), missions)
    expect(continueMissionId(save, missions)).toBe('c')
  })

  it('continues at the last mission when everything is completed', () => {
    let save = createInitialSave(missions, now)
    for (const mission of missions) save = recordAttempt(save, attempt(mission.id, 'success'), missions)
    expect(continueMissionId(save, missions)).toBe('d')
  })

  it('adds new missions to old saves with the right status', () => {
    const first = recordAttempt(createInitialSave(missions.slice(0, 3), now), attempt('b', 'success'), missions.slice(0, 3))
    const save = recordAttempt(first, attempt('c', 'success'), missions.slice(0, 3))
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

describe('student and tutorial', () => {
  const refs: MissionRef[] = [{ id: 'm0-training', order: 0, world: null }, { id: 'garden-04', order: 1, world: 'garden' }]

  it('starts with no run, student or tutorial outcome', () => {
    const save = createInitialSave(refs, '2026-10-16T10:00:00.000Z')
    expect(save).toMatchObject({ runId: null, student: null, tutorial: null })
    expect(save).not.toHaveProperty('participantCode')
  })

  it('assigns a cleaned student and a run id', () => {
    const save = assignStudent(createInitialSave(refs, 'now'), { name: '  Ana   Souza ', school: ' Escola  Azul ' }, 'run-1')
    expect(save.student).toEqual({ name: 'Ana Souza', school: 'Escola Azul' })
    expect(save.runId).toBe('run-1')
  })

  it('keeps completed over skipped but lets skipped become completed', () => {
    let save = createInitialSave(refs, 'now')
    save = recordTutorial(save, { status: 'skipped', step: 3, at: 't1' })
    expect(save.tutorial).toEqual({ status: 'skipped', step: 3, at: 't1' })
    save = recordTutorial(save, { status: 'completed', step: 15, at: 't2' })
    expect(save.tutorial?.status).toBe('completed')
    save = recordTutorial(save, { status: 'skipped', step: 4, at: 't3' })
    expect(save.tutorial).toEqual({ status: 'completed', step: 15, at: 't2' })
  })
})

describe('worlds and their tests', () => {
  const REFS: MissionRef[] = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))

  function response(world: WorldId, form: AssessmentForm): AssessmentResponse {
    return { world, form, startedAt: 's', completedAt: 'c', skipped: false, answers: {} }
  }

  function withPre(save: SaveData, world: WorldId): SaveData {
    return storeAssessment(save, response(world, 'pre'), REFS)
  }

  function completeWorld(save: SaveData, world: WorldId): SaveData {
    return missionsOfWorld(world, MISSIONS).reduce((current, mission) => recordAttempt(current, attempt(mission.id, 'success'), REFS), save)
  }

  it('opens the next world only after the previous post-test', () => {
    let save = completeWorld(withPre(createInitialSave(REFS, 'now'), 'garden'), 'garden')
    expect(isWorldOpen(save, 'cornfield', REFS)).toBe(false)
    expect(worldStep(save, 'garden', REFS)).toEqual({ kind: 'postTest' })
    expect(save.missions[missionsOfWorld('cornfield', MISSIONS)[0].id].status).toBe('locked')
    save = storeAssessment(save, response('garden', 'post'), REFS)
    expect(isWorldOpen(save, 'cornfield', REFS)).toBe(true)
    expect(save.missions[missionsOfWorld('cornfield', MISSIONS)[0].id].status).toBe('available')
  })

  it('asks for the pre-test before the first mission of an open world', () => {
    const save = createInitialSave(REFS, 'now')
    expect(worldStep(save, 'garden', REFS)).toEqual({ kind: 'preTest' })
    expect(worldStep(withPre(save, 'garden'), 'garden', REFS)).toEqual({ kind: 'mission', missionId: missionsOfWorld('garden', MISSIONS)[0].id })
  })

  it('points to the post-test when missions are done', () => {
    const save = completeWorld(withPre(createInitialSave(REFS, 'now'), 'garden'), 'garden')
    expect(currentWorld(save, REFS)).toBe('garden')
    expect(worldStep(save, 'garden', REFS)).toEqual({ kind: 'postTest' })
  })

  it('moves to the next world once the post-test is stored', () => {
    const save = storeAssessment(completeWorld(withPre(createInitialSave(REFS, 'now'), 'garden'), 'garden'), response('garden', 'post'), REFS)
    expect(worldStep(save, 'garden', REFS)).toEqual({ kind: 'done' })
    expect(currentWorld(save, REFS)).toBe('cornfield')
  })

  it('never relocks', () => {
    const save = completeWorld(withPre(createInitialSave(REFS, 'now'), 'garden'), 'garden')
    const replayed = missionsOfWorld('garden', MISSIONS)[0].id
    const again = recordAttempt(save, attempt(replayed, 'error'), REFS)
    expect(again.missions[replayed].status).toBe('completed')
    expect(refreshUnlocks(again, REFS).missions[replayed].status).toBe('completed')
  })

  it('keeps the training available and starts with empty tests for every world', () => {
    const save = createInitialSave(REFS, 'now')
    expect(save.version).toBe(2)
    expect(save.missions['m0-training'].status).toBe('available')
    expect(Object.keys(save.assessments)).toEqual([...WORLD_IDS])
    expect(save.assessments.homestead).toEqual({ pre: null, post: null })
  })
})
