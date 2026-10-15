import type { ModelId } from '@/render/models/manifest'
import type { PropItem, WorldDensity } from '@/render/world/worldTypes'

export interface Hill {
  x: number
  z: number
  width: number
  height: number
  depth: number
  color: string
}

export const HILL_BASE_Y = -1

const SURFACE_SINK = 0.9
const MIN_HEIGHT = 0.3
const SPACING = 0.9

export const HOME_HILLS: Hill[] = [
  { x: -14, z: -26, width: 16, height: 5, depth: 6, color: '#7fb35a' },
  { x: 2, z: -30, width: 20, height: 6, depth: 6, color: '#8cc065' },
  { x: 18, z: -24, width: 14, height: 5, depth: 6, color: '#76ab52' },
  { x: -24, z: -18, width: 12, height: 4, depth: 6, color: '#88bb60' },
]

const PICKS: [ModelId, number, [number, number]][] = [
  ['pine', 0.3, [0.9, 1.25]],
  ['pine-round', 0.1, [0.9, 1.2]],
  ['tree-a', 0.1, [0.9, 1.2]],
  ['tree-b', 0.1, [0.9, 1.2]],
  ['tree-c', 0.08, [0.9, 1.2]],
  ['tree-d', 0.07, [0.9, 1.2]],
  ['bush', 0.15, [0.9, 1.3]],
  ['rock-a', 0.1, [0.85, 1.1]],
]

export function hillSurfaceY(hill: Hill, x: number, z: number): number {
  const dx = (x - hill.x) / hill.width
  const dz = (z - hill.z) / hill.depth
  const radius = dx * dx + dz * dz
  if (radius >= 1) return -Infinity
  return HILL_BASE_Y + hill.height * Math.sqrt(1 - radius) * SURFACE_SINK
}

function pick(random: () => number): [ModelId, [number, number]] {
  let roll = random()
  for (const [model, weight, range] of PICKS) {
    roll -= weight
    if (roll <= 0) return [model, range]
  }
  const [model, , range] = PICKS[0]
  return [model, range]
}

export function hillScatter(random: () => number, hills: Hill[], density: WorldDensity): PropItem[] {
  const perHill = density === 'full' ? 26 : 10
  const props: PropItem[] = []
  for (const hill of hills) {
    let placed = 0
    for (let tries = 0; tries < perHill * 12 && placed < perHill; tries += 1) {
      const x = hill.x + (random() * 1.8 - 0.9) * hill.width
      const z = hill.z + (random() * 1.25 - 0.3) * hill.depth
      const y = hillSurfaceY(hill, x, z)
      if (y <= MIN_HEIGHT) continue
      if (props.some((prop) => Math.hypot(prop.x - x, prop.z - z) < SPACING)) continue
      const [model, [min, max]] = pick(random)
      props.push({ model, x, z, y, rotation: random() * Math.PI * 2, scale: min + random() * (max - min) })
      placed += 1
    }
  }
  return props
}
