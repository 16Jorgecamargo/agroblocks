import { newlyUnlocked } from '@/features/mission-select/unlocks'
import { loadSeenUnlocks, saveSeenUnlocks } from '@/services/storage/seenUnlocks'
import { MISSIONS } from '@/data/missions'
import { createInitialSave, recordAttempt } from '@/game/progress/progression'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))
const ids = MISSIONS.map((mission) => mission.id)

function completed(missionId: string) {
  return recordAttempt(
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
}

describe('unlocks', () => {
  it('ignores missions available from the start', () => {
    expect(newlyUnlocked(createInitialSave(refs, 'now'), ids, [])).toEqual([])
  })

  it('reports a mission unlocked since the last visit', () => {
    expect(newlyUnlocked(completed('m1-first-harvest'), ids, [])).toEqual(['m2-row-planting'])
  })

  it('does not repeat missions already celebrated', () => {
    expect(newlyUnlocked(completed('m1-first-harvest'), ids, ['m2-row-planting'])).toEqual([])
  })

  it('persists seen unlocks', () => {
    saveSeenUnlocks(window.localStorage, ['m2-row-planting'])
    expect(loadSeenUnlocks(window.localStorage)).toEqual(['m2-row-planting'])
    window.localStorage.setItem('agroblocks:seen-unlocks:v1', '{bad')
    expect(loadSeenUnlocks(window.localStorage)).toEqual([])
  })
})
