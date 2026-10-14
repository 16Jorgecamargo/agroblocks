import { canSpend, spend } from '@/game/rules/resources'
import { getCell, updateCell } from '@/game/world/grid'
import type { HandlerOutcome } from '@/game/rules/handlerTypes'
import type { Cell, GameState, PlotState, Position, WorldRules } from '@/game/world/types'

function robotPosition(state: GameState): Position {
  return { x: state.robot.x, y: state.robot.y }
}

function changePlot(state: GameState, position: Position, cell: Cell, to: PlotState, extra: Partial<Cell> = {}): HandlerOutcome {
  return {
    state: updateCell(state, position, { plot: to, ...extra }),
    events: [{ type: 'plotChanged', x: position.x, y: position.y, from: cell.plot, to }],
  }
}

export function prepareSoil(state: GameState): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.plot !== 'untilled' && cell.plot !== 'harvested') return { error: 'PLOT_OCCUPIED' }
  return changePlot(state, position, cell, 'tilled', { growth: 0 })
}

export function plant(state: GameState): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.plot === 'seeded' || cell.plot === 'growing' || cell.plot === 'mature') return { error: 'PLOT_OCCUPIED' }
  if (cell.plot !== 'tilled') return { error: 'SOIL_NOT_READY' }
  if (!canSpend(state.resources, 'seeds', 1)) return { error: 'NO_SEEDS' }
  return changePlot(spend(state, 'seeds', 1), position, cell, 'seeded', { growth: 0 })
}

export function water(state: GameState, rules: WorldRules): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.moisture === 'wet' && rules.forbidWaterWet) return { error: 'WATER_WASTED' }
  if (!canSpend(state.resources, 'water', 1)) return { error: 'NO_WATER' }
  return {
    state: updateCell(spend(state, 'water', 1), position, { moisture: 'wet' }),
    events: [{ type: 'moistureChanged', x: position.x, y: position.y, moisture: 'wet' }],
  }
}

export function harvest(state: GameState): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.plot === 'seeded' || cell.plot === 'growing') return { error: 'PLANT_NOT_MATURE' }
  if (cell.plot !== 'mature') return { error: 'NOTHING_TO_HARVEST' }
  const counted = { ...state, resources: { ...state.resources, harvested: state.resources.harvested + 1 } }
  return changePlot(counted, position, cell, 'harvested', { growth: 0 })
}

function refill(state: GameState, key: 'water' | 'seeds'): HandlerOutcome {
  const capacity = state.capacity[key]
  const current = state.resources[key]
  const amount = capacity === null || current === null ? 0 : Math.max(0, capacity - current)
  const value = current === null ? null : current + amount
  return {
    state: { ...state, resources: { ...state.resources, [key]: value } },
    events: [{ type: 'resourcesCollected', resource: key, amount }],
  }
}

export function collectResources(state: GameState): HandlerOutcome {
  const cell = getCell(state, robotPosition(state))
  if (cell.terrain === 'reservoir') return refill(state, 'water')
  if (cell.terrain === 'seedDepot') return refill(state, 'seeds')
  return { error: 'NOT_AT_SUPPLY' }
}
