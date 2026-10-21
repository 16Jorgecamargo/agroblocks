import { borderBelt, cropBlock, landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { center, composeFarm, composeMap, inset, nearestGap } from '@/render/world/landscapes/scaffold'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { GroundPatch, Rect, Vec2 } from '@/render/world/worldTypes'

const SOIL = '#8a6448'
const RUN = '#a6c56a'
const YARD = '#b9a77e'
const MEADOW = '#93cf62'
const FLOWERS = ['flower-patch', 'flower-red', 'flower-yellow', 'flower-purple', 'clover', 'grass-short'] as const

function nearest(points: Vec2[], to: Vec2): Vec2 {
  return points.reduce((best, point) => (Math.hypot(point.x - to.x, point.z - to.z) < Math.hypot(best.x - to.x, best.z - to.z) ? point : best))
}

function hedgedBeds(draft: WorldDraft, rect: Rect, toward: Vec2, random: () => number): GroundPatch {
  const patch = cropBlock(draft, { rect, color: SOIL }, 'vegetableBed', [1.9, 1.3], random, { jitter: 0 })
  const hedge = inset(rect, -0.45)
  borderBelt(draft, 'hedge', hedge, random, [nearestGap(hedge, toward)])
  return patch
}

function chickenRun(draft: WorldDraft, rect: Rect, toward: Vec2, random: () => number): GroundPatch {
  borderBelt(draft, 'woodFence', rect, random, [nearestGap(rect, toward)])
  const middle = center(rect)
  landmark(draft, 'chicken-coop', { x: middle.x - 0.8, z: middle.z - 0.6 }, 0.3, 0.9)
  for (const [dx, dz] of [
    [0.9, 0.9],
    [1.4, -0.4],
    [-0.4, 1.3],
    [0.3, -1.2],
    [-1.3, 0.8],
  ]) {
    draft.forceFeature('chicken', { x: middle.x + dx, z: middle.z + dz }, random() * Math.PI * 2, 1)
  }
  return { rect, color: RUN }
}

function flowerMeadow(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  for (let z = rect.minZ + 0.4; z < rect.maxZ; z += 0.9) {
    for (let x = rect.minX + 0.4; x < rect.maxX; x += 0.9) draft.place(FLOWERS[Math.floor(random() * 4)], { x: x + (random() - 0.5) * 0.3, z: z + (random() - 0.5) * 0.3 }, random() * Math.PI * 2, 0.9 + random() * 0.3)
  }
  return { rect, color: MEADOW }
}

function toolYard(draft: WorldDraft, at: Vec2): GroundPatch {
  landmark(draft, 'reservoir', { x: at.x - 0.6, z: at.z + 3.4 }, 0.4, 0.8)
  landmark(draft, 'log-stack', { x: at.x - 1.9, z: at.z + 0.3 }, 1.2, 0.8)
  landmark(draft, 'toolShed', at, 0)
  landmark(draft, 'compostBins', { x: at.x + 0.2, z: at.z + 1.6 }, 0)
  landmark(draft, 'wateringCan', { x: at.x + 1.4, z: at.z + 0.4 }, 0.6)
  landmark(draft, 'wateringCan', { x: at.x + 1.3, z: at.z - 0.6 }, 2.1)
  return { rect: { minX: at.x - 2.6, maxX: at.x + 1.9, minZ: at.z - 1.2, maxZ: at.z + 4.4 }, color: YARD }
}

export const gardenLandscape: Landscape = {
  map: (input, random) =>
    composeMap('garden', input, random, ({ draft, trail }) => {
      const beds: Rect[] = [
        { minX: -11.4, maxX: -8.1, minZ: -5.2, maxZ: -1 },
        { minX: -7, maxX: -3.8, minZ: -5.2, maxZ: -1 },
        { minX: -2, maxX: 2.4, minZ: -3.2, maxZ: 2.4 },
        { minX: 4.2, maxX: 10.8, minZ: -11.4, maxZ: -8.6 },
        { minX: 4.2, maxX: 10.8, minZ: 7.8, maxZ: 10.8 },
      ]
      const run: Rect = { minX: -11.2, maxX: -7.4, minZ: 0.8, maxZ: 4.6 }
      const patches = beds.map((rect) => hedgedBeds(draft, rect, nearest(trail, center(rect)), random))
      patches.push(chickenRun(draft, run, nearest(trail, center(run)), random), toolYard(draft, { x: -4.6, z: 0.6 }))
      for (const [x, z] of [
        [-11.2, 6.6],
        [-8.8, 6.9],
        [11.6, -1.4],
      ]) draft.placeFeature('fruitTree', { x, z }, random() * Math.PI * 2, 0.85, '#e0473c')
      patches.push(flowerMeadow(draft, { minX: 3.4, maxX: 6.4, minZ: -1.4, maxZ: 1.2 }, random))
      return { patches, blocks: [...beds, run], butterflies: beds.map(center), clutterModels: FLOWERS, paths: [{ points: [{ x: -3.2, z: 5.2 }, { x: -2.4, z: 6.6 }, { x: -1.8, z: 7.2 }], width: 0.9 }] }
    }),
  farm: (input, random) =>
    composeFarm('garden', input, random, ({ draft, hw, hh }) => {
      const beds: Rect[] = [
        { minX: -hw - 6.8, maxX: -hw - 2, minZ: -hh - 0.4, maxZ: hh + 3.2 },
        { minX: -hw - 0.4, maxX: hw + 3.4, minZ: -hh - 6.8, maxZ: -hh - 2 },
      ]
      const run: Rect = { minX: -hw - 7, maxX: -hw - 2.6, minZ: hh + 4.4, maxZ: hh + 8.2 }
      const origin = { x: 0, z: 0 }
      const patches = beds.map((rect) => hedgedBeds(draft, rect, origin, random))
      patches.push(chickenRun(draft, run, origin, random), toolYard(draft, { x: -hw - 5.4, z: -hh - 6.4 }))
      patches.push(flowerMeadow(draft, { minX: hw + 2, maxX: hw + 6.2, minZ: hh + 1.8, maxZ: hh + 5.2 }, random))
      for (const [x, z] of [
        [hw + 5.4, -hh - 3.4],
        [hw + 7.2, -hh - 5.6],
        [hw + 5.2, -hh - 7.2],
      ]) draft.placeFeature('fruitTree', { x, z }, random() * Math.PI * 2, 0.85, '#e0473c')
      return { patches, blocks: [...beds, run], butterflies: beds.map(center), clutterModels: FLOWERS }
    }),
}
