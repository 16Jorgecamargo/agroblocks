import { newlyUnlocked } from '@/features/mission-select/unlocks'
import { loadSeenUnlocks, saveSeenUnlocks } from '@/services/storage/seenUnlocks'
import { MISSIONS } from '@/data/missions'
import { createInitialSave, recordAttempt, storeAssessment } from '@/game/progress/progression'

const refs = MISSIONS.map(({ id, order, world }) => ({ id, order, world }))
const ids = MISSIONS.map((mission) => mission.id)

function completed(missionId: string) {
  const done = recordAttempt(
    createInitialSave(refs, 'now'),
    {
      missionId,
      timestamp: 'now',
      outcome: 'success',
      errorCode: null,
      actions: 1,
      blocks: 1,
      usage: { seeds: 0, water: 0, energy: 0 },
      efficiencyStars: 3,
      pseudocode: '',
    },
    refs,
  )
  return storeAssessment(done, { world: 'garden', form: 'post', startedAt: 's', completedAt: 'c', skipped: false, answers: {} }, refs)
}

describe('unlocks', () => {
  it('ignores missions available from the start', () => {
    expect(newlyUnlocked(createInitialSave(refs, 'now'), ids, [])).toEqual([])
  })

  it('reports a mission unlocked since the last visit', () => {
    expect(newlyUnlocked(completed('garden-04'), ids, [])).toEqual(['cornfield-02'])
  })

  it('does not repeat missions already celebrated', () => {
    expect(newlyUnlocked(completed('garden-04'), ids, ['cornfield-02'])).toEqual([])
  })

  it('persists seen unlocks', () => {
    saveSeenUnlocks(window.localStorage, ['cornfield-02'])
    expect(loadSeenUnlocks(window.localStorage)).toEqual(['cornfield-02'])
    window.localStorage.setItem('agroblocks:seen-unlocks:v1', '{bad')
    expect(loadSeenUnlocks(window.localStorage)).toEqual([])
  })
})
