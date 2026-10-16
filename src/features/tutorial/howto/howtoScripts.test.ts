import { HOWTO_SCRIPTS } from '@/features/tutorial/howto/howtoScripts'
import { replicaAt } from '@/features/tutorial/howto/replicaAt'
import { HARVEST, MOVE } from '@/features/tutorial/howto/replicaLayout'
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'

const end = (id: keyof typeof HOWTO_SCRIPTS, segment = 0) => {
  const chosen = HOWTO_SCRIPTS[id].segments[segment]
  return replicaAt(chosen, chosen.lengthMs).state
}

describe('HOWTO_SCRIPTS', () => {
  it('has a script for every practice step', () => {
    for (const step of TUTORIAL_STEPS) if (step.kind === 'practice') expect(HOWTO_SCRIPTS[step.howTo].id).toBe(step.howTo)
  })

  it('keeps beats in time order inside each segment', () => {
    for (const script of Object.values(HOWTO_SCRIPTS)) {
      for (const segment of script.segments) {
        const times = segment.beats.map((beat) => beat.at)
        expect(times).toEqual([...times].sort((a, b) => a - b))
        expect(times.at(-1)).toBeLessThanOrEqual(segment.lengthMs)
      }
    }
  })

  it('ends every segment in the state the gesture produces', () => {
    expect(end('add-block').stack).toEqual([MOVE])
    expect(end('snap-blocks').stack).toEqual([MOVE, MOVE])
    expect(HOWTO_SCRIPTS['delete-block'].segments.map((segment) => segment.label)).toEqual(['Lixeira', 'Biblioteca', 'Delete'])
    for (const index of [0, 1, 2]) expect(end('delete-block', index).stack).toEqual([MOVE])
    expect(end('open-pseudocode').tab).toBe('pseudocode')
    expect(end('run-stop')).toMatchObject({ run: 'idle', robotCell: 0 })
    expect(end('step-mode')).toMatchObject({ stepMode: true, robotCell: 2 })
    expect(end('hints')).toMatchObject({ tab: 'hints', hintsShown: 1 })
    expect(end('error-experiment')).toMatchObject({ robotHit: true, tab: 'console' })
    expect(end('fix')).toMatchObject({ stack: [MOVE, MOVE, HARVEST], harvested: true })
  })

  it('drops the dragged block and closes the trash by the end of every segment', () => {
    for (const script of Object.values(HOWTO_SCRIPTS)) {
      for (const segment of script.segments) {
        const state = replicaAt(segment, segment.lengthMs).state
        expect(state.dragging).toBeNull()
        expect(state.trashOpen).toBe(false)
        expect(state.keyDown).toBe(false)
      }
    }
  })
})
