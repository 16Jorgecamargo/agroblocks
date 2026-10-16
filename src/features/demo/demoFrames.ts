import { interpret, type ActionFeedback } from '@/blocks/interpreter/interpreter'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { toControllerMission } from '@/game/missions/toControllerMission'
import { applyAction } from '@/game/rules/applyAction'
import type { GameEvent, GameState } from '@/game/world/types'

export interface DemoFrame {
  state: GameState
  events: GameEvent[]
}

export interface DemoCursor {
  index: number
  cycle: number
}

export const DEMO_TIMING = {
  startHoldMs: 1100,
  stepMs: 850,
  endHoldMs: 1800,
} as const

export function demoFrames(mission: MissionDefinition): DemoFrame[] {
  if (!mission.briefing.demo) return []
  const { initialState, rules, stepLimit } = toControllerMission(mission)
  let state = initialState
  const frames: DemoFrame[] = [{ state, events: [] }]
  const generator = interpret(mission.referenceSolution, { read: () => state, stepLimit })
  let feedback: ActionFeedback | undefined
  for (;;) {
    const next = generator.next(feedback)
    feedback = undefined
    if (next.done) return frames
    if (next.value.type !== 'action') continue
    const result = applyAction(state, next.value.action, rules)
    if (result.error) {
      frames.push({ state, events: result.events })
      return frames
    }
    state = result.state
    frames.push({ state, events: result.events })
    feedback = { ok: true }
  }
}

export function demoDelayMs(index: number, count: number): number {
  if (index === 0) return DEMO_TIMING.startHoldMs
  if (index >= count - 1) return DEMO_TIMING.endHoldMs
  return DEMO_TIMING.stepMs
}

export function nextDemoFrame(cursor: DemoCursor, count: number): DemoCursor {
  if (cursor.index >= count - 1) return { index: 0, cycle: cursor.cycle + 1 }
  return { index: cursor.index + 1, cycle: cursor.cycle }
}
