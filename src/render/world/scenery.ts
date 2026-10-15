import type { ModelId } from '@/render/models/manifest'
import { pointAlong, pointInPolygon, polygonBounds } from '@/render/world/geometry'
import { CLUTTER_MODELS } from '@/render/world/worldCatalog'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { AnimalSpawn, AnimalSpecies, Polyline, Rect, Vec2, WorldDensity } from '@/render/world/worldTypes'

const CLUTTER_MIX: { model: ModelId; share: number }[] = [
  { model: 'grass-short', share: 0.36 },
  { model: 'grass-tall', share: 0.14 },
  { model: 'clover', share: 0.16 },
  { model: 'flower-patch', share: 0.06 },
  { model: 'flower-red', share: 0.04 },
  { model: 'flower-yellow', share: 0.04 },
  { model: 'flower-purple', share: 0.04 },
  { model: 'fern', share: 0.06 },
  { model: 'mushrooms', share: 0.03 },
  { model: 'pebble', share: 0.07 },
]

export function addClutter(draft: WorldDraft, area: Rect, density: WorldDensity, total: number, accept?: (point: Vec2) => boolean): void {
  if (density === 'light') return
  for (const { model, share } of CLUTTER_MIX) draft.scatter([model], Math.round(total * share), area, [0.8, 1.25], accept)
}

export function clutterCount(models: readonly string[]): number {
  return models.filter((model) => (CLUTTER_MODELS as readonly string[]).includes(model)).length
}

export function addLilies(draft: WorldDraft, river: Polyline, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const base = pointAlong(river.points, (index + 0.5) / count)
    const side = index % 2 === 0 ? 0.35 : -0.35
    draft.force('lily', { x: base.x + side, z: base.z - side }, index * 1.3, 1)
  }
}

export function addButterflies(random: () => number, area: Rect, count: number): Vec2[] {
  return Array.from({ length: count }, () => ({ x: area.minX + random() * (area.maxX - area.minX), z: area.minZ + random() * (area.maxZ - area.minZ) }))
}

export function spawnHerd(random: () => number, pasture: Vec2[], herd: [AnimalSpecies, number][], prefix: string): AnimalSpawn[] {
  const bounds = polygonBounds(pasture)
  const animals: AnimalSpawn[] = []
  for (const [species, count] of herd) {
    for (let index = 0; index < count; index += 1) {
      let point = { x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2 }
      for (let tries = 0; tries < 40; tries += 1) {
        const candidate = { x: bounds.minX + random() * (bounds.maxX - bounds.minX), z: bounds.minZ + random() * (bounds.maxZ - bounds.minZ) }
        if (pointInPolygon(candidate, pasture)) {
          point = candidate
          break
        }
      }
      animals.push({ id: `${prefix}-${species}-${index}`, species, x: point.x, z: point.z, area: pasture })
    }
  }
  return animals
}
