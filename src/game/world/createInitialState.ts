import { MapParseError, parseMap } from '@/game/world/mapParser'
import { getCell, isInside, isWalkable } from '@/game/world/grid'
import type { GameState, WorldResources, WorldSetup } from '@/game/world/types'

export const UNLIMITED_RESOURCES: WorldResources = {
  seeds: null,
  water: null,
  energy: null,
  seedCapacity: null,
  waterCapacity: null,
}

export function createInitialState(setup: WorldSetup): GameState {
  const map = parseMap(setup.map.cells)
  const { robot, resources } = setup
  if (!isInside(map, robot) || !isWalkable(getCell(map, robot))) {
    throw new MapParseError(`Posição inicial do robô inválida: (${robot.x}, ${robot.y})`)
  }
  return {
    width: map.width,
    height: map.height,
    cells: map.cells,
    robot: { ...robot },
    resources: { seeds: resources.seeds, water: resources.water, energy: resources.energy, harvested: 0 },
    capacity: { seeds: resources.seedCapacity, water: resources.waterCapacity },
    usage: { seeds: 0, water: 0, energy: 0 },
    actionCount: 0,
  }
}
