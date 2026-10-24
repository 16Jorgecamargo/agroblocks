import { itemsFor } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { missionsOfWorld } from '@/data/worlds'
import { buildDashboard, EMPTY_FILTERS, scoreAssessment, tutorialLabel } from '@/features/dashboard/dashboardModel'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { validSnapshot } from '@/shared/snapshotFixture'

function answers(form: 'pre' | 'post', correct: number) {
  return Object.fromEntries(itemsFor('garden', form).map((item, index) => [item.id, index < correct ? item.correctIndex : (item.correctIndex + 1) % item.options.length]))
}

function run(overrides: Partial<RunSnapshot>): RunSnapshot {
  return { ...validSnapshot, ...overrides }
}

const failed = { ...validSnapshot.attempts[0], id: 'f', missionId: 'garden-02', outcome: 'error' as const, errorCode: 'HIT_OBSTACLE', efficiencyStars: null }

const runs: RunSnapshot[] = [
  run({
    runId: 'run-a1',
    student: { name: 'José da Silva', school: 'Escola Azul' },
    updatedAt: '2026-10-10T10:00:00.000Z',
    tutorial: { status: 'skipped', step: 3, at: 't' },
    attempts: [failed],
    assessments: { ...validSnapshot.assessments, garden: { pre: { world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('pre', 2) }, post: null } },
  }),
  run({
    runId: 'run-a2',
    student: { name: 'jose  da SILVA', school: 'escola azul' },
    updatedAt: '2026-10-12T10:00:00.000Z',
    tutorial: { status: 'completed', step: 15, at: 't' },
    missions: {
      ...validSnapshot.missions,
      'garden-02': { status: 'completed', attempts: 2, bestResult: { actions: 8, blocks: 8, usage: { seeds: 0, water: 0, energy: 8 }, efficiencyStars: 2 }, hintsUsed: 1, errorCounts: { HIT_OBSTACLE: 1 } },
    },
    assessments: { ...validSnapshot.assessments, garden: { pre: null, post: { world: 'garden', form: 'post', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('post', 4) } } },
  }),
  run({ runId: 'run-b1', student: { name: 'Bia Lima', school: 'Escola Verde' }, updatedAt: '2026-10-11T10:00:00.000Z', tutorial: null }),
]

describe('dashboard model', () => {
  it('scores assessments and labels tutorial outcomes', () => {
    expect(scoreAssessment({ world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('pre', 3) })).toBe(3)
    expect(scoreAssessment({ world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: true, answers: {} })).toBeNull()
    expect(scoreAssessment(null)).toBeNull()
    expect(tutorialLabel({ status: 'completed', step: 15, at: 't' })).toBe('Concluído')
    expect(tutorialLabel({ status: 'skipped', step: 3, at: 't' })).toBe('Pulado na etapa 3 de 15')
    expect(tutorialLabel(null)).toBe('Não terminado')
  })

  it('groups runs of the same student across accents, case and spaces', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.students).toHaveLength(2)
    const jose = model.students.find((row) => row.runCount === 2)
    expect(jose).toMatchObject({ name: 'jose da SILVA', school: 'escola azul', completedMissions: 1, attempts: 2, errors: 1, hints: 1 })
    expect(jose?.worlds.garden).toMatchObject({ pre: 2, post: 4 })
    expect(jose?.tutorial?.status).toBe('completed')
    expect(jose?.runs.map((item) => item.runId)).toEqual(['run-a2', 'run-a1'])
  })

  it('summarizes, filters and lists schools', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.schools).toHaveLength(3)
    expect(model.schools).toContain('Escola Verde')
    expect(model.summary).toMatchObject({ students: 2, runs: 3, attempts: 3, tutorial: { completed: 1, skipped: 0, unfinished: 1 }, avgGain: 2 })
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, search: 'BIA' }).students.map((row) => row.name)).toEqual(['Bia Lima'])
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, school: 'Escola Verde' }).summary.students).toBe(1)
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, from: '2026-10-11', to: '2026-10-11' }).summary.runs).toBe(1)
  })

  it('tells, per phase, whether each student has not started, is trying or finished', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    const jose = model.students.find((row) => row.runCount === 2)
    const bia = model.students.find((row) => row.name === 'Bia Lima')
    expect(jose?.plots['garden-02']).toEqual({ state: 'done', attempts: 1, stars: 2, hints: 1 })
    expect(jose?.plots['m0-training']).toMatchObject({ state: 'done', stars: 3 })
    expect(jose?.plots['cornfield-02']).toEqual({ state: 'empty', attempts: 0, stars: 0, hints: 0 })
    expect(bia?.plots['garden-02'].state).toBe('empty')
    const trying = buildDashboard([run({ runId: 'run-c1', student: { name: 'Caio Prado', school: 'Escola Azul' }, attempts: [failed] })], MISSIONS, EMPTY_FILTERS)
    expect(trying.students[0].plots['garden-02']).toEqual({ state: 'trying', attempts: 1, stars: 0, hints: 0 })
  })

  it('scores the tests of each world', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    const garden = model.worldRows.find((row) => row.world === 'garden')
    expect(garden).toMatchObject({ name: 'Horta', pre: 2, post: 4 })
    expect(model.summary.avgGain).toBe(2)
  })

  it('counts missions per world and marks finished worlds', () => {
    const gardenIds = missionsOfWorld('garden', MISSIONS).map((mission) => mission.id)
    const cornIds = missionsOfWorld('cornfield', MISSIONS).slice(0, 3).map((mission) => mission.id)
    const completed = { status: 'completed' as const, attempts: 1, bestResult: { actions: 1, blocks: 1, usage: { seeds: 0, water: 0, energy: 1 }, efficiencyStars: 3 as const }, hintsUsed: 0, errorCounts: {} }
    const missions = Object.fromEntries([...gardenIds, ...cornIds].map((id) => [id, completed]))
    const assessments = { ...validSnapshot.assessments, garden: { pre: null, post: { world: 'garden' as const, form: 'post' as const, startedAt: 's', completedAt: 'c', skipped: false, answers: answers('post', 5) } } }
    const model = buildDashboard([run({ runId: 'run-d1', student: { name: 'Dani Reis', school: 'Escola Azul' }, missions, assessments })], MISSIONS, EMPTY_FILTERS)
    const dani = model.students[0]
    expect(dani.worlds.garden).toMatchObject({ completed: 5, state: 'done' })
    expect(dani.worlds.cornfield).toMatchObject({ completed: 3, state: 'trying' })
    expect(dani.worlds.orchard).toMatchObject({ completed: 0, state: 'empty' })
    expect(dani).toMatchObject({ worldsDone: 1, completedMissions: 8 })
    expect(model.worldRows.find((row) => row.world === 'garden')?.finished).toBe(1)
  })

  it('does not count a world as finished before its post-test', () => {
    const completed = { status: 'completed' as const, attempts: 1, bestResult: { actions: 1, blocks: 1, usage: { seeds: 0, water: 0, energy: 1 }, efficiencyStars: 3 as const }, hintsUsed: 0, errorCounts: {} }
    const missions = Object.fromEntries(missionsOfWorld('cornfield', MISSIONS).map((mission) => [mission.id, completed]))
    const model = buildDashboard([run({ runId: 'run-e1', student: { name: 'Eva Melo', school: 'Escola Azul' }, missions })], MISSIONS, EMPTY_FILTERS)
    const eva = model.students[0]
    expect(eva.worlds.cornfield).toMatchObject({ completed: 5, state: 'trying', post: null })
    expect(eva.worldsDone).toBe(0)
    expect(model.worldRows.find((row) => row.world === 'cornfield')?.finished).toBe(0)
  })

  it('lists the most common errors', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.topErrors[0]).toMatchObject({ code: 'HIT_OBSTACLE', count: 1 })
    expect(model.topErrors[0].label).toMatch(/obstáculo|pedra|bateu/i)
  })
})
