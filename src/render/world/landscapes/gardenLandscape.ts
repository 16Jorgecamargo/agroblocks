import { landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { blob, rectStain, scatterCover, stain, turn } from '@/render/world/landscapes/natureKit'
import { bedPlot, channel, edgeSides } from '@/render/world/landscapes/plots'
import { center } from '@/render/world/landscapes/landscapeKit'
import { stageFarm, stageMap, type StageLook } from '@/render/world/landscapes/stage'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { FeatureKind, GroundPatch, Rect, Stain, Vec2 } from '@/render/world/worldTypes'

const YARD = '#b9a77e'
const WORN = '#a99470'
const MOSS = '#5f9e44'
const LAWN = '#6fb34f'
const MEADOW = '#93cf62'
const GRAVEL = '#cfc4a8'
const FLOWERS = ['flower-patch', 'flower-red', 'flower-yellow', 'flower-purple', 'clover', 'grass-short'] as const
const GREENS: FeatureKind[] = ['cabbageBed', 'carrotBed', 'vegetableBed', 'onionBed', 'pepperBed']
const CLIMBERS: FeatureKind[] = ['beanTrellis', 'tomatoBed', 'beanTrellis', 'pepperBed']
const HERBS: FeatureKind[] = ['herbBed', 'onionBed', 'carrotBed', 'herbBed']
const NURSERY: FeatureKind[] = ['sproutBed', 'herbBed', 'sproutBed']
const LOOK: StageLook = { trees: ['tree-a', 'tree-b', 'tree-c', 'tree-d', 'tree-b', 'pine-round'] }

function workHub(draft: WorldDraft, at: Vec2, rotation: number, random: () => number): Stain {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'toolShed', spot(-0.2, -1.2), rotation)
  landmark(draft, 'rainBarrel', spot(-1.6, -1.5), rotation)
  landmark(draft, 'workbench', spot(1.9, -0.1), rotation + Math.PI / 2)
  landmark(draft, 'sackPallet', spot(-1.9, 0.1), rotation + 0.2)
  landmark(draft, 'potStack', spot(-1.0, 1.3), rotation)
  draft.forceFeature('wateringCan', spot(-0.4, 1.2), rotation + 1.1)
  draft.forceFeature('basket', spot(0.9, 1.1), rotation, 1, '#e0473c')
  draft.forceFeature('basket', spot(2.1, 1.4), rotation + 0.6, 1, '#9fd27a')
  draft.forceFeature('wheelbarrow', spot(2.8, 0.9), rotation + 0.6)
  return { points: blob(spot(0.4, 0.1), 3.1, 2.5, random, 11), color: YARD }
}

function nursery(draft: WorldDraft, at: Vec2, random: () => number): Stain[] {
  landmark(draft, 'seedlingTable', at, 0)
  landmark(draft, 'seedlingTable', { x: at.x + 2.0, z: at.z + 0.1 }, 0)
  landmark(draft, 'seedlingTable', { x: at.x + 0.2, z: at.z + 1.5 }, 0)
  landmark(draft, 'potStack', { x: at.x - 1.3, z: at.z + 1.6 }, 0.4)
  draft.forceFeature('wateringCan', { x: at.x + 1.6, z: at.z + 1.6 }, 2.2)
  return [stain({ x: at.x + 0.7, z: at.z + 0.8 }, 2.4, 1.6, GRAVEL, random)]
}

function compostCorner(draft: WorldDraft, at: Vec2, random: () => number): Stain {
  landmark(draft, 'compostBins', at, 0)
  landmark(draft, 'rainBarrel', { x: at.x + 1.5, z: at.z - 0.2 }, 0)
  draft.forceFeature('wheelbarrow', { x: at.x - 0.4, z: at.z + 1.0 }, 2.6)
  return stain({ x: at.x + 0.3, z: at.z + 0.3 }, 1.9, 1.3, WORN, random)
}

function restSpot(draft: WorldDraft, at: Vec2, facing: number): void {
  draft.forceFeature('shadeTree', at, 0.4, 1.05, '#4f9a3a')
  landmark(draft, 'bench', turn(at, facing, 0, 1.3), facing)
}

function rainPond(draft: WorldDraft, at: Vec2, random: () => number): { water: Vec2[]; stains: Stain[] } {
  const water = blob(at, 1.7, 1.3, random, 10)
  landmark(draft, 'rainBarrel', { x: at.x + 2.1, z: at.z - 1.2 }, 0.4)
  for (const [dx, dz] of [
    [-1.7, 0.6],
    [1.5, 0.9],
    [-0.4, -1.4],
  ]) draft.forceFeature('reeds', { x: at.x + dx, z: at.z + dz }, random() * Math.PI, 1)
  return { water, stains: [stain(at, 2.6, 2.1, MOSS, random)] }
}

function meadow(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  const corners = [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
  scatterCover(draft, corners, FLOWERS, Math.round((rect.maxX - rect.minX) * (rect.maxZ - rect.minZ) * 0.45), random)
  return { rect, color: MEADOW }
}

export const gardenLandscape: Landscape = {
  map: (input, random) =>
    stageMap('garden', input, random, LOOK, ({ draft }) => {
      const main: Rect = { minX: -12.4, maxX: -4.6, minZ: -12.4, maxZ: -7.3 }
      const climbing: Rect = { minX: -12.4, maxX: -7.2, minZ: -6.4, maxZ: -2.6 }
      const long: Rect = { minX: -3.4, maxX: 1.4, minZ: -12.4, maxZ: -5.6 }
      const herbs: Rect = { minX: -12.6, maxX: -7.8, minZ: -1.0, maxZ: 1.6 }
      const trellis: Rect = { minX: -3.8, maxX: -0.4, minZ: 4.6, maxZ: 7.9 }
      const seedlings: Rect = { minX: 8.4, maxX: 12.6, minZ: -12.6, maxZ: -9.4 }
      const peppers: Rect = { minX: 9.8, maxX: 12.8, minZ: -4.8, maxZ: -1.8 }
      const patches = [
        bedPlot(draft, main, random, { crops: GREENS }),
        bedPlot(draft, climbing, random, { crops: CLIMBERS }),
        bedPlot(draft, long, random, { crops: GREENS, along: 'z' }),
        bedPlot(draft, herbs, random, { crops: HERBS }),
        bedPlot(draft, trellis, random, { crops: CLIMBERS }),
        bedPlot(draft, seedlings, random, { crops: NURSERY, stages: [0.8, 0.95] }),
        bedPlot(draft, peppers, random, { crops: ['pepperBed', 'tomatoBed'], along: 'z' }),
      ]
      edgeSides(draft, 'hedge', main, ['minX', 'minZ'])
      edgeSides(draft, 'hedge', long, ['minX'], 0.45, [{ x: -3.85, z: -6 }])
      edgeSides(draft, 'hedge', trellis, ['minX'], 0.45, [{ x: -4.25, z: 4.4 }])
      edgeSides(draft, 'woodFence', climbing, ['maxX'], 0.4, [{ x: -6.8, z: -4.5 }])
      const stains = [
        workHub(draft, { x: 3.6, z: 1.6 }, 0, random),
        ...nursery(draft, { x: 4.6, z: -11.4 }, random),
        compostCorner(draft, { x: 9.4, z: -7.2 }, random),
        rectStain({ minX: -4.4, maxX: -3.6, minZ: -12, maxZ: -6.2 }, WORN, random, 0.2),
        stain({ x: -1.4, z: -4.2 }, 1.6, 1.0, LAWN, random),
        stain({ x: 6.6, z: 9.8 }, 2.2, 1.6, LAWN, random),
        stain({ x: -6.2, z: 0.6 }, 1.3, 1.9, LAWN, random),
      ]
      const pond = rainPond(draft, { x: -10.4, z: 4.6 }, random)
      stains.push(...pond.stains)
      restSpot(draft, { x: 11.2, z: 8.4 }, Math.PI * 0.85)
      landmark(draft, 'pergola', { x: 7.6, z: 11.6 }, 0.35)
      patches.push(meadow(draft, { minX: 9.4, maxX: 12.8, minZ: 11, maxZ: 12.6 }, random), meadow(draft, { minX: -7.8, maxX: -4.4, minZ: 9.4, maxZ: 10.8 }, random))
      for (const [x, z, tint] of [
        [-6.6, 12.4, '#e0473c'],
        [-4.4, 12.8, '#f2c94c'],
        [0.9, 3.9, '#e0473c'],
      ] as const) draft.forceFeature('fruitTree', { x, z }, random() * Math.PI * 2, 0.85, tint)
      const waters = [pond.water, channel({ minX: -12.4, maxX: -4.6, minZ: -7.05, maxZ: -6.65 }), channel({ minX: -12.4, maxX: -7.2, minZ: -2.25, maxZ: -1.85 })]
      return {
        patches,
        blocks: [main, climbing, long, herbs, trellis, seedlings, peppers],
        stains,
        waters,
        butterflies: [center(trellis), center(herbs), { x: 11, z: 11.8 }, { x: -6, z: 10 }],
        clutterModels: FLOWERS,
        paths: [
          { points: [{ x: 4.1, z: 3.6 }, { x: 4.6, z: 5.3 }], width: 0.9 },
          { points: [{ x: 1.4, z: 0.4 }, { x: -0.6, z: -3.2 }, { x: -4, z: -5.8 }, { x: -4, z: -11.8 }], width: 0.8 },
        ],
      }
    }),
  farm: (input, random) =>
    stageFarm('garden', input, random, LOOK, ({ draft, hw, hh }) => {
      const west: Rect = { minX: -hw - 8.4, maxX: -hw - 2.2, minZ: -hh - 0.8, maxZ: hh + 4.2 }
      const back: Rect = { minX: -hw - 0.8, maxX: hw + 3.4, minZ: -hh - 7.8, maxZ: -hh - 2.4 }
      const herbs: Rect = { minX: hw + 1.6, maxX: hw + 5.6, minZ: hh + 1.8, maxZ: hh + 4.4 }
      const seedlings: Rect = { minX: hw + 4.8, maxX: hw + 8.4, minZ: -hh - 7.8, maxZ: -hh - 4.6 }
      const patches = [
        bedPlot(draft, west, random, { crops: [...GREENS, 'beanTrellis'], along: 'z' }),
        bedPlot(draft, back, random, { crops: [...CLIMBERS, ...GREENS] }),
        bedPlot(draft, herbs, random, { crops: HERBS }),
        bedPlot(draft, seedlings, random, { crops: NURSERY, stages: [0.8, 0.95] }),
      ]
      edgeSides(draft, 'hedge', west, ['minX'])
      edgeSides(draft, 'hedge', back, ['minZ'])
      const stains = [
        workHub(draft, { x: -hw - 5.2, z: -hh - 5.6 }, 0, random),
        ...nursery(draft, { x: hw + 5.6, z: -hh - 2.6 }, random),
        compostCorner(draft, { x: hw + 9.6, z: -hh - 5.4 }, random),
        stain({ x: hw + 3, z: -1.8 }, 1.6, 1.0, LAWN, random),
      ]
      const pond = rainPond(draft, { x: -hw - 5, z: hh + 7.2 }, random)
      stains.push(...pond.stains)
      restSpot(draft, { x: hw + 6.2, z: hh + 6.2 }, Math.PI * 0.85)
      patches.push(meadow(draft, { minX: hw + 1.6, maxX: hw + 5.6, minZ: hh + 5.2, maxZ: hh + 6.6 }, random))
      return {
        patches,
        blocks: [west, back, herbs, seedlings],
        stains,
        waters: [pond.water, channel({ minX: -hw - 8.4, maxX: -hw - 2.2, minZ: hh + 4.5, maxZ: hh + 4.9 })],
        butterflies: [center(herbs), center(west)],
        clutterModels: FLOWERS,
      }
    }),
}
