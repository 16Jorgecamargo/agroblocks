import { pen } from '@/render/world/landscapes/barnyardLandscape'
import { cornField, stubbleField } from '@/render/world/landscapes/cornfieldLandscape'
import { bayRow } from '@/render/world/landscapes/greenhouseLandscape'
import { landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { blob, scatterCover, stain, turn } from '@/render/world/landscapes/natureKit'
import { grove } from '@/render/world/landscapes/orchardLandscape'
import { bedPlot, channel, edgeSides } from '@/render/world/landscapes/plots'
import { center } from '@/render/world/landscapes/scaffold'
import { stageFarm, stageMap, type StageLook } from '@/render/world/landscapes/stage'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { FeatureKind, GroundPatch, Rect, Stain, Vec2 } from '@/render/world/worldTypes'

const YARD = '#b9a77e'
const PACKED = '#a99470'
const STRAW = '#d9c682'
const MOSS = '#5f9e44'
const MEADOW = '#93cf62'
const FLOWERS = ['flower-red', 'flower-yellow', 'flower-purple', 'flower-patch', 'clover'] as const
const VEGETABLES: FeatureKind[] = ['cabbageBed', 'tomatoBed', 'carrotBed', 'beanTrellis', 'onionBed', 'pepperBed']
const LOOK: StageLook = { trees: ['tree-a', 'tree-b', 'pine', 'tree-c', 'tree-d', 'pine-round', 'tree-b'] }

function flowers(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  const corners = [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
  scatterCover(draft, corners, FLOWERS, Math.max(2, Math.round((rect.maxX - rect.minX) * (rect.maxZ - rect.minZ) * 0.5)), random)
  return { rect, color: MEADOW }
}

function homeYard(draft: WorldDraft, at: Vec2, rotation: number, random: () => number): { stain: Stain; beds: GroundPatch[] } {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'farmhouse', at, rotation)
  landmark(draft, 'workbench', spot(3.0, -0.8), rotation + Math.PI / 2)
  landmark(draft, 'log-stack', spot(-2.6, 0.6), rotation + 1.2, 0.8)
  draft.forceFeature('crateStack', spot(2.8, 1.0), rotation + 0.2)
  draft.forceFeature('wheelbarrow', spot(2.2, 2.4), rotation + 0.7)
  draft.forceFeature('basket', spot(1.4, 2.6), rotation, 1, '#e0473c')
  draft.forceFeature('shadeTree', spot(-2.8, 2.6), rotation, 0.9, '#4f9a3a')
  const left = spot(-1.5, 1.6)
  const right = spot(1.5, 1.6)
  return {
    stain: { points: blob(spot(0.3, 1.4), 3.8, 2.6, random, 12), color: YARD },
    beds: [flowers(draft, { minX: left.x - 0.5, maxX: left.x + 0.5, minZ: left.z - 0.4, maxZ: left.z + 0.4 }, random), flowers(draft, { minX: right.x - 0.5, maxX: right.x + 0.5, minZ: right.z - 0.4, maxZ: right.z + 0.4 }, random)],
  }
}

function machinery(draft: WorldDraft, at: Vec2, rotation: number, random: () => number): Stain {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'machineShed', at, rotation)
  landmark(draft, 'supplyTank', spot(-1.2, 2.6), rotation)
  landmark(draft, 'barrels', spot(1.6, 2.4), rotation)
  return { points: blob(spot(0, 2.2), 2.8, 1.6, random, 10), color: PACKED }
}

function waterPoint(draft: WorldDraft, at: Vec2, random: () => number): { water: Vec2[]; stains: Stain[] } {
  landmark(draft, 'waterTank', { x: at.x + 2.6, z: at.z - 1.2 }, 0)
  landmark(draft, 'pumpHouse', { x: at.x + 2.4, z: at.z + 1.0 }, 0)
  draft.forceFeature('pier', { x: at.x - 0.4, z: at.z + 1.5 }, 0.2)
  for (const [dx, dz] of [
    [-2.0, 0.4],
    [-1.4, -1.2],
    [1.1, -1.4],
  ]) draft.forceFeature('reeds', { x: at.x + dx, z: at.z + dz }, random() * Math.PI, 1)
  return { water: blob(at, 1.9, 1.4, random, 10), stains: [stain(at, 2.8, 2.2, MOSS, random)] }
}

function barnCorner(draft: WorldDraft, at: Vec2, random: () => number): Stain {
  landmark(draft, 'barn', at, 0, 0.75)
  draft.forceFeature('baleStack', { x: at.x - 2.6, z: at.z + 1.4 }, 0.2)
  draft.forceFeature('hayBale', { x: at.x - 1.4, z: at.z + 2.2 }, 1.1)
  return stain({ x: at.x - 0.8, z: at.z + 1.8 }, 2.4, 1.4, STRAW, random)
}

export const homesteadLandscape: Landscape = {
  map: (input, random) =>
    stageMap('homestead', input, random, LOOK, ({ draft, full }) => {
      const orchard: Rect = { minX: -12.6, maxX: -6.2, minZ: -12.6, maxZ: -6.6 }
      const garden: Rect = { minX: -12.6, maxX: -6.6, minZ: -4.8, maxZ: 0.8 }
      const corn: Rect = { minX: -4.6, maxX: 6.4, minZ: -12.6, maxZ: -9.0 }
      const stubble: Rect = { minX: 0.4, maxX: 6.4, minZ: -8.4, maxZ: -7.6 }
      const young: Rect = { minX: -3.4, maxX: 3.4, minZ: 8.6, maxZ: 12.6 }
      const beds: Rect = { minX: 4.2, maxX: 12.6, minZ: 10.8, maxZ: 12.8 }
      const paddock: Rect = { minX: 10.4, maxX: 12.8, minZ: -7.4, maxZ: 2.2 }
      const cows = pen(draft, paddock, 'homestead-map', random, { herd: [['cow', 2], ['sheep', 2]], gate: 'minX', rack: true })
      const home = homeYard(draft, { x: 2.8, z: -0.2 }, 0, random)
      const pond = waterPoint(draft, { x: -9.4, z: 4.4 }, random)
      const patches = [
        grove(draft, orchard, 'fruitTree', random, { ladders: 1 }),
        bedPlot(draft, garden, random, { crops: VEGETABLES }),
        cornField(draft, corn, 'ripe', full, random),
        cornField(draft, young, 'young', full, random),
        stubbleField(draft, stubble, random),
        bedPlot(draft, beds, random, { crops: ['sproutBed', 'herbBed', 'vegetableBed'] }),
        bayRow(draft, { x: 5.6, z: 8.2 }, 2),
        cows.patch,
        ...home.beds,
        flowers(draft, { minX: -12.4, maxX: -6.4, minZ: 11.4, maxZ: 12.4 }, random),
      ]
      edgeSides(draft, 'hedge', garden, ['minX', 'maxZ'], 0.45, [{ x: -7, z: 1.25 }])
      landmark(draft, 'nurseryHouse', { x: 11.4, z: 5.2 }, Math.PI / 2)
      landmark(draft, 'compostBins', { x: -5.4, z: -2.6 }, Math.PI / 2)
      draft.forceFeature('crateStack', { x: -5.2, z: -7.6 }, 0.3)
      draft.forceFeature('handcart', { x: -5.4, z: -9.4 }, 1.3)
      const stains = [home.stain, machinery(draft, { x: -2.6, z: -2.2 }, Math.PI / 2, random), barnCorner(draft, { x: 9.6, z: -10.6 }, random), ...pond.stains, stain({ x: 8.0, z: 6.4 }, 1.6, 0.9, PACKED, random)]
      draft.forceFeature('shadeTree', { x: -6.6, z: 5.2 }, 0.4, 1.0, '#4a8f37')
      landmark(draft, 'bench', { x: -6.2, z: 6.4 }, Math.PI * 0.8)
      return {
        patches,
        blocks: [orchard, garden, corn, young, beds, paddock],
        stains,
        waters: [pond.water, channel({ minX: -9.8, maxX: -9.4, minZ: 0.9, maxZ: 3.0 })],
        animals: cows.animals,
        pasture: cows.area,
        birds: [center(corn), center(young)],
        butterflies: [center(garden), center(beds), { x: -9.4, z: 11.9 }],
        clutterModels: FLOWERS,
        gaps: [{ x: -14.4, z: 10.5 }],
        paths: [
          { points: [{ x: 2.4, z: 5.0 }, { x: 2.8, z: 2.6 }], width: 1.0 },
          { points: [{ x: 7.2, z: 3.4 }, { x: 8.6, z: 6.6 }], width: 0.9 },
          { points: [{ x: -2.6, z: 6.0 }, { x: -5.6, z: 3.6 }, { x: -7.0, z: 3.4 }], width: 0.9 },
          { points: [{ x: 7.4, z: -4.6 }, { x: 8.6, z: -8.6 }], width: 0.9 },
        ],
      }
    }),
  farm: (input, random) =>
    stageFarm('homestead', input, random, LOOK, ({ draft, hw, hh, full }) => {
      const orchard: Rect = { minX: -hw - 8.6, maxX: -hw - 2.4, minZ: -hh - 0.4, maxZ: hh + 4.4 }
      const corn: Rect = { minX: -hw - 0.4, maxX: hw + 3.6, minZ: -hh - 7.8, maxZ: -hh - 2.4 }
      const beds: Rect = { minX: hw + 1.6, maxX: hw + 5.6, minZ: hh + 1.8, maxZ: hh + 4.4 }
      const paddock: Rect = { minX: hw + 5.2, maxX: hw + 9.4, minZ: -hh - 8, maxZ: -hh - 3 }
      const cows = pen(draft, paddock, 'homestead-farm', random, { herd: [['cow', 2], ['sheep', 1]], gate: 'minX' })
      const home = homeYard(draft, { x: -hw - 5.2, z: -hh - 6.4 }, 0, random)
      const pond = waterPoint(draft, { x: -hw - 5.6, z: hh + 7.6 }, random)
      const patches = [grove(draft, orchard, 'fruitTree', random, { height: 0.15, ladders: 1 }), cornField(draft, corn, 'growing', full, random), bedPlot(draft, beds, random, { crops: VEGETABLES }), cows.patch, bayRow(draft, { x: hw + 0.8, z: -hh - 9.6 }, 1), ...home.beds]
      return {
        patches,
        blocks: [orchard, corn, beds, paddock],
        stains: [home.stain, ...pond.stains, stain({ x: hw + 3, z: -1.8 }, 1.4, 0.9, PACKED, random)],
        waters: [pond.water],
        animals: cows.animals,
        pasture: cows.area,
        birds: [center(corn)],
        butterflies: [center(beds)],
        clutterModels: FLOWERS,
      }
    }),
}
