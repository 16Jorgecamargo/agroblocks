import { positionAhead, rotateLeft, rotateRight } from '@/game/entities/robot'
import { getCell, isInside, isWalkable } from '@/game/world/grid'
import type { HandlerOutcome } from '@/game/rules/handlerTypes'
import type { GameState } from '@/game/world/types'

export function moveForward(state: GameState): HandlerOutcome {
  const target = positionAhead(state.robot)
  if (!isInside(state, target)) return { error: 'OUT_OF_BOUNDS' }
  if (!isWalkable(getCell(state, target))) return { error: 'HIT_OBSTACLE' }
  const from = { x: state.robot.x, y: state.robot.y }
  return {
    state: { ...state, robot: { ...state.robot, x: target.x, y: target.y } },
    events: [{ type: 'robotMoved', from, to: target }],
  }
}

export function turn(state: GameState, direction: 'left' | 'right'): HandlerOutcome {
  const facing = direction === 'left' ? rotateLeft(state.robot.facing) : rotateRight(state.robot.facing)
  return {
    state: { ...state, robot: { ...state.robot, facing } },
    events: [{ type: 'robotTurned', facing }],
  }
}
