import type { Vec2 } from '@/render/world/worldTypes'

const LOOP_POINTS = 9
const LOOP_RADIUS = 0.9
const BASE_HEIGHT = 0.6
const HEIGHT_SWING = 0.45

export function butterflyPath(center: Vec2, seed: number): { x: number[]; y: number[]; z: number[] } {
  const x: number[] = []
  const y: number[] = []
  const z: number[] = []
  for (let index = 0; index <= LOOP_POINTS; index += 1) {
    const angle = (index / LOOP_POINTS) * Math.PI * 2 + seed
    const wobble = 0.7 + 0.3 * Math.sin(angle * 2 + seed)
    x.push(center.x + Math.cos(angle) * LOOP_RADIUS * wobble)
    z.push(center.z + Math.sin(angle) * LOOP_RADIUS * wobble)
    y.push(BASE_HEIGHT + HEIGHT_SWING * (0.5 + 0.5 * Math.sin(angle * 3 + seed)))
  }
  return { x, y, z }
}
