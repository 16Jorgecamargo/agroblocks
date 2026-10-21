import type { ModelId } from '@/render/models/manifest'
import { rectDistance } from '@/render/world/geometry'
import { CLUTTER_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { BorderKind, Relief } from '@/render/world/worldStyles'
import { FEATURE_KINDS, type FeatureKind, type GroundPatch, type Mound, type Rect, type Vec2, type WorldDensity } from '@/render/world/worldTypes'

export type { Mound }

export interface Block {
  rect: Rect
  color: string
  height?: number
}

export const CLUTTER_CEILING = { map: 60, farm: 80 }

const GAP_RADIUS = 1.2
const SEGMENT = 1
const WINDBREAK_STEP = 1.6

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

function isFeature(kind: FeatureKind | ModelId): kind is FeatureKind {
  return (FEATURE_KINDS as readonly string[]).includes(kind)
}

function inside(point: Vec2, rect: Rect): boolean {
  return point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ
}

export function cropBlock(draft: WorldDraft, block: Block, feature: FeatureKind, [stepX, stepZ]: [number, number], random: () => number, options: { tints?: string[]; jitter?: number } = {}): GroundPatch {
  const { rect, color, height } = block
  const jitter = options.jitter ?? 0.1
  for (let z = rect.minZ + stepZ / 2; z < rect.maxZ; z += stepZ) {
    for (let x = rect.minX + stepX / 2; x < rect.maxX; x += stepX) {
      const point = {
        x: Math.min(rect.maxX, Math.max(rect.minX, x + (random() * 2 - 1) * jitter)),
        z: Math.min(rect.maxZ, Math.max(rect.minZ, z + (random() * 2 - 1) * jitter)),
      }
      const tint = options.tints ? pick(options.tints, random) : undefined
      const rotation = feature === 'cornStalk' ? random() * 0.4 - 0.2 : random() * Math.PI * 2
      draft.placeFeature(feature, point, rotation, 1, tint, height ?? 0)
    }
  }
  return height === undefined ? { rect, color } : { rect, color, height }
}

export function landmark(draft: WorldDraft, kind: FeatureKind | ModelId, at: Vec2, rotation: number, scale = 1): void {
  if (isFeature(kind)) draft.forceFeature(kind, at, rotation, scale)
  else draft.force(kind, at, rotation, scale)
}

function sides(rect: Rect): [Vec2, Vec2][] {
  return [
    [{ x: rect.minX, z: rect.minZ }, { x: rect.maxX, z: rect.minZ }],
    [{ x: rect.maxX, z: rect.minZ }, { x: rect.maxX, z: rect.maxZ }],
    [{ x: rect.maxX, z: rect.maxZ }, { x: rect.minX, z: rect.maxZ }],
    [{ x: rect.minX, z: rect.maxZ }, { x: rect.minX, z: rect.minZ }],
  ]
}

const MIXED: Exclude<BorderKind, 'mixed'>[] = ['hedge', 'stoneWall', 'woodFence', 'windbreak']

function walkSide(draft: WorldDraft, kind: Exclude<BorderKind, 'mixed'>, from: Vec2, to: Vec2, random: () => number, gaps: Vec2[]): void {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const length = Math.hypot(dx, dz)
  const step = kind === 'windbreak' ? WINDBREAK_STEP : SEGMENT
  const segments = Math.max(1, Math.round(length / step))
  const rotation = Math.atan2(-dz, dx)
  for (let index = 0; index < segments; index += 1) {
    const t = (index + 0.5) / segments
    const point = { x: from.x + dx * t, z: from.z + dz * t }
    if (gaps.some((gap) => Math.hypot(gap.x - point.x, gap.z - point.z) <= GAP_RADIUS)) continue
    if (kind === 'windbreak') draft.force(pick(TREE_MODELS, random), point, random() * Math.PI * 2, 0.9 + random() * 0.2)
    else if (kind === 'woodFence') draft.force('fence', point, rotation, length / segments)
    else draft.forceFeature(kind, point, rotation, 1)
  }
}

export function borderBelt(draft: WorldDraft, border: BorderKind, rect: Rect, random: () => number, gaps: Vec2[] = []): void {
  sides(rect).forEach(([from, to], index) => walkSide(draft, border === 'mixed' ? MIXED[index] : border, from, to, random, gaps))
}

export function edgeClutter(draft: WorldDraft, blocks: Rect[], density: WorldDensity, random: () => number, perBlock = 6): void {
  const target = density === 'light' ? Math.floor(perBlock / 2) : perBlock
  for (const block of blocks) {
    let placed = 0
    for (let tries = 0; tries < target * 12 && placed < target; tries += 1) {
      const [from, to] = pick(sides(block), random)
      const t = random()
      const along = { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t }
      const centerX = (block.minX + block.maxX) / 2
      const centerZ = (block.minZ + block.maxZ) / 2
      const outward = from.z === to.z ? { x: 0, z: Math.sign(along.z - centerZ) || 1 } : { x: Math.sign(along.x - centerX) || 1, z: 0 }
      const offset = 0.4 + random() * 0.5
      const point = { x: along.x + outward.x * offset, z: along.z + outward.z * offset }
      if (blocks.some((other) => inside(point, other))) continue
      if (draft.place(pick(CLUTTER_MODELS, random), point, random() * Math.PI * 2, 0.8 + random() * 0.4)) placed += 1
    }
  }
}

export function reliefMounds(relief: Relief, outside: Rect, bounds: Rect, random: () => number): Mound[] {
  if (relief !== 'rolling') return []
  const target = 6 + Math.floor(random() * 5)
  const mounds: Mound[] = []
  for (let tries = 0; tries < target * 40 && mounds.length < target; tries += 1) {
    const radius = 1.5 + random() * 1.5
    const x = bounds.minX + radius + random() * (bounds.maxX - bounds.minX - radius * 2)
    const z = bounds.minZ + radius + random() * (bounds.maxZ - bounds.minZ - radius * 2)
    if (rectDistance({ x, z }, outside) <= radius) continue
    if (mounds.some((mound) => Math.hypot(mound.x - x, mound.z - z) < mound.radius + radius)) continue
    mounds.push({ x, z, radius, height: 0.4 + random() * 0.6 })
  }
  return mounds
}
