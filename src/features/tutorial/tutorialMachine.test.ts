import { advanceTutorial, statusSignal, TUTORIAL_STEPS } from '@/features/tutorial/tutorialMachine'
import type { ExecutionSnapshot } from '@/game/execution/types'

const snapshot = (status: ExecutionSnapshot['status'], success = false) =>
  ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as ExecutionSnapshot

describe('tutorialMachine', () => {
  it('has six steps and asks for the Parar button, not Pausar', () => {
    expect(TUTORIAL_STEPS).toHaveLength(6)
    const step = TUTORIAL_STEPS.find((item) => item.id === 'stop')
    expect(step?.text).toContain('Parar')
    expect(TUTORIAL_STEPS.some((item) => item.text.includes('Pausar'))).toBe(false)
  })

  it('advances only on the awaited signal', () => {
    expect(advanceTutorial(1, 'run')).toBe(1)
    expect(advanceTutorial(1, 'blockAdded')).toBe(2)
    expect(advanceTutorial(2, 'blockRemoved')).toBe(3)
    expect(advanceTutorial(3, 'run')).toBe(4)
    expect(advanceTutorial(4, 'pause')).toBe(4)
    expect(advanceTutorial(4, 'stop')).toBe(5)
  })

  it('skips the stop step if the run already ended', () => {
    expect(advanceTutorial(4, 'error')).toBe(5)
  })

  it('finishes on success after the run step', () => {
    expect(advanceTutorial(5, 'success')).toBe(TUTORIAL_STEPS.length)
    expect(advanceTutorial(4, 'success')).toBe(TUTORIAL_STEPS.length)
    expect(advanceTutorial(1, 'success')).toBe(1)
  })

  it('derives signals from status transitions', () => {
    expect(statusSignal('idle', snapshot('running'))).toBe('run')
    expect(statusSignal('running', snapshot('paused'))).toBe('pause')
    expect(statusSignal('paused', snapshot('running'))).toBe('resume')
    expect(statusSignal('running', snapshot('failed'))).toBe('error')
    expect(statusSignal('running', snapshot('finished', true))).toBe('success')
    expect(statusSignal('running', snapshot('finished', false))).toBe('error')
    expect(statusSignal('running', snapshot('idle'))).toBe('stop')
    expect(statusSignal('paused', snapshot('idle'))).toBe('stop')
    expect(statusSignal('running', snapshot('running'))).toBeNull()
  })
})
