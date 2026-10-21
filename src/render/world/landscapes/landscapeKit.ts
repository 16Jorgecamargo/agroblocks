import type { ModelId } from '@/render/models/manifest'
import { distanceToPolyline, rectDistance } from '@/render/world/geometry'
import { CLUTTER_MODELS } from '@/render/world/worldCatalog'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { Relief } from '@/render/world/worldStyles'
import { FEATURE_KINDS, type FeatureKind, type GroundPatch, type Mound, type Polyline, type Rect, type Vec2, type WorldDensity } from '@/render/world/worldTypes'

export type { Mound }

export const CLUTTER_CEILING = { map: 60, farm: 80 }

export const WORLD_MAP_ISLAND: Rect = { minX: -15.5, maxX: 15.5, minZ: -15.5, maxZ: 15.5 }

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

function isFeature(kind: FeatureKind | ModelId): kind is FeatureKind {
  return (FEATURE_KINDS as readonly string[]).includes(kind)
}

function inside(point: Vec2, rect: Rect): boolean {
  return point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ
}

export function inset(rect: Rect, amount: number): Rect {
  return { minX: rect.minX + amount, maxX: rect.maxX - amount, minZ: rect.minZ + amount, maxZ: rect.maxZ - amount }
}

export function center(rect: Rect): Vec2 {
  return { x: (rect.minX + rect.maxX) / 2, z: (rect.minZ + rect.maxZ) / 2 }
}

function sides(rect: Rect): [Vec2, Vec2][] {
  return [
    [{ x: rect.minX, z: rect.minZ }, { x: rect.maxX, z: rect.minZ }],
    [{ x: rect.maxX, z: rect.minZ }, { x: rect.maxX, z: rect.maxZ }],
    [{ x: rect.maxX, z: rect.maxZ }, { x: rect.minX, z: rect.maxZ }],
    [{ x: rect.minX, z: rect.maxZ }, { x: rect.minX, z: rect.minZ }],
  ]
}

export function landmark(draft: WorldDraft, kind: FeatureKind | ModelId, at: Vec2, rotation: number, scale = 1): void {
  if (isFeature(kind)) draft.forceFeature(kind, at, rotation, scale)
  else draft.force(kind, at, rotation, scale)
}

export function edgeClutter(draft: WorldDraft, blocks: Rect[], density: WorldDensity, random: () => number, perBlock = 6, models: readonly ModelId[] = CLUTTER_MODELS): void {
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
      if (draft.place(pick(models, random), point, random() * Math.PI * 2, 0.8 + random() * 0.4)) placed += 1
    }
  }
}

export function openGround(draft: WorldDraft, paths: Polyline[], patches: GroundPatch[]): (point: Vec2, radius: number) => boolean {
  return (point, radius) =>
    draft.props.every((prop) => Math.hypot(prop.x - point.x, prop.z - point.z) > radius + 0.3) &&
    draft.features.every((feature) => Math.hypot(feature.x - point.x, feature.z - point.z) > radius + 0.3) &&
    paths.every((path) => distanceToPolyline(point, path.points) > radius + path.width / 2 + 0.2) &&
    patches.every((patch) => rectDistance(point, patch.rect) > radius + 0.2)
}

export function reliefMounds(relief: Relief, outside: Rect, bounds: Rect, random: () => number, open: (point: Vec2, radius: number) => boolean = () => true): Mound[] {
  if (relief !== 'rolling') return []
  const target = 6 + Math.floor(random() * 5)
  const mounds: Mound[] = []
  for (let tries = 0; tries < target * 200 && mounds.length < target; tries += 1) {
    const radius = 1 + random() * 1.5
    const x = bounds.minX + radius + random() * (bounds.maxX - bounds.minX - radius * 2)
    const z = bounds.minZ + radius + random() * (bounds.maxZ - bounds.minZ - radius * 2)
    if (rectDistance({ x, z }, outside) <= radius) continue
    if (mounds.some((mound) => Math.hypot(mound.x - x, mound.z - z) < mound.radius + radius)) continue
    if (!open({ x, z }, radius)) continue
    mounds.push({ x, z, radius, height: 0.4 + random() * 0.6 })
  }
  return mounds
}
