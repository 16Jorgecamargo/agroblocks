import { createInitialState, UNLIMITED_RESOURCES } from '@/game/world/createInitialState'
import type { GameState, Robot, WorldResources } from '@/game/world/types'

export function makeState(
  rows: string[],
  robot: Partial<Robot> = {},
  resources: Partial<WorldResources> = {},
): GameState {
  return createInitialState({
    map: { cells: rows },
    robot: { x: 0, y: 0, facing: 'E', ...robot },
    resources: { ...UNLIMITED_RESOURCES, ...resources },
  })
}
