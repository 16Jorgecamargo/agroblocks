import { landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { blob, stain, turn } from '@/render/world/landscapes/natureKit'
import { channel } from '@/render/world/landscapes/plots'
import { center } from '@/render/world/landscapes/scaffold'
import { stageFarm, stageMap, type StageLook } from '@/render/world/landscapes/stage'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { GroundPatch, Rect, Stain, Vec2 } from '@/render/world/worldTypes'

const SOIL = '#8a6a3a'
const YOUNG_SOIL = '#7a5a3a'
const STUBBLE = '#d9c682'
const YARD = '#c8b06a'
const PACKED = '#b39a63'
const DRY = '#cdb877'
const GRASS_STRIP = '#9fb257'
const LOOK: StageLook = { trees: ['pine', 'tree-a', 'pine-round', 'tree-c', 'pine', 'tree-b', 'tree-d'] }

type Growth = 'young' | 'growing' | 'ripe'

const HEIGHTS: Record<Growth, [number, number]> = { young: [0.42, 0.55], growing: [0.7, 0.82], ripe: [0.94, 1.06] }

export function cornField(draft: WorldDraft, rect: Rect, growth: Growth, full: boolean, random: () => number): GroundPatch {
  const [stepX, stepZ] = full ? [0.62, 0.8] : [0.95, 1.15]
  const [low, high] = HEIGHTS[growth]
  for (let z = rect.minZ + stepZ / 2; z < rect.maxZ; z += stepZ) {
    for (let x = rect.minX + stepX / 2; x < rect.maxX; x += stepX) {
      const point = { x: Math.min(rect.maxX, x + (random() - 0.5) * 0.12), z: Math.min(rect.maxZ, z + (random() - 0.5) * 0.06) }
      if (!draft.clearOfRoutes(point, 0.22)) continue
      draft.forceFeature('cornStalk', point, random() * 0.4 - 0.2, low + random() * (high - low))
    }
  }
  return { rect, color: growth === 'young' ? YOUNG_SOIL : SOIL, texture: 'furrows' }
}

export function stubbleField(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  const middle = center(rect)
  for (let x = rect.minX + 1.1; x < rect.maxX - 0.6; x += 2.3) draft.forceFeature('hayBale', { x, z: middle.z + (random() - 0.5) * 0.9 }, random() * 0.5, 1)
  return { rect, color: STUBBLE, texture: 'stripes' }
}

function siloComplex(draft: WorldDraft, at: Vec2, rotation: number): void {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'grainDryer', spot(-2.3, -0.2), rotation)
  landmark(draft, 'grainBin', spot(-0.4, -1.3), rotation)
  landmark(draft, 'grainBin', spot(1.6, -0.9), rotation)
  landmark(draft, 'grainBin', spot(0.5, 0.9), rotation, 0.85)
  landmark(draft, 'grainAuger', spot(-1.0, 1.6), rotation + 0.5)
  draft.forceFeature('cornWagon', spot(-2.8, 2.0), rotation + 0.2)
}

function machineYard(draft: WorldDraft, at: Vec2, rotation: number, random: () => number): Stain {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'machineShed', at, rotation)
  landmark(draft, 'supplyTank', spot(3.2, -0.6), rotation + Math.PI / 2)
  landmark(draft, 'barrels', spot(3.0, 1.0), rotation)
  landmark(draft, 'equipmentRack', spot(-3.0, -0.4), rotation + Math.PI / 2)
  return { points: blob(spot(0, 2.4), 3.2, 1.9, random, 10), color: PACKED }
}

function stagingArea(draft: WorldDraft, at: Vec2, random: () => number): Stain {
  landmark(draft, 'sackPallet', at, 0.1)
  landmark(draft, 'sackPallet', { x: at.x + 1.3, z: at.z + 0.2 }, -0.1)
  landmark(draft, 'harvestBin', { x: at.x - 0.2, z: at.z + 1.3 }, 0)
  landmark(draft, 'harvestBin', { x: at.x + 1.0, z: at.z + 1.4 }, 0.2)
  landmark(draft, 'harvestBin', { x: at.x + 2.2, z: at.z + 1.2 }, -0.1)
  landmark(draft, 'baleStack', { x: at.x + 3.0, z: at.z - 0.3 }, 0.3)
  return stain({ x: at.x + 1.2, z: at.z + 0.6 }, 2.6, 1.7, YARD, random)
}

function farmOffice(draft: WorldDraft, at: Vec2): void {
  landmark(draft, 'farmhouse', at, 0, 0.75)
  landmark(draft, 'waterTank', { x: at.x - 2.3, z: at.z + 0.2 }, 0)
  draft.forceFeature('shadeTree', { x: at.x + 2.2, z: at.z + 0.8 }, 1.2, 0.85, '#5f9e44')
}

export const cornfieldLandscape: Landscape = {
  map: (input, random) =>
    stageMap('cornfield', input, random, LOOK, ({ draft, full }) => {
      const ripe: Rect = { minX: -12.6, maxX: -4.4, minZ: -12.6, maxZ: -3.2 }
      const young: Rect = { minX: -12.6, maxX: -4.8, minZ: -1.4, maxZ: 6.2 }
      const growing: Rect = { minX: -2.6, maxX: 5.8, minZ: -5.4, maxZ: -0.6 }
      const strip: Rect = { minX: -2.2, maxX: 1.6, minZ: 0.6, maxZ: 4.4 }
      const harvested: Rect = { minX: 3.4, maxX: 12.6, minZ: -12.6, maxZ: -9.8 }
      const east: Rect = { minX: 9.8, maxX: 12.8, minZ: 0.4, maxZ: 4.4 }
      const patches = [cornField(draft, ripe, 'ripe', full, random), cornField(draft, young, 'young', full, random), cornField(draft, growing, 'growing', full, random), cornField(draft, strip, 'ripe', full, random), cornField(draft, east, 'growing', full, random), stubbleField(draft, harvested, random)]
      siloComplex(draft, { x: 9.6, z: 7.4 }, 0)
      const stains = [
        machineYard(draft, { x: 11.6, z: -3.6 }, -Math.PI / 2, random),
        stagingArea(draft, { x: -2.2, z: 10.4 }, random),
        stain({ x: 7.2, z: 6.2 }, 3.6, 2.6, YARD, random),
        stain({ x: -3.7, z: -2.2 }, 1.6, 1.1, PACKED, random),
        stain({ x: -8.4, z: 7.6 }, 1.6, 0.9, DRY, random),
        stain({ x: 2.4, z: -10.6 }, 0.9, 1.4, GRASS_STRIP, random),
      ]
      farmOffice(draft, { x: -6.6, z: 12 })
      draft.forceFeature('scarecrow', { x: -8.6, z: 2.4 }, 0.5)
      draft.forceFeature('tractor', { x: -4.2, z: -1.9 }, 0)
      landmark(draft, 'baleStack', { x: 5.2, z: 10.6 }, -0.2)
      landmark(draft, 'baleStack', { x: 6.8, z: 11.6 }, 0.4)
      const waters = [channel({ minX: -12.6, maxX: -4.6, minZ: -2.6, maxZ: -2.25 }), channel({ minX: -2.6, maxX: 5.8, minZ: -6.15, maxZ: -5.8 })]
      return {
        patches,
        blocks: [ripe, young, growing, strip, east, harvested],
        stains,
        waters,
        birds: [center(ripe), center(young), center(growing)],
        gaps: [{ x: -14.4, z: 10 }],
        paths: [
          { points: [{ x: -2.4, z: 6.6 }, { x: -3.7, z: 4.8 }, { x: -3.7, z: -1.9 }, { x: -12.4, z: -1.95 }], width: 1.0 },
        ],
      }
    }),
  farm: (input, random) =>
    stageFarm('cornfield', input, random, LOOK, ({ draft, hw, hh, full }) => {
      const west: Rect = { minX: -hw - 8.6, maxX: -hw - 2.2, minZ: -hh - 1, maxZ: hh + 5 }
      const back: Rect = { minX: -hw - 0.6, maxX: hw + 5, minZ: -hh - 7.8, maxZ: -hh - 2.4 }
      const front: Rect = { minX: -hw - 0.6, maxX: hw + 1.6, minZ: hh + 2.2, maxZ: hh + 4.6 }
      const harvested: Rect = { minX: hw + 2.4, maxX: hw + 8.4, minZ: hh + 1.6, maxZ: hh + 4.6 }
      const patches = [cornField(draft, west, 'ripe', full, random), cornField(draft, back, 'growing', full, random), cornField(draft, front, 'young', full, random), stubbleField(draft, harvested, random)]
      siloComplex(draft, { x: -hw - 5.4, z: -hh - 5.6 }, 0)
      const stains = [machineYard(draft, { x: hw + 7.6, z: -hh - 4.6 }, -Math.PI / 2, random), stain({ x: -hw - 5.2, z: -hh - 4.2 }, 3, 2.2, YARD, random), stain({ x: hw + 3.6, z: -1.8 }, 1.4, 0.9, DRY, random)]
      draft.forceFeature('scarecrow', { x: -hw - 5.4, z: hh + 2.4 }, 0.5)
      return {
        patches,
        blocks: [west, back, front, harvested],
        stains,
        waters: [channel({ minX: -hw - 0.6, maxX: hw + 5, minZ: -hh - 2.15, maxZ: -hh - 1.8 })],
        birds: [center(west), center(back)],
      }
    }),
}
