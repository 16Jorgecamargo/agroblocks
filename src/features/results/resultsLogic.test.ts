import { latestSuccess, nextStep, previousBestBefore, referenceStats } from '@/features/results/resultsLogic'
import { createInitialSave, recordAttempt } from '@/game/progress/progression'
import { getMission, MISSIONS } from '@/data/missions'
import type { AttemptInput } from '@/game/progress/types'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))
const base = (actions: number, outcome: AttemptInput['outcome'] = 'success'): AttemptInput => ({
  missionId: 'm2-row-planting',
  timestamp: '2026-10-14T12:00:00.000Z',
  outcome,
  errorCode: null,
  actions,
  blocks: 4,
  usage: { seeds: 6, water: 0, energy: actions },
  efficiencyStars: outcome === 'success' ? 3 : null,
  pseudocode: 'x',
})

describe('resultsLogic', () => {
  it('finds the latest success and the best success before it', () => {
    let save = createInitialSave(refs, 'now')
    save = recordAttempt(save, base(18), refs)
    save = recordAttempt(save, base(30, 'error'), refs)
    save = recordAttempt(save, base(20), refs)
    const latest = latestSuccess(save, 'm2-row-planting')
    expect(latest?.attemptNumber).toBe(3)
    expect(latest && previousBestBefore(save, latest)?.actions).toBe(18)
  })

  it('computes reference stats by running the reference solution', () => {
    const mission = getMission('m2-row-planting')
    if (!mission) throw new Error('missing')
    const stats = referenceStats(mission)
    expect(stats.actions).toBe(18)
    expect(stats.pseudocode).toContain('repita 6 vezes')
  })

  it('points to the next mission, or to the final assessment after the last one', () => {
    const save = createInitialSave(refs, 'now')
    const second = getMission('m2-row-planting')
    const last = getMission('m6-efficient-farm')
    if (!second || !last) throw new Error('missing')
    expect(nextStep(second, save)).toEqual({ label: 'Próxima fase', to: '/jogar/m3-smart-irrigation' })
    expect(nextStep(last, save)).toEqual({ label: 'Fazer avaliação final', to: '/avaliacao/pos' })
    expect(nextStep(last, { ...save, assessments: { pre: null, post: { form: 'post', startedAt: '', completedAt: '', skipped: false, answers: {} } } })).toEqual({
      label: 'Voltar às missões',
      to: '/missoes',
    })
  })
})
