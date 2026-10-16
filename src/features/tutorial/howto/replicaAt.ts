import type { HandMode, HowToSegment, Point, ReplicaState } from '@/features/tutorial/howto/howtoTypes'

export const DEFAULT_REPLICA: ReplicaState = {
  toolboxOpen: false,
  stack: [],
  dragging: null,
  trashOpen: false,
  selected: null,
  highlight: null,
  keyDown: false,
  run: 'idle',
  stepMode: false,
  robotCell: 0,
  robotHit: false,
  harvested: false,
  tab: 'console',
  consoleLines: [],
  hintsShown: 0,
}

function easeInOutSine(value: number): number {
  return -(Math.cos(Math.PI * value) - 1) / 2
}

export function replicaAt(segment: HowToSegment, timeMs: number): { state: ReplicaState; hand: Point & { mode: HandMode } } {
  let state: ReplicaState = { ...DEFAULT_REPLICA, ...segment.initial }
  const beats = segment.beats
  let current = beats[0]
  let next = beats[1]
  for (let index = 0; index < beats.length; index += 1) {
    const beat = beats[index]
    if (beat.at > timeMs) break
    if (beat.set) state = { ...state, ...beat.set }
    current = beat
    next = beats[index + 1]
  }
  if (!current) return { state, hand: { x: 0, y: 0, mode: 'idle' } }
  if (!next || timeMs < current.at) return { state, hand: { ...current.hand } }
  const progress = easeInOutSine((timeMs - current.at) / (next.at - current.at))
  return {
    state,
    hand: {
      x: current.hand.x + (next.hand.x - current.hand.x) * progress,
      y: current.hand.y + (next.hand.y - current.hand.y) * progress,
      mode: current.hand.mode,
    },
  }
}
