import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'

describe('TUTORIAL_STEPS', () => {
  it('follows the approved 15-step order', () => {
    expect(TUTORIAL_STEPS.map((step) => `${step.id}:${step.kind}`)).toEqual([
      'welcome:intro',
      'goal:tour',
      'farm:tour',
      'add:practice',
      'snap:practice',
      'delete:practice',
      'pseudocode:practice',
      'run-stop:practice',
      'step-mode:practice',
      'hints:practice',
      'experiment:practice',
      'console:tour',
      'fix:practice',
      'hud-actions:tour',
      'done:outro',
    ])
  })

  it('gives every practice step an animation, conditions and targets, and every tour step a target', () => {
    for (const step of TUTORIAL_STEPS) {
      if (step.kind === 'practice') {
        expect(step.howTo).toBeTruthy()
        expect(step.done.length).toBeGreaterThan(0)
        expect(step.targets.length).toBeGreaterThan(0)
        expect(step.followUps?.length ?? 0).toBe(step.done.length - 1)
      }
      if (step.kind === 'tour') expect(step.targets.length).toBeGreaterThan(0)
    }
  })

  it('opens the console tab when the console tour starts', () => {
    expect(TUTORIAL_STEPS.find((step) => step.id === 'console')?.onEnterTab).toBe('console')
  })
})
