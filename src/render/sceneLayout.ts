import { createRandom, hashString } from '@/render/seededRandom'
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

export type DecorationKind = 'tree' | 'pine' | 'rock' | 'bush' | 'fence' | 'barn' | 'windmill' | 'silo'

export interface Decoration {
  kind: DecorationKind
  x: number
  z: number
  rotation: number
  scale: number
  variant: number
}

const FENCE_GAP = 0.95

function fences(width: number, height: number): Decoration[] {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const items: Decoration[] = []
  for (let column = 0; column < width; column += 1) {
    const x = column - (width - 1) / 2
    items.push({ kind: 'fence', x, z: -halfHeight - FENCE_GAP + 0.4, rotation: 0, scale: 1, variant: 0 })
    items.push({ kind: 'fence', x, z: halfHeight + FENCE_GAP - 0.4, rotation: 0, scale: 1, variant: 0 })
  }
  for (let row = 0; row < height; row += 1) {
    const z = row - (height - 1) / 2
    items.push({ kind: 'fence', x: -halfWidth - FENCE_GAP + 0.4, z, rotation: Math.PI / 2, scale: 1, variant: 0 })
    items.push({ kind: 'fence', x: halfWidth + FENCE_GAP - 0.4, z, rotation: Math.PI / 2, scale: 1, variant: 0 })
  }
  return items
}

export function generateDecorations(
  width: number,
  height: number,
  seedKey: string,
  options: { dense: boolean },
): Decoration[] {
  const random = createRandom(hashString(seedKey))
  const halfWidth = width / 2
  const halfHeight = height / 2
  const buildings: Decoration[] = [
    { kind: 'barn', x: -halfWidth - 3.4, z: -halfHeight - 2.4, rotation: Math.PI / 6, scale: 1, variant: 0 },
    { kind: 'windmill', x: halfWidth + 3.2, z: -halfHeight - 2.6, rotation: -Math.PI / 8, scale: 1, variant: 0 },
    { kind: 'silo', x: halfWidth + 2.8, z: halfHeight + 2.6, rotation: 0, scale: 1, variant: 0 },
  ]
  const target = options.dense ? 70 : 22
  const scenery: Decoration[] = []
  const outerX = halfWidth + 8
  const outerZ = halfHeight + 7
  for (let tries = 0; tries < target * 12 && scenery.length < target; tries += 1) {
    const x = (random() * 2 - 1) * outerX
    const z = (random() * 2 - 1) * outerZ
    if (Math.abs(x) < halfWidth + 1.6 && Math.abs(z) < halfHeight + 1.6) continue
    if (buildings.some((building) => Math.hypot(building.x - x, building.z - z) < 2.4)) continue
    if (scenery.some((item) => Math.hypot(item.x - x, item.z - z) < 0.9)) continue
    const roll = random()
    const kind: DecorationKind = roll < 0.5 ? 'tree' : roll < 0.7 ? 'pine' : roll < 0.88 ? 'rock' : 'bush'
    scenery.push({ kind, x, z, rotation: random() * Math.PI * 2, scale: 0.7 + random() * 0.6, variant: Math.floor(random() * 3) })
  }
  return [...fences(width, height), ...buildings, ...scenery]
}
