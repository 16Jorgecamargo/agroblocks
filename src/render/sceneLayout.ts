import type { Facing } from '@/game/world/types'

export interface WorldPoint {
  x: number
  z: number
}

export function cellToWorld(x: number, y: number, width: number, height: number): WorldPoint {
  return { x: x - (width - 1) / 2, z: y - (height - 1) / 2 }
}

export const FACING_YAW: Record<Facing, number> = {
  S: 0,
  E: Math.PI / 2,
  N: Math.PI,
  W: -Math.PI / 2,
}
