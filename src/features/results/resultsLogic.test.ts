import { latestSuccess, nextStep, previousBestBefore, referenceStats } from '@/features/results/resultsLogic'
import { createInitialSave, recordAttempt } from '@/game/progress/progression'
import { getMission, MISSIONS } from '@/data/missions'
import type { AttemptInput } from '@/game/progress/types'

const refs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))
const base = (actions: number, outcome: AttemptInput['outcome'] = 'success'): AttemptInput => ({
  missionId: 'cornfield-02',
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
    const latest = latestSuccess(save, 'cornfield-02')
    expect(latest?.attemptNumber).toBe(3)
    expect(latest && previousBestBefore(save, latest)?.actions).toBe(18)
  })

  it('computes reference stats by running the reference solution', () => {
    const mission = getMission('cornfield-02')
    if (!mission) throw new Error('missing')
    const stats = referenceStats(mission)
    expect(stats.actions).toBe(18)
    expect(stats.pseudocode).toContain('repita 6 vezes')
  })

  it('points to the next mission of the world, then to the world post-test', () => {
    const save = createInitialSave(refs, 'now')
    const third = getMission('garden-03')
    const last = getMission('garden-10')
    if (!third || !last) throw new Error('missing')
    expect(nextStep(third, save)).toEqual({ label: 'Próxima missão', to: '/jogar/garden-04' })
    expect(nextStep(last, save)).toEqual({ label: 'Fazer a prova final', to: '/avaliacao/garden/pos' })
    const post = { world: 'garden' as const, form: 'post' as const, startedAt: '', completedAt: '', skipped: false, answers: {} }
    expect(nextStep(last, { ...save, assessments: { ...save.assessments, garden: { pre: null, post } } })).toEqual({ label: 'Voltar às missões', to: '/missoes' })
  })
})
