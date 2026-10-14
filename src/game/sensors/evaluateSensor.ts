import { positionAhead } from '@/game/entities/robot'
import { getCell, isInside, isWalkable } from '@/game/world/grid'
import type { GameState, SensorType } from '@/game/world/types'

export function evaluateSensor(state: GameState, sensor: SensorType): boolean {
  const cell = getCell(state, state.robot)
  const isSoil = cell.terrain === 'soil'
  switch (sensor) {
    case 'isPlotEmpty':
      return isSoil && (cell.plot === 'untilled' || cell.plot === 'tilled' || cell.plot === 'harvested')
    case 'isSoilDry':
      return isSoil && cell.moisture === 'dry'
    case 'isPlantMature':
      return isSoil && cell.plot === 'mature'
    case 'isObstacleAhead': {
      const ahead = positionAhead(state.robot)
      return !isInside(state, ahead) || !isWalkable(getCell(state, ahead))
    }
    case 'hasSeeds':
      return state.resources.seeds === null || state.resources.seeds > 0
  }
}
