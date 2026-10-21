import type { ModelId } from '@/render/models/manifest'
import { pointInPolygon } from '@/render/world/geometry'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { Rect, Stain, Vec2, WorldDensity } from '@/render/world/worldTypes'

export interface WoodlandOptions {
  trees: readonly ModelId[]
  gaps?: Vec2[]
  openSides?: ('minX' | 'maxX' | 'minZ' | 'maxZ')[]
  density: WorldDensity
  depth?: number
}

const UNDERGROWTH: readonly ModelId[] = ['bush', 'bush-large', 'bush', 'bush-large', 'fern']
const OPEN_EDGE: readonly ModelId[] = ['bush', 'bush-large', 'bush', 'fern']
const GAP_CLEARANCE = 2.6

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

export function blob(at: Vec2, radiusX: number, radiusZ: number, random: () => number, sides = 9): Vec2[] {
  const turn = random() * Math.PI
  return Array.from({ length: sides }, (_, index) => {
    const angle = turn + (index / sides) * Math.PI * 2
    const wobble = 0.78 + random() * 0.3
    return { x: at.x + Math.cos(angle) * radiusX * wobble, z: at.z + Math.sin(angle) * radiusZ * wobble }
  })
}

export function stain(at: Vec2, radiusX: number, radiusZ: number, color: string, random: () => number): Stain {
  return { points: blob(at, radiusX, radiusZ, random), color }
}

export function rectStain(rect: Rect, color: string, random: () => number, bulge = 0.35): Stain {
  const points: Vec2[] = []
  const corners: Vec2[] = [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
  corners.forEach((corner, index) => {
    const next = corners[(index + 1) % 4]
    for (let step = 0; step < 3; step += 1) {
      const t = step / 3
      const wobble = step === 0 ? -bulge * 0.4 : (random() - 0.3) * bulge
      const dx = next.x - corner.x
      const dz = next.z - corner.z
      const length = Math.hypot(dx, dz) || 1
      points.push({ x: corner.x + dx * t + (dz / length) * wobble, z: corner.z + dz * t - (dx / length) * wobble })
    }
  })
  return { points, color }
}

export function smoothPath(points: Vec2[], samples = 5): Vec2[] {
  if (points.length < 3) return points
  const result: Vec2[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[Math.min(points.length - 1, index + 2)]
    for (let step = 0; step < samples; step += 1) {
      const t = step / samples
      const t2 = t * t
      const t3 = t2 * t
      result.push({
        x: Math.round(0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3) * 1000) / 1000,
        z: Math.round(0.5 * (2 * p1.z + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3) * 1000) / 1000,
      })
    }
  }
  result.push(points[points.length - 1])
  return result
}

function perimeterPoint(rect: Rect, t: number): { point: Vec2; inward: Vec2; side: 'minX' | 'maxX' | 'minZ' | 'maxZ' } {
  const width = rect.maxX - rect.minX
  const depth = rect.maxZ - rect.minZ
  let along = (((t % 1) + 1) % 1) * 2 * (width + depth)
  if (along < width) return { point: { x: rect.minX + along, z: rect.minZ }, inward: { x: 0, z: 1 }, side: 'minZ' }
  along -= width
  if (along < depth) return { point: { x: rect.maxX, z: rect.minZ + along }, inward: { x: -1, z: 0 }, side: 'maxX' }
  along -= depth
  if (along < width) return { point: { x: rect.maxX - along, z: rect.maxZ }, inward: { x: 0, z: -1 }, side: 'maxZ' }
  along -= width
  return { point: { x: rect.minX, z: rect.maxZ - along }, inward: { x: 1, z: 0 }, side: 'minX' }
}

export function woodland(draft: WorldDraft, rect: Rect, random: () => number, options: WoodlandOptions): void {
  const perimeter = 2 * (rect.maxX - rect.minX + rect.maxZ - rect.minZ)
  const depth = options.depth ?? 2.4
  const full = options.density === 'full'
  let along = random() * 2
  while (along < perimeter) {
    const { point, inward, side } = perimeterPoint(rect, along / perimeter)
    const stride = 1.6 + random() * 2.4
    along += stride
    if ((options.gaps ?? []).some((gap) => Math.hypot(gap.x - point.x, gap.z - point.z) < GAP_CLEARANCE)) continue
    const open = (options.openSides ?? []).includes(side)
    if (random() < (open ? 0.3 : 0.08)) continue
    const center = { x: point.x + inward.x * (0.3 + random() * depth * 0.5), z: point.z + inward.z * (0.3 + random() * depth * 0.5) }
    const trees = open ? (random() < 0.45 ? 1 : 0) : 2 + Math.floor(random() * (full ? 4 : 2))
    const shrubs = 2 + Math.floor(random() * (full ? 3 : 1))
    for (let index = 0; index < trees + shrubs; index += 1) {
      const angle = random() * Math.PI * 2
      const tree = index < trees
      const model = tree ? pick(options.trees, random) : pick(open ? OPEN_EDGE : UNDERGROWTH, random)
      const scale = tree ? 0.8 + random() * 0.45 : 0.75 + random() * 0.5
      for (let tries = 0; tries < 4; tries += 1) {
        const reach = random() * (tree ? 1.8 : 2.4)
        const spot = { x: center.x + Math.cos(angle + tries * 1.3) * reach, z: center.z + Math.sin(angle + tries * 1.3) * reach }
        if (draft.place(model, spot, random() * Math.PI * 2, scale)) break
      }
    }
  }
}

export function scatterCover(draft: WorldDraft, area: Vec2[], models: readonly ModelId[], count: number, random: () => number): void {
  const xs = area.map((point) => point.x)
  const zs = area.map((point) => point.z)
  const bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) }
  let placed = 0
  for (let tries = 0; tries < count * 12 && placed < count; tries += 1) {
    const point = { x: bounds.minX + random() * (bounds.maxX - bounds.minX), z: bounds.minZ + random() * (bounds.maxZ - bounds.minZ) }
    if (!pointInPolygon(point, area)) continue
    if (draft.place(pick(models, random), point, random() * Math.PI * 2, 0.75 + random() * 0.5)) placed += 1
  }
}

export function turn(at: Vec2, rotation: number, x: number, z: number): Vec2 {
  return { x: at.x + x * Math.cos(rotation) + z * Math.sin(rotation), z: at.z - x * Math.sin(rotation) + z * Math.cos(rotation) }
}
