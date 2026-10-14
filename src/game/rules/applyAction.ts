import { createGameError } from '@/game/rules/errors'
import { collectResources, harvest, plant, prepareSoil, water } from '@/game/rules/farmActions'
import { tickWorld } from '@/game/rules/growth'
import { moveForward, turn } from '@/game/rules/movement'
import { canSpend, resourceEvents, spend } from '@/game/rules/resources'
import type { HandlerOutcome } from '@/game/rules/handlerTypes'
import type { ActionResult, ActionType, ErrorCode, GameState, WorldRules } from '@/game/world/types'

export const ENERGY_COST: Record<ActionType, number> = {
  moveForward: 1,
  turnLeft: 0,
  turnRight: 0,
  prepareSoil: 1,
  plant: 1,
  water: 1,
  harvest: 1,
  collectResources: 1,
}

const HANDLERS: Record<ActionType, (state: GameState, rules: WorldRules) => HandlerOutcome> = {
  moveForward: (state) => moveForward(state),
  turnLeft: (state) => turn(state, 'left'),
  turnRight: (state) => turn(state, 'right'),
  prepareSoil: (state) => prepareSoil(state),
  plant: (state) => plant(state),
  water: (state, rules) => water(state, rules),
  harvest: (state) => harvest(state),
  collectResources: (state) => collectResources(state),
}

function failure(state: GameState, code: ErrorCode, rules: WorldRules): ActionResult {
  return { state, events: [], error: createGameError(code, rules.mistakes) }
}

export function applyAction(state: GameState, action: ActionType, rules: WorldRules): ActionResult {
  const cost = ENERGY_COST[action]
  if (cost > 0 && !canSpend(state.resources, 'energy', cost)) return failure(state, 'NO_ENERGY', rules)
  const outcome = HANDLERS[action](state, rules)
  if ('error' in outcome) return failure(state, outcome.error, rules)
  const charged = cost > 0 ? spend(outcome.state, 'energy', cost) : outcome.state
  const counted = { ...charged, actionCount: charged.actionCount + 1 }
  const grown = tickWorld(counted, rules.growTicks)
  return {
    state: grown.state,
    events: [...outcome.events, ...resourceEvents(state.resources, grown.state.resources), ...grown.events],
  }
}
