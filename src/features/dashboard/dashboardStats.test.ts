import { computeDashboard } from '@/features/dashboard/dashboardStats'
import { createDemoSave } from '@/features/dashboard/demoData'
import { MISSIONS } from '@/data/missions'
import { createInitialSave, recordAttempt, registerHint, storeAssessment } from '@/game/progress/progression'
import type { AttemptInput } from '@/game/progress/types'
import { itemsForForm } from '@/data/assessment/items'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))
const attempt = (missionId: string, outcome: AttemptInput['outcome'], errorCode: AttemptInput['errorCode'] = null): AttemptInput => ({
  missionId,
  timestamp: '2026-10-14T12:00:00.000Z',
  outcome,
  errorCode,
  actions: 10,
  blocks: 5,
  usage: { seeds: 1, water: 1, energy: 9 },
  efficiencyStars: outcome === 'success' ? 2 : null,
  pseudocode: '',
})

describe('computeDashboard', () => {
  it('reports no data for a fresh save', () => {
    const stats = computeDashboard(createInitialSave(refs, 'now'), MISSIONS)
    expect(stats.hasData).toBe(false)
    expect(stats.totalPhases).toBe(6)
    expect(stats.completionRate).toBe(0)
  })

  it('aggregates attempts, errors, hints and concepts from real records', () => {
    let save = createInitialSave(refs, 'now')
    save = recordAttempt(save, attempt('m1-first-harvest', 'error', 'HIT_OBSTACLE'), refs)
    save = recordAttempt(save, attempt('m1-first-harvest', 'error', 'HIT_OBSTACLE'), refs)
    save = registerHint(save, 'm1-first-harvest')
    save = recordAttempt(save, attempt('m1-first-harvest', 'success'), refs)
    save = recordAttempt(save, attempt('m2-row-planting', 'error', 'NO_SEEDS'), refs)
    const stats = computeDashboard(save, MISSIONS)
    expect(stats.hasData).toBe(true)
    expect(stats.completedPhases).toBe(1)
    expect(stats.completionRate).toBeCloseTo(1 / 6)
    expect(stats.totalAttempts).toBe(4)
    expect(stats.totalHints).toBe(1)
    expect(stats.topErrors[0]).toMatchObject({ code: 'HIT_OBSTACLE', count: 2 })
    const row = stats.missions.find((mission) => mission.missionId === 'm1-first-harvest')
    expect(row).toMatchObject({ attempts: 3, successes: 1, errors: 2, hintsUsed: 1, bestActions: 10, bestStars: 2 })
    const sequencing = stats.concepts.find((concept) => concept.concept === 'sequencing')
    expect(sequencing).toMatchObject({ attempts: 3 })
    expect(sequencing?.successRate).toBeCloseTo(1 / 3)
  })

  it('reports assessment percentages per concept', () => {
    let save = createInitialSave(refs, 'now')
    const answers = Object.fromEntries(itemsForForm('pre').map((item) => [item.id, item.correctIndex]))
    save = storeAssessment(save, { form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers })
    const stats = computeDashboard(save, MISSIONS)
    expect(stats.assessment.find((row) => row.concept === 'repetition')).toMatchObject({ pre: 100, post: null })
    expect(stats.hasData).toBe(true)
  })

  it('creates deterministic demo data', () => {
    expect(createDemoSave(MISSIONS)).toEqual(createDemoSave(MISSIONS))
    expect(computeDashboard(createDemoSave(MISSIONS), MISSIONS).hasData).toBe(true)
  })
})
