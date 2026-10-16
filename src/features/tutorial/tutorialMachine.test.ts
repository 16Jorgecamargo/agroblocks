import { advanceTutorial, nextTutorial, previousTutorial, statusSignal, TUTORIAL_START, type TutorialProgress } from '@/features/tutorial/tutorialMachine'
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'
import type { TutorialSignal } from '@/features/tutorial/tutorialTypes'
import type { ExecutionSnapshot } from '@/game/execution/types'

const indexOf = (id: string) => TUTORIAL_STEPS.findIndex((step) => step.id === id)
const at = (id: string, partial = 0): TutorialProgress => ({ index: indexOf(id), partial, notice: null })
const feed = (progress: TutorialProgress, signals: TutorialSignal[]) => signals.reduce(advanceTutorial, progress)

describe('tutorial machine', () => {
  it('moves through intro and tour steps only with Próximo', () => {
    expect(nextTutorial(TUTORIAL_START).index).toBe(1)
    expect(advanceTutorial(at('goal'), { type: 'blockAdded' })).toEqual(at('goal'))
    expect(nextTutorial(at('goal')).index).toBe(indexOf('farm'))
  })

  it('ignores Próximo on practice steps and on the last step', () => {
    expect(nextTutorial(at('add'))).toEqual(at('add'))
    expect(nextTutorial(at('done'))).toEqual(at('done'))
  })

  it('completes each practice step with its own signal', () => {
    expect(advanceTutorial(at('add'), { type: 'stackSize', size: 1 }).index).toBe(indexOf('snap'))
    expect(advanceTutorial(at('snap'), { type: 'stackSize', size: 1 })).toEqual(at('snap'))
    expect(advanceTutorial(at('snap'), { type: 'stackSize', size: 2 }).index).toBe(indexOf('delete'))
    expect(advanceTutorial(at('delete'), { type: 'blockRemoved' }).index).toBe(indexOf('pseudocode'))
    expect(advanceTutorial(at('pseudocode'), { type: 'tabOpened', tab: 'hints' })).toEqual(at('pseudocode'))
    expect(advanceTutorial(at('pseudocode'), { type: 'tabOpened', tab: 'pseudocode' }).index).toBe(indexOf('run-stop'))
    expect(advanceTutorial(at('experiment'), { type: 'error' }).index).toBe(indexOf('console'))
    expect(advanceTutorial(at('fix'), { type: 'success' }).index).toBe(indexOf('hud-actions'))
  })

  it('keeps partial progress for ordered conditions', () => {
    const halfway = advanceTutorial(at('run-stop'), { type: 'run' })
    expect(halfway).toEqual(at('run-stop', 1))
    expect(advanceTutorial(at('run-stop'), { type: 'stop' })).toEqual(at('run-stop'))
    expect(advanceTutorial(halfway, { type: 'stop' }).index).toBe(indexOf('step-mode'))
    expect(feed(at('step-mode'), [{ type: 'stepModeOn' }, { type: 'stepped' }, { type: 'stop' }]).index).toBe(indexOf('hints'))
    expect(feed(at('hints'), [{ type: 'tabOpened', tab: 'hints' }, { type: 'hintRevealed' }]).index).toBe(indexOf('experiment'))
  })

  it('explains an early finish at Executar e Parar and starts the step over', () => {
    const finished = feed(at('run-stop'), [{ type: 'run' }, { type: 'error' }])
    expect(finished.index).toBe(indexOf('run-stop'))
    expect(finished.partial).toBe(0)
    expect(finished.notice).toContain('terminou antes')
    const cleared = advanceTutorial(finished, { type: 'run' })
    expect(cleared).toEqual(at('run-stop', 1))
  })

  it('does not skip ahead when the mission succeeds during the experiment', () => {
    const early = advanceTutorial(at('experiment'), { type: 'success' })
    expect(early.index).toBe(indexOf('experiment'))
    expect(early.notice).toContain('já colheu')
    expect(advanceTutorial(at('add'), { type: 'success' })).toEqual(at('add'))
  })

  it('goes back one step and clears partial progress and notices', () => {
    expect(previousTutorial({ index: indexOf('run-stop'), partial: 1, notice: 'x' })).toEqual(at('pseudocode'))
    expect(previousTutorial(TUTORIAL_START)).toEqual(TUTORIAL_START)
  })
})

describe('statusSignal', () => {
  const snap = (status: ExecutionSnapshot['status'], success = false) =>
    ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as unknown as ExecutionSnapshot

  it('turns execution status changes into signals', () => {
    expect(statusSignal('idle', snap('running'))).toEqual({ type: 'run' })
    expect(statusSignal('running', snap('idle'))).toEqual({ type: 'stop' })
    expect(statusSignal('paused', snap('idle'))).toEqual({ type: 'stop' })
    expect(statusSignal('running', snap('failed'))).toEqual({ type: 'error' })
    expect(statusSignal('running', snap('finished', true))).toEqual({ type: 'success' })
    expect(statusSignal('running', snap('running'))).toBeNull()
  })
})

describe('review fixes', () => {
  const snap = (status: ExecutionSnapshot['status'], success = false) =>
    ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as unknown as ExecutionSnapshot

  it('tells a crash apart from a program that ends without harvesting', () => {
    expect(statusSignal('running', snap('failed'))).toEqual({ type: 'error' })
    expect(statusSignal('running', snap('finished', false))).toEqual({ type: 'incomplete' })
    expect(statusSignal('idle', snap('paused'))).toEqual({ type: 'run' })
  })

  it('completes the experiment only when the robot really crashes', () => {
    const early = advanceTutorial(at('experiment'), { type: 'incomplete' })
    expect(early.index).toBe(indexOf('experiment'))
    expect(early.notice).toContain('parou antes da pedra')
    expect(advanceTutorial(at('experiment'), { type: 'error' }).index).toBe(indexOf('console'))
  })

  it('counts an incomplete run as finishing before Parar', () => {
    expect(feed(at('run-stop'), [{ type: 'run' }, { type: 'incomplete' }]).notice).toContain('terminou antes')
  })

  it('finishes Passo a passo only after Parar, so the editor is unlocked for the next steps', () => {
    const stepped = feed(at('step-mode'), [{ type: 'stepModeOn' }, { type: 'stepped' }])
    expect(stepped).toEqual(at('step-mode', 2))
    expect(advanceTutorial(stepped, { type: 'stop' }).index).toBe(indexOf('hints'))
  })

  it('adds a block only once it is snapped into the program', () => {
    expect(advanceTutorial(at('add'), { type: 'blockAdded' })).toEqual(at('add'))
    expect(advanceTutorial(at('add'), { type: 'stackSize', size: 1 }).index).toBe(indexOf('snap'))
  })
})
