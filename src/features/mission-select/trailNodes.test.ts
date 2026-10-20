import { MISSIONS } from '@/data/missions'
import { nodeState, trailNodes } from '@/features/mission-select/trailNodes'
import { createInitialSave, recordAttempt, storeAssessment } from '@/game/progress/progression'

const refs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))
const pre = { world: 'garden' as const, form: 'pre' as const, startedAt: 's', completedAt: 'c', skipped: false, answers: {} }

describe('trail nodes', () => {
  it('lists the pre-test, the ten missions in slot order and the post-test', () => {
    const nodes = trailNodes('garden', MISSIONS)
    expect(nodes).toHaveLength(12)
    expect(nodes[0]).toEqual({ kind: 'preTest' })
    expect(nodes[11]).toEqual({ kind: 'postTest' })
    expect(nodes.slice(1, 11).map((node) => (node.kind === 'mission' ? node.mission.slot : null))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('marks the current step and what is done or locked', () => {
    const nodes = trailNodes('garden', MISSIONS)
    let save = createInitialSave(refs, 'now')
    expect(nodeState(save, 'garden', nodes[0], refs)).toBe('current')
    expect(nodeState(save, 'garden', nodes[1], refs)).toBe('locked')
    expect(nodeState(save, 'garden', nodes[11], refs)).toBe('locked')
    save = storeAssessment(save, pre, refs)
    expect(nodeState(save, 'garden', nodes[0], refs)).toBe('done')
    expect(nodeState(save, 'garden', nodes[1], refs)).toBe('current')
    save = recordAttempt(save, { missionId: 'garden-01', timestamp: 't', outcome: 'success', errorCode: null, actions: 1, blocks: 1, usage: { seeds: 0, water: 0, energy: 1 }, efficiencyStars: 3, pseudocode: '' }, refs)
    expect(nodeState(save, 'garden', nodes[1], refs)).toBe('done')
    expect(nodeState(save, 'garden', nodes[2], refs)).toBe('current')
    expect(nodeState(save, 'cornfield', trailNodes('cornfield', MISSIONS)[0], refs)).toBe('locked')
  })
})
