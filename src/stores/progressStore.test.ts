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

const ana = { name: 'Ana Souza', school: 'Escola Azul' }

describe('progress store runs', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('starts a fresh run with a new id and the student', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    useProgressStore.getState().startRun(ana)
    const first = useProgressStore.getState().save
    expect(first.student).toEqual(ana)
    expect(first.runId).toMatch(/^[0-9a-f-]{36}$/)
    expect(first.missions['m1-first-harvest'].hintsUsed).toBe(0)
    useProgressStore.getState().startRun(ana)
    expect(useProgressStore.getState().save.runId).not.toBe(first.runId)
  })

  it('registers a student on an existing save without losing progress', () => {
    useProgressStore.getState().registerHint('m1-first-harvest')
    useProgressStore.getState().registerStudent(ana)
    const save = useProgressStore.getState().save
    expect(save.missions['m1-first-harvest'].hintsUsed).toBe(1)
    expect(save.runId).not.toBeNull()
    const runId = save.runId
    useProgressStore.getState().registerStudent({ name: 'Ana Maria Souza', school: 'Escola Azul' })
    expect(useProgressStore.getState().save.runId).toBe(runId)
  })

  it('records the tutorial outcome with the current time', () => {
    useProgressStore.getState().recordTutorial('skipped', 3)
    expect(useProgressStore.getState().save.tutorial).toMatchObject({ status: 'skipped', step: 3 })
  })
})
