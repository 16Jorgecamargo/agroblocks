import { DEFAULT_STEP_LIMIT, interpret, type ActionFeedback, type ExecOutcome, type ExecStep } from '@/blocks/interpreter/interpreter'
import type { Program } from '@/blocks/interpreter/ast'
import { applyAction } from '@/game/rules/applyAction'
import type { GameEvent, GameState, WorldRules } from '@/game/world/types'

export interface RunResult {
  state: GameState
  outcome: ExecOutcome
  steps: ExecStep[]
  events: GameEvent[]
}

export function runProgram(
  program: Program,
  initialState: GameState,
  rules: WorldRules,
  stepLimit: number = DEFAULT_STEP_LIMIT,
): RunResult {
  let state = initialState
  const steps: ExecStep[] = []
  const events: GameEvent[] = []
  const generator = interpret(program, { read: () => state, stepLimit })
  let feedback: ActionFeedback | undefined
  for (;;) {
    const next = generator.next(feedback)
    feedback = undefined
    if (next.done) return { state, outcome: next.value, steps, events }
    steps.push(next.value)
    if (next.value.type === 'action') {
      const result = applyAction(state, next.value.action, rules)
      events.push(...result.events)
      if (result.error) {
        feedback = { ok: false, error: result.error }
      } else {
        state = result.state
        feedback = { ok: true }
      }
    }
  }
}
