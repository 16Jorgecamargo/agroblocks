import { DEFAULT_REPLICA, replicaAt } from '@/features/tutorial/howto/replicaAt'
import type { HowToSegment } from '@/features/tutorial/howto/howtoTypes'

const segment: HowToSegment = {
  label: 'Teste',
  caption: 'Legenda',
  duration: 2000,
  initial: { stack: ['mover para frente'] },
  beats: [
    { at: 0, hand: { x: 0, y: 0, mode: 'idle' } },
    { at: 1000, hand: { x: 100, y: 200, mode: 'drag' }, set: { dragging: 'mover para frente', stack: [] } },
    { at: 1500, hand: { x: 100, y: 200, mode: 'idle' }, set: { dragging: null, trashOpen: true } },
  ],
}

describe('replicaAt', () => {
  it('starts from the defaults merged with the segment initial state', () => {
    const { state, hand } = replicaAt(segment, 0)
    expect(state).toEqual({ ...DEFAULT_REPLICA, stack: ['mover para frente'] })
    expect(hand).toEqual({ x: 0, y: 0, mode: 'idle' })
  })

  it('moves the hand smoothly between beats and keeps the earlier beat mode', () => {
    const { hand, state } = replicaAt(segment, 500)
    expect(hand.x).toBeCloseTo(50)
    expect(hand.y).toBeCloseTo(100)
    expect(hand.mode).toBe('idle')
    expect(state.dragging).toBeNull()
  })

  it('applies a beat state change exactly at its time', () => {
    expect(replicaAt(segment, 999).state.dragging).toBeNull()
    expect(replicaAt(segment, 1000).state).toMatchObject({ dragging: 'mover para frente', stack: [] })
    expect(replicaAt(segment, 1000).hand.mode).toBe('drag')
  })

  it('holds the last state after the final beat', () => {
    const { state, hand } = replicaAt(segment, 5000)
    expect(state).toMatchObject({ dragging: null, trashOpen: true, stack: [] })
    expect(hand).toEqual({ x: 100, y: 200, mode: 'idle' })
  })
})
