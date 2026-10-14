import { createRandom, hashString } from '@/render/seededRandom'

function screenToWorld(horizontal: number, depth: number): [number, number] {
  return [(horizontal + depth) / 2, (depth - horizontal) / 2]
}

export const NODE_POSITIONS: [number, number][] = [0, 1, 2, 3, 4, 5, 6].map((index) =>
  screenToWorld(-12 + index * 4, index % 2 === 0 ? -2.5 : 2.5),
)

export const RIVER_POINTS: [number, number][] = [-16, -11, -6, -1, 4, 9, 14, 18].map((horizontal, index) =>
  screenToWorld(horizontal, 6 + (index % 2 === 0 ? 0.8 : -0.8)),
)

export const BARN_POSITION: [number, number] = screenToWorld(-13, -7)

const STONES_PER_SEGMENT = 3

export function pathStones(): [number, number][] {
  const stones: [number, number][] = []
  for (let index = 0; index < NODE_POSITIONS.length - 1; index += 1) {
    const [x1, z1] = NODE_POSITIONS[index]
    const [x2, z2] = NODE_POSITIONS[index + 1]
    for (let step = 1; step <= STONES_PER_SEGMENT; step += 1) {
      const t = step / (STONES_PER_SEGMENT + 1)
      stones.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t])
    }
  }
  return stones
}

export function mapScenery(seedKey: string, count: number): { x: number; z: number; scale: number; variant: number }[] {
  const random = createRandom(hashString(seedKey))
  const stones = pathStones()
  const items: { x: number; z: number; scale: number; variant: number }[] = []
  for (let tries = 0; tries < count * 20 && items.length < count; tries += 1) {
    const x = (random() * 2 - 1) * 9.5
    const z = (random() * 2 - 1) * 9.5
    if (NODE_POSITIONS.some(([nx, nz]) => Math.hypot(nx - x, nz - z) < 1.4)) continue
    if (RIVER_POINTS.some(([rx, rz]) => Math.hypot(rx - x, rz - z) < 1.2)) continue
    if (stones.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 0.8)) continue
    if (items.some((item) => Math.hypot(item.x - x, item.z - z) < 0.9)) continue
    items.push({ x, z, scale: 0.6 + random() * 0.6, variant: Math.floor(random() * 3) })
  }
  return items
}

export function lockReason(order: number): string {
  return `Conclua a fase ${order - 1} para desbloquear.`
}
