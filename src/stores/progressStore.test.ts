import { useProgressStore } from '@/stores/progressStore'
import { SAVE_KEY } from '@/services/storage/saveStorage'

describe('progressStore', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('records attempts, persists them and returns the record', () => {
    const record = useProgressStore.getState().recordAttempt({
      missionId: 'm1-first-harvest',
      timestamp: '2026-10-14T12:00:00.000Z',
      outcome: 'success',
      errorCode: null,
      actions: 8,
      blocks: 8,
      usage: { seeds: 0, water: 0, energy: 7 },
      efficiencyStars: 3,
      pseudocode: 'quando executar:',
    })
    expect(record.attemptNumber).toBe(1)
    expect(useProgressStore.getState().save.missions['m2-row-planting'].status).toBe('available')
    expect(window.localStorage.getItem(SAVE_KEY)).toContain('m1-first-harvest')
  })

  it('resets everything', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    useProgressStore.getState().resetProgress()
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].hintsUsed).toBe(0)
  })
})
