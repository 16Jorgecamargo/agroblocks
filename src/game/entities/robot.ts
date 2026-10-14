import type { Facing, Position, Robot } from '@/game/world/types'

const CLOCKWISE: Facing[] = ['N', 'E', 'S', 'W']

export const FACING_DELTA: Record<Facing, Position> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
}

export function rotateRight(facing: Facing): Facing {
  return CLOCKWISE[(CLOCKWISE.indexOf(facing) + 1) % 4]
}

export function rotateLeft(facing: Facing): Facing {
  return CLOCKWISE[(CLOCKWISE.indexOf(facing) + 3) % 4]
}

export function positionAhead(robot: Robot): Position {
  const delta = FACING_DELTA[robot.facing]
  return { x: robot.x + delta.x, y: robot.y + delta.y }
}
