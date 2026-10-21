import { rectPolygon } from '@/render/world/geometry'
import { borderBelt, cropBlock, landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { center, composeFarm, composeMap, inset, nearestGap } from '@/render/world/landscapes/scaffold'
import { spawnHerd } from '@/render/world/scenery'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { AnimalSpawn, GroundPatch, Rect, Vec2 } from '@/render/world/worldTypes'

const CORN_SOIL = '#8a6a3a'
const BED_SOIL = '#8a6448'
const ORCHARD = '#5f9e44'
const PADDOCK = '#8fcf63'
const YARD = '#b9a77e'
const GRAVEL = '#d9d2c3'

function house(draft: WorldDraft, at: Vec2): GroundPatch {
  landmark(draft, 'farmhouse', at, 0)
  landmark(draft, 'water-tower', { x: at.x - 2.4, z: at.z - 1 }, 0, 0.8)
  return { rect: { minX: at.x - 3.4, maxX: at.x + 1.8, minZ: at.z - 2, maxZ: at.z + 2.2 }, color: YARD }
}

function pen(draft: WorldDraft, rect: Rect, toward: Vec2, random: () => number): { patch: GroundPatch; animals: AnimalSpawn[]; area: Vec2[] } {
  borderBelt(draft, 'woodFence', rect, random, [nearestGap(rect, toward)])
  draft.forceFeature('trough', { x: center(rect).x, z: rect.minZ + 0.8 }, 0, 1)
  const area = rectPolygon(inset(rect, 0.6))
  return { patch: { rect, color: PADDOCK }, animals: spawnHerd(random, area, [['cow', 2], ['sheep', 1]], 'homestead', 0.85), area }
}

function bays(draft: WorldDraft, start: Vec2, count: number, rotation: number): GroundPatch {
  const along = rotation === 0 ? { x: 3, z: 0 } : { x: 0, z: 3 }
  for (let index = 0; index < count; index += 1) landmark(draft, 'greenhouseBay', { x: start.x + along.x * index, z: start.z + along.z * index }, rotation)
  const end = { x: start.x + along.x * (count - 1), z: start.z + along.z * (count - 1) }
  const half = rotation === 0 ? { x: 1.7, z: 1.2 } : { x: 1.2, z: 1.7 }
  return { rect: { minX: Math.min(start.x, end.x) - half.x, maxX: Math.max(start.x, end.x) + half.x, minZ: Math.min(start.z, end.z) - half.z, maxZ: Math.max(start.z, end.z) + half.z }, color: GRAVEL }
}

export const homesteadLandscape: Landscape = {
  map: (input, random) =>
    composeMap('homestead', input, random, ({ draft, full }) => {
      const corn: Rect = { minX: -11.6, maxX: -2.2, minZ: -12.6, maxZ: -10.4 }
      const fruit: Rect = { minX: 2.2, maxX: 11.2, minZ: -13.2, maxZ: -10.4 }
      const beds: Rect = { minX: -13.6, maxX: -10.4, minZ: 6.4, maxZ: 13.4 }
      const patches = [
        cropBlock(draft, { rect: corn, color: CORN_SOIL }, 'cornStalk', full ? [0.62, 0.8] : [1, 1.2], random),
        cropBlock(draft, { rect: fruit, color: ORCHARD, height: 0.25 }, 'fruitTree', [1.9, 1.9], random, { tints: ['#f29a2e'], jitter: 0.05 }),
        cropBlock(draft, { rect: beds, color: BED_SOIL }, 'vegetableBed', [1.9, 1.3], random, { jitter: 0 }),
        house(draft, { x: -0.6, z: -2.2 }),
        bays(draft, { x: 9.8, z: -8 }, 2, Math.PI / 2),
      ]
      const cows = pen(draft, { minX: 10.2, maxX: 13.8, minZ: 10.4, maxZ: 13.8 }, { x: 8.5, z: 8.7 }, random)
      patches.push(cows.patch)
      return { patches, blocks: [corn, fruit, beds, cows.patch.rect], animals: cows.animals, pasture: cows.area, birds: [center(corn)], butterflies: [center(beds)], paths: [{ points: [{ x: -1.4, z: 0 }, { x: -2.8, z: 1.6 }, { x: -4, z: 2.9 }], width: 0.9 }] }
    }),
  farm: (input, random) =>
    composeFarm('homestead', input, random, ({ draft, hw, hh, full }) => {
      const fruit: Rect = { minX: -hw - 7.6, maxX: -hw - 1.9, minZ: -hh - 0.4, maxZ: hh + 1.6 }
      const corn: Rect = { minX: -hw - 0.4, maxX: hw + 3.6, minZ: -hh - 6.8, maxZ: -hh - 2 }
      const beds: Rect = { minX: -hw - 7, maxX: -hw - 2.4, minZ: hh + 3.6, maxZ: hh + 7 }
      const patches = [
        cropBlock(draft, { rect: fruit, color: ORCHARD, height: 0.25 }, 'fruitTree', [1.9, 1.9], random, { tints: ['#e0473c'], jitter: 0.05 }),
        cropBlock(draft, { rect: corn, color: CORN_SOIL }, 'cornStalk', full ? [0.62, 0.8] : [1, 1.2], random),
        cropBlock(draft, { rect: beds, color: BED_SOIL }, 'vegetableBed', [1.9, 1.3], random, { jitter: 0 }),
        house(draft, { x: -hw - 4.6, z: -hh - 5.4 }),
        bays(draft, { x: -hw - 8.6, z: -hh - 6 }, 1, 0),
      ]
      const cows = pen(draft, { minX: hw + 4.6, maxX: hw + 8.6, minZ: -hh - 7.8, maxZ: -hh - 3.8 }, { x: 0, z: 0 }, random)
      patches.push(cows.patch)
      return { patches, blocks: [fruit, corn, beds, cows.patch.rect], animals: cows.animals, pasture: cows.area, birds: [center(corn)], butterflies: [center(beds)] }
    }),
}
