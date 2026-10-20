import { itemsForForm } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { buildDashboard, EMPTY_FILTERS, scoreAssessment, tutorialLabel } from '@/features/dashboard/dashboardModel'
import type { RunSnapshot } from '@/shared/runSnapshot'
import { validSnapshot } from '@/shared/snapshotFixture'

function answers(form: 'pre' | 'post', correct: number) {
  return Object.fromEntries(itemsForForm(form).map((item, index) => [item.id, index < correct ? item.correctIndex : item.correctIndex + 1]))
}

function run(overrides: Partial<RunSnapshot>): RunSnapshot {
  return { ...validSnapshot, ...overrides }
}

const failed = { ...validSnapshot.attempts[0], id: 'f', missionId: 'garden-04', outcome: 'error' as const, errorCode: 'HIT_OBSTACLE', efficiencyStars: null }

const runs: RunSnapshot[] = [
  run({
    runId: 'run-a1',
    student: { name: 'José da Silva', school: 'Escola Azul' },
    updatedAt: '2026-10-10T10:00:00.000Z',
    tutorial: { status: 'skipped', step: 3, at: 't' },
    attempts: [failed],
    assessments: { ...validSnapshot.assessments, garden: { pre: { world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('pre', 4) }, post: null } },
  }),
  run({
    runId: 'run-a2',
    student: { name: 'jose  da SILVA', school: 'escola azul' },
    updatedAt: '2026-10-12T10:00:00.000Z',
    tutorial: { status: 'completed', step: 15, at: 't' },
    missions: {
      ...validSnapshot.missions,
      'garden-04': { status: 'completed', attempts: 2, bestResult: { actions: 8, blocks: 8, usage: { seeds: 0, water: 0, energy: 8 }, efficiencyStars: 2 }, hintsUsed: 1, errorCounts: { HIT_OBSTACLE: 1 } },
    },
    assessments: { ...validSnapshot.assessments, garden: { pre: null, post: { world: 'garden', form: 'post', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('post', 9) } } },
  }),
  run({ runId: 'run-b1', student: { name: 'Bia Lima', school: 'Escola Verde' }, updatedAt: '2026-10-11T10:00:00.000Z', tutorial: null }),
]

describe('dashboard model', () => {
  it('scores assessments and labels tutorial outcomes', () => {
    expect(scoreAssessment({ world: 'garden', form: 'pre', startedAt: 's', completedAt: 'c', skipped: false, answers: answers('pre', 7) })).toBe(7)
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
    expect(jose).toMatchObject({ name: 'jose da SILVA', school: 'escola azul', completedPhases: 1, attempts: 2, errors: 1, hints: 1, pre: 4, post: 9, gain: 5 })
    expect(jose?.tutorial?.status).toBe('completed')
    expect(jose?.runs.map((item) => item.runId)).toEqual(['run-a2', 'run-a1'])
  })

  it('summarizes, filters and lists schools', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    expect(model.schools).toHaveLength(3)
    expect(model.schools).toContain('Escola Verde')
    expect(model.summary).toMatchObject({ students: 2, runs: 3, attempts: 3, tutorial: { completed: 1, skipped: 0, unfinished: 1 }, avgGain: 5 })
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, search: 'BIA' }).students.map((row) => row.name)).toEqual(['Bia Lima'])
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, school: 'Escola Verde' }).summary.students).toBe(1)
    expect(buildDashboard(runs, MISSIONS, { ...EMPTY_FILTERS, from: '2026-10-11', to: '2026-10-11' }).summary.runs).toBe(1)
  })

  it('tells, per phase, whether each student has not started, is trying or finished', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    const jose = model.students.find((row) => row.runCount === 2)
    const bia = model.students.find((row) => row.name === 'Bia Lima')
    expect(jose?.plots['garden-04']).toEqual({ state: 'done', attempts: 1, stars: 2, hints: 1 })
    expect(jose?.plots['m0-training']).toMatchObject({ state: 'done', stars: 3 })
    expect(jose?.plots['cornfield-02']).toEqual({ state: 'empty', attempts: 0, stars: 0, hints: 0 })
    expect(bia?.plots['garden-04'].state).toBe('empty')
    const trying = buildDashboard([run({ runId: 'run-c1', student: { name: 'Caio Prado', school: 'Escola Azul' }, attempts: [failed] })], MISSIONS, EMPTY_FILTERS)
    expect(trying.students[0].plots['garden-04']).toEqual({ state: 'trying', attempts: 1, stars: 0, hints: 0 })
  })

  it('computes phases, stars and the most common errors', () => {
    const model = buildDashboard(runs, MISSIONS, EMPTY_FILTERS)
    const first = model.phases.find((row) => row.missionId === 'garden-04')
    expect(first).toMatchObject({ completed: 1, stars: [0, 1, 0] })
    expect(model.topErrors[0]).toMatchObject({ code: 'HIT_OBSTACLE', count: 1 })
    expect(model.topErrors[0].label).toMatch(/obstáculo|pedra|bateu/i)
  })
})
