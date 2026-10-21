import { FEATURE_FOOTPRINTS, TALL_FEATURES } from '@/render/world/worldCatalog'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { FeatureKind, GroundPatch, Rect, Vec2 } from '@/render/world/worldTypes'

export type Side = 'minX' | 'maxX' | 'minZ' | 'maxZ'

export interface BedPlotOptions {
  crops: FeatureKind[]
  along?: 'x' | 'z'
  soil?: string
  step?: [number, number]
  stages?: [number, number]
}

const WALK = '#a88d66'
const SEGMENT = 1

export function bedPlot(draft: WorldDraft, rect: Rect, random: () => number, options: BedPlotOptions): GroundPatch {
  const along = options.along ?? 'x'
  const [stepAlong, stepAcross] = options.step ?? [1.75, 1.2]
  const [low, high] = options.stages ?? [0.86, 1.04]
  const width = rect.maxX - rect.minX
  const depth = rect.maxZ - rect.minZ
  const length = along === 'x' ? width : depth
  const across = along === 'x' ? depth : width
  const columns = Math.max(1, Math.floor(length / stepAlong))
  const rows = Math.max(1, Math.floor(across / stepAcross))
  const padAlong = (length - columns * stepAlong) / 2
  const padAcross = (across - rows * stepAcross) / 2
  const offset = Math.floor(random() * options.crops.length)
  for (let row = 0; row < rows; row += 1) {
    const crop = options.crops[(row + offset) % options.crops.length]
    const split = columns > 3 && random() < 0.3 ? options.crops[(row + offset + 1) % options.crops.length] : crop
    for (let column = 0; column < columns; column += 1) {
      const a = padAlong + (column + 0.5) * stepAlong
      const b = padAcross + (row + 0.5) * stepAcross
      const point = along === 'x' ? { x: rect.minX + a, z: rect.minZ + b } : { x: rect.minX + b, z: rect.minZ + a }
      const kind = column >= columns / 2 ? split : crop
      const scale = low + random() * (high - low)
      if (draft.clearOfRoutes(point, FEATURE_FOOTPRINTS[kind] * scale, TALL_FEATURES.has(kind))) draft.forceFeature(kind, point, along === 'x' ? 0 : Math.PI / 2, scale)
    }
  }
  return { rect, color: options.soil ?? WALK }
}

export function edgeRun(draft: WorldDraft, kind: 'hedge' | 'stoneWall' | 'meshFence' | 'woodFence', from: Vec2, to: Vec2, gaps: Vec2[] = [], gapRadius = 1.1): void {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const length = Math.hypot(dx, dz)
  const segments = Math.max(1, Math.round(length / SEGMENT))
  const rotation = Math.atan2(-dz, dx)
  for (let index = 0; index < segments; index += 1) {
    const t = (index + 0.5) / segments
    const point = { x: from.x + dx * t, z: from.z + dz * t }
    if (gaps.some((gap) => Math.hypot(gap.x - point.x, gap.z - point.z) <= gapRadius)) continue
    if (kind === 'woodFence') draft.force('fence', point, rotation, length / segments)
    else draft.forceFeature(kind, point, rotation, 1)
  }
}

export function sideOf(rect: Rect, side: Side, margin = 0): [Vec2, Vec2] {
  if (side === 'minX') return [{ x: rect.minX - margin, z: rect.minZ - margin }, { x: rect.minX - margin, z: rect.maxZ + margin }]
  if (side === 'maxX') return [{ x: rect.maxX + margin, z: rect.minZ - margin }, { x: rect.maxX + margin, z: rect.maxZ + margin }]
  if (side === 'minZ') return [{ x: rect.minX - margin, z: rect.minZ - margin }, { x: rect.maxX + margin, z: rect.minZ - margin }]
  return [{ x: rect.minX - margin, z: rect.maxZ + margin }, { x: rect.maxX + margin, z: rect.maxZ + margin }]
}

export function edgeSides(draft: WorldDraft, kind: 'hedge' | 'stoneWall' | 'meshFence' | 'woodFence', rect: Rect, sides: Side[], margin = 0.45, gaps: Vec2[] = []): void {
  for (const side of sides) {
    const [from, to] = sideOf(rect, side, margin)
    edgeRun(draft, kind, from, to, gaps)
  }
}

export function channel(rect: Rect): Vec2[] {
  return [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
}
