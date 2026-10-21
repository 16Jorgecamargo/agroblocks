import { landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { blob, rectStain, scatterCover, stain, turn } from '@/render/world/landscapes/natureKit'
import { bedPlot, channel, edgeRun, edgeSides } from '@/render/world/landscapes/plots'
import { center } from '@/render/world/landscapes/scaffold'
import { stageFarm, stageMap, type StageLook } from '@/render/world/landscapes/stage'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { FeatureKind, GroundPatch, Rect, Stain, Vec2 } from '@/render/world/worldTypes'

const GRAVEL = '#d9d2c3'
const PAVED = '#cfc9b8'
const MOSS = '#6aa86a'
const DAMP = '#7fae8a'
const MEADOW = '#a9d98c'
const BAY = 3
const FLOWERS = ['flower-yellow', 'flower-purple', 'flower-patch', 'clover'] as const
const LEAFY: FeatureKind[] = ['cabbageBed', 'vegetableBed', 'herbBed', 'vegetableBed']
const OUTDOOR: FeatureKind[] = ['vegetableBed', 'carrotBed', 'onionBed', 'cabbageBed', 'herbBed']
const LOOK: StageLook = { trees: ['tree-b', 'tree-d', 'pine-round', 'tree-a', 'tree-b'], openSides: ['maxX', 'maxZ', 'minX'] }

export function bayRow(draft: WorldDraft, start: Vec2, count: number): GroundPatch {
  for (let index = 0; index < count; index += 1) landmark(draft, 'greenhouseBay', { x: start.x + index * BAY, z: start.z }, 0)
  landmark(draft, 'supportShed', { x: start.x + count * BAY - 0.2, z: start.z }, 0)
  return { rect: { minX: start.x - 1.8, maxX: start.x + count * BAY + 1, minZ: start.z - 1.4, maxZ: start.z + 1.4 }, color: GRAVEL }
}

function tomatoHouse(draft: WorldDraft, at: Vec2): GroundPatch {
  landmark(draft, 'tallGreenhouse', at, 0)
  return { rect: { minX: at.x - 2.5, maxX: at.x + 2.5, minZ: at.z - 1.6, maxZ: at.z + 1.6 }, color: GRAVEL }
}

function waterWorks(draft: WorldDraft, at: Vec2, random: () => number): Stain {
  landmark(draft, 'waterTank', at, 0)
  landmark(draft, 'pumpHouse', { x: at.x + 0.2, z: at.z + 2.2 }, 0)
  landmark(draft, 'controlStation', { x: at.x + 2.2, z: at.z + 3.4 }, 0)
  landmark(draft, 'rainBarrel', { x: at.x - 1.2, z: at.z + 1.4 }, 0)
  landmark(draft, 'barrels', { x: at.x + 1.6, z: at.z - 0.6 }, 0.4)
  return stain({ x: at.x + 0.6, z: at.z + 1.6 }, 2.2, 2.8, DAMP, random)
}

function workStation(draft: WorldDraft, at: Vec2, rotation: number): void {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'workbench', at, rotation)
  landmark(draft, 'seedlingTable', spot(2.0, 0.1), rotation)
  landmark(draft, 'potStack', spot(-1.3, 0.3), rotation)
  landmark(draft, 'sackPallet', spot(-1.6, 1.4), rotation + 0.2)
  draft.forceFeature('crateStack', spot(3.6, 0.4), rotation)
  draft.forceFeature('handcart', spot(1.2, 1.5), rotation + 0.3)
}

function packingCorner(draft: WorldDraft, at: Vec2, random: () => number): Stain {
  landmark(draft, 'packingShed', at, 0)
  landmark(draft, 'supportShed', { x: at.x - 3.2, z: at.z + 0.2 }, 0, 0.8)
  landmark(draft, 'compostBins', { x: at.x + 2.6, z: at.z - 1.0 }, 0)
  draft.forceFeature('crateStack', { x: at.x + 2.4, z: at.z + 0.8 }, 0.3)
  draft.forceFeature('wheelbarrow', { x: at.x - 1.2, z: at.z + 1.8 }, 2.2)
  return { points: blob({ x: at.x - 0.4, z: at.z + 0.2 }, 3.6, 2.0, random, 11), color: PAVED }
}

function flowerStrip(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  const corners = [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
  scatterCover(draft, corners, FLOWERS, Math.round((rect.maxX - rect.minX) * (rect.maxZ - rect.minZ) * 0.5), random)
  return { rect, color: MEADOW }
}

function sprinklers(draft: WorldDraft, rect: Rect): void {
  for (const t of [0.25, 0.75]) draft.forceFeature('sprinkler', { x: rect.minX + (rect.maxX - rect.minX) * t, z: rect.maxZ + 0.35 }, t * 3, 1)
}

export const greenhouseLandscape: Landscape = {
  map: (input, random) =>
    stageMap('greenhouse', input, random, LOOK, ({ draft }) => {
      const backBeds: Rect = { minX: -12.6, maxX: -4.6, minZ: -12.6, maxZ: -9.0 }
      const herbs: Rect = { minX: 4.6, maxX: 12.6, minZ: -12.6, maxZ: -9.4 }
      const loop: Rect = { minX: 0.6, maxX: 5.8, minZ: 4.8, maxZ: 8.6 }
      const side: Rect = { minX: 10.6, maxX: 12.8, minZ: -6.8, maxZ: 3.2 }
      const west: Rect = { minX: -12.6, maxX: -7.0, minZ: -1.4, maxZ: 2.8 }
      const patches = [
        bayRow(draft, { x: 0.8, z: -5.0 }, 3),
        tomatoHouse(draft, { x: -5.6, z: -4.8 }),
        bedPlot(draft, backBeds, random, { crops: OUTDOOR }),
        bedPlot(draft, herbs, random, { crops: ['herbBed', 'sproutBed', 'onionBed'] }),
        bedPlot(draft, loop, random, { crops: LEAFY }),
        bedPlot(draft, side, random, { crops: ['tomatoBed', 'beanTrellis', 'pepperBed'], along: 'z' }),
        bedPlot(draft, west, random, { crops: OUTDOOR }),
        flowerStrip(draft, { minX: 10.4, maxX: 12.8, minZ: 9.8, maxZ: 12.6 }, random),
        flowerStrip(draft, { minX: -12.4, maxX: -6.0, minZ: 10.6, maxZ: 11.6 }, random),
      ]
      landmark(draft, 'nurseryHouse', { x: -1.2, z: -10.4 }, 0)
      landmark(draft, 'seedlingTable', { x: 1.8, z: -10.8 }, 0)
      landmark(draft, 'seedlingTable', { x: 1.8, z: -9.2 }, 0)
      sprinklers(draft, backBeds)
      sprinklers(draft, loop)
      sprinklers(draft, west)
      workStation(draft, { x: 1.4, z: -1.6 }, 0)
      const stains = [
        rectStain({ minX: -8.2, maxX: 9.8, minZ: -3.0, maxZ: -0.6 }, PAVED, random, 0.3),
        waterWorks(draft, { x: -10.6, z: -6.2 }, random),
        packingCorner(draft, { x: -8.4, z: 8.6 }, random),
        stain({ x: 0.6, z: -7.6 }, 1.6, 0.8, MOSS, random),
        stain({ x: 8.6, z: -1.6 }, 1.0, 1.4, MOSS, random),
      ]
      edgeSides(draft, 'hedge', loop, ['maxZ'], 0.45, [{ x: 0.6, z: 9.05 }])
      edgeRun(draft, 'meshFence', { x: -12.8, z: -13.2 }, { x: 12.8, z: -13.2 }, [{ x: 0, z: -13.2 }])
      draft.forceFeature('shadeTree', { x: 11.4, z: 6.4 }, 0.6, 0.9, '#5fa045')
      landmark(draft, 'bench', { x: 11.0, z: 7.8 }, Math.PI)
      draft.forceFeature('shadeTree', { x: -4.6, z: 12.0 }, 1.6, 0.85, '#5fa045')
      for (const [x, z] of [
        [-12.2, 1.6],
        [11.8, -8.2],
        [6.0, 13.0],
      ]) draft.forceFeature('shadeTree', { x, z }, x, 0.75, '#6aae4a')
      const waters = [channel({ minX: -8.2, maxX: 9.8, minZ: -6.85, maxZ: -6.5 }), channel({ minX: -12.6, maxX: -4.6, minZ: -8.6, maxZ: -8.25 })]
      return {
        patches,
        blocks: [backBeds, herbs, loop, side, west],
        stains,
        waters,
        butterflies: [center(loop), { x: -9, z: 11.1 }],
        clutterModels: FLOWERS,
        gaps: [{ x: -14.4, z: 6 }],
        paths: [
          { points: [{ x: 0.2, z: 1.0 }, { x: 0.4, z: -0.6 }, { x: -0.6, z: -3.6 }, { x: -0.8, z: -8.8 }], width: 0.9 },
          { points: [{ x: -6.8, z: 4.4 }, { x: -7.6, z: 6.8 }], width: 0.9 },
        ],
      }
    }),
  farm: (input, random) =>
    stageFarm('greenhouse', input, random, LOOK, ({ draft, hw, hh }) => {
      const west: Rect = { minX: -hw - 8.2, maxX: -hw - 2.2, minZ: -hh - 0.6, maxZ: hh + 3.6 }
      const front: Rect = { minX: hw + 1.6, maxX: hw + 5.8, minZ: hh + 1.8, maxZ: hh + 4.6 }
      const patches = [bayRow(draft, { x: -hw - 0.4, z: -hh - 5.4 }, 3), tomatoHouse(draft, { x: hw + 7.4, z: -hh - 4.6 }), bedPlot(draft, west, random, { crops: OUTDOOR, along: 'z' }), bedPlot(draft, front, random, { crops: LEAFY })]
      sprinklers(draft, front)
      sprinklers(draft, west)
      workStation(draft, { x: -hw + 2.6, z: -hh - 2.6 }, Math.PI)
      const stains = [waterWorks(draft, { x: -hw - 5.6, z: -hh - 6.6 }, random), rectStain({ minX: -hw - 1.6, maxX: hw + 9.6, minZ: -hh - 3.6, maxZ: -hh - 1.6 }, PAVED, random, 0.25), stain({ x: hw + 3.2, z: -1.8 }, 1.2, 0.8, MOSS, random)]
      landmark(draft, 'nurseryHouse', { x: -hw - 5.2, z: hh + 6.4 }, 0)
      draft.forceFeature('shadeTree', { x: hw + 6.4, z: hh + 6.0 }, 0.6, 0.9, '#5fa045')
      return { patches, blocks: [west, front], stains, waters: [channel({ minX: -hw - 0.6, maxX: hw + 9.6, minZ: -hh - 7.1, maxZ: -hh - 6.75 })], butterflies: [center(front)], clutterModels: FLOWERS }
    }),
}
