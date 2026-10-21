import { center, landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { blob, scatterCover, stain, turn } from '@/render/world/landscapes/natureKit'
import { ladderPickers, station, walker } from '@/render/world/landscapes/cast'
import { stageFarm, stageMap, type StageLook } from '@/render/world/landscapes/stage'
import { FEATURE_FOOTPRINTS } from '@/render/world/worldCatalog'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { FeatureKind, GroundPatch, Rect, Stain, Vec2 } from '@/render/world/worldTypes'

const UNDER = ['#5a9c41', '#66a646', '#579a3f', '#6aab4a', '#5fa143']
const YARD = '#b9a77e'
const MOSS = '#4f9a3a'
const LEAVES = '#7fa64a'
const MEADOW = '#9fd06a'
const FLOWERS = ['flower-red', 'flower-yellow', 'flower-purple', 'flower-patch', 'clover'] as const
const LOOK: StageLook = { trees: ['tree-a', 'tree-b', 'tree-c', 'tree-d', 'tree-b', 'pine-round', 'tree-a'] }

export type FruitKind = Extract<FeatureKind, 'fruitTree' | 'pearTree' | 'peachTree' | 'cherryTree' | 'citrusTree'>

export const FRUIT_COLORS: Record<FruitKind, string> = {
  fruitTree: '#e0473c',
  pearTree: '#c9d65a',
  peachTree: '#f29a6a',
  cherryTree: '#a3203a',
  citrusTree: '#f29a2e',
}

export interface GroveOptions {
  tint?: string
  height?: number
  step?: [number, number]
  ladders?: number
}

export function grove(draft: WorldDraft, rect: Rect, kind: FruitKind, random: () => number, options: GroveOptions = {}): GroundPatch {
  const [stepX, stepZ] = options.step ?? [1.75, 1.65]
  const height = options.height ?? 0
  const tint = options.tint ?? FRUIT_COLORS[kind]
  const columns = Math.max(1, Math.floor((rect.maxX - rect.minX) / stepX))
  const rows = Math.max(1, Math.floor((rect.maxZ - rect.minZ) / stepZ))
  const padX = (rect.maxX - rect.minX - columns * stepX) / 2
  const padZ = (rect.maxZ - rect.minZ - rows * stepZ) / 2
  let ladders = options.ladders ?? 1
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const edge = row === 0 || column === 0 || row === rows - 1 || column === columns - 1
      if (edge && random() < 0.18) continue
      const point = { x: rect.minX + padX + (column + 0.5 + (row % 2) * 0.18) * stepX + (random() - 0.5) * 0.15, z: rect.minZ + padZ + (row + 0.5) * stepZ + (random() - 0.5) * 0.15 }
      const young = random() < 0.1
      const treeKind: FeatureKind = young ? 'sapling' : kind
      const scale = young ? 1 : 0.82 + random() * 0.2
      if (!draft.clearOfRoutes(point, FEATURE_FOOTPRINTS[treeKind] * scale, !young)) continue
      draft.forceFeature(treeKind, point, random() * Math.PI * 2, scale, young ? undefined : tint, height)
      if (young) continue
      if (random() < 0.28) draft.forceFeature('fallenFruit', { x: point.x + 0.35, z: point.z + 0.3 }, random() * Math.PI, 1, FRUIT_COLORS[kind], height)
      if (ladders > 0 && column > 0 && row === rows - 1) {
        draft.forceFeature('orchardLadder', { x: point.x + 0.7, z: point.z + 0.5 }, 0.8, 1, undefined, height)
        draft.forceFeature('basket', { x: point.x - 0.6, z: point.z + 0.7 }, random(), 1, FRUIT_COLORS[kind], height)
        ladders -= 1
      }
    }
  }
  const color = UNDER[Math.floor(random() * UNDER.length)]
  return height > 0 ? { rect, color, height } : { rect, color }
}

export function packingYard(draft: WorldDraft, at: Vec2, rotation: number, random: () => number): Stain {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'packingShed', at, rotation)
  landmark(draft, 'sortingTable', spot(0.4, 2.2), rotation)
  landmark(draft, 'crateStack', spot(2.3, -0.4), rotation + 0.2)
  landmark(draft, 'crateStack', spot(-2.3, 0.5), rotation - 0.3)
  landmark(draft, 'handcart', spot(2.6, 1.8), rotation + 0.5)
  landmark(draft, 'waterTank', spot(-2.6, -1.4), rotation)
  landmark(draft, 'toolShed', spot(-1.0, -2.6), rotation, 0.8)
  landmark(draft, 'compostBins', spot(1.6, -2.4), rotation, 0.85)
  draft.forceFeature('basket', spot(-1.3, 2.4), rotation, 1, '#e0473c')
  draft.forceFeature('basket', spot(1.9, 3.0), rotation + 0.7, 1, '#f29a2e')
  draft.forceFeature('wheelbarrow', spot(-2.6, 1.9), rotation + 2.4)
  return { points: blob(spot(0.1, 0.6), 3.6, 2.9, random, 12), color: YARD }
}

function berryRows(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  const tints = ['#5a3a8a', '#d9473c', '#5a3a8a']
  let row = 0
  for (let z = rect.minZ + 0.5; z < rect.maxZ; z += 1.1) {
    for (let x = rect.minX + 0.5; x < rect.maxX; x += 0.95) {
      const point = { x: x + (random() - 0.5) * 0.12, z }
      if (draft.clearOfRoutes(point, 0.45)) draft.forceFeature('berryBush', point, random() * Math.PI * 2, 0.85 + random() * 0.25, tints[row % tints.length])
    }
    row += 1
  }
  return { rect, color: '#6b8f3e' }
}

function flowerStrip(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  const corners = [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
  scatterCover(draft, corners, FLOWERS, Math.round((rect.maxX - rect.minX) * (rect.maxZ - rect.minZ) * 0.45), random)
  return { rect, color: MEADOW }
}

function nurseryCorner(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  for (let z = rect.minZ + 0.5; z < rect.maxZ; z += 0.9) {
    for (let x = rect.minX + 0.5; x < rect.maxX; x += 0.8) {
      const point = { x: x + (random() - 0.5) * 0.1, z }
      if (draft.clearOfRoutes(point, 0.3)) draft.forceFeature('sapling', point, random() * Math.PI * 2, 0.75 + random() * 0.3)
    }
  }
  return { rect, color: '#8a6448', texture: 'furrows' }
}

function pondCorner(draft: WorldDraft, at: Vec2, random: () => number): { water: Vec2[]; stain: Stain } {
  draft.forceFeature('pier', { x: at.x + 0.4, z: at.z + 1.7 }, 0.1)
  for (const [dx, dz] of [
    [-2.2, 0.2],
    [-1.6, -1.2],
    [2.1, -0.6],
    [1.5, 1.4],
  ]) draft.forceFeature('reeds', { x: at.x + dx, z: at.z + dz }, random() * Math.PI, 0.9 + random() * 0.3)
  draft.force('lily', { x: at.x - 0.6, z: at.z - 0.3 }, random() * Math.PI, 1)
  draft.force('lily', { x: at.x + 0.8, z: at.z + 0.2 }, random() * Math.PI, 1)
  return { water: blob(at, 2.1, 1.5, random, 11), stain: stain(at, 3.0, 2.4, MOSS, random) }
}

function restSpot(draft: WorldDraft, at: Vec2, facing: number): void {
  draft.forceFeature('shadeTree', at, 0.3, 1.0, '#4a8f37')
  landmark(draft, 'bench', turn(at, facing, 0, 1.3), facing)
}

export const orchardLandscape: Landscape = {
  map: (input, random) =>
    stageMap('orchard', input, random, LOOK, ({ draft }) => {
      const apples: Rect = { minX: -12.4, maxX: -4.8, minZ: -12.4, maxZ: -5.8 }
      const cherries: Rect = { minX: -1.0, maxX: 6.4, minZ: -7.0, maxZ: -2.4 }
      const golden: Rect = { minX: -12.6, maxX: -5.6, minZ: 0.4, maxZ: 6.0 }
      const peaches: Rect = { minX: 5.8, maxX: 12.8, minZ: 1.8, maxZ: 7.6 }
      const citrus: Rect = { minX: 5.2, maxX: 12.8, minZ: 9.0, maxZ: 12.8 }
      const young: Rect = { minX: -3.6, maxX: 2.8, minZ: 9.6, maxZ: 12.8 }
      const pears: Rect = { minX: 11.2, maxX: 12.8, minZ: -8.6, maxZ: 0.2 }
      const nursery: Rect = { minX: 10.2, maxX: 12.8, minZ: -12.8, maxZ: -10.2 }
      const berries: Rect = { minX: -4.0, maxX: -1.9, minZ: 3.6, maxZ: 7.0 }
      const patches = [
        grove(draft, apples, 'fruitTree', random, { height: 0.25, ladders: 2 }),
        grove(draft, cherries, 'cherryTree', random, { height: 0.15 }),
        grove(draft, golden, 'fruitTree', random, { tint: '#f2c94c' }),
        grove(draft, peaches, 'peachTree', random, { step: [1.75, 1.7] }),
        grove(draft, citrus, 'citrusTree', random, { step: [1.85, 1.75] }),
        grove(draft, young, 'fruitTree', random, { step: [1.6, 1.5], ladders: 0 }),
        grove(draft, pears, 'pearTree', random, { step: [1.6, 1.5], ladders: 0 }),
        nurseryCorner(draft, nursery, random),
        berryRows(draft, berries, random),
        flowerStrip(draft, { minX: 6.4, maxX: 12.6, minZ: 8.75, maxZ: 9.0 }, random),
        flowerStrip(draft, { minX: -12.4, maxX: -6.6, minZ: 6.4, maxZ: 7.0 }, random),
        flowerStrip(draft, { minX: -4.4, maxX: -0.8, minZ: -11.6, maxZ: -10.6 }, random),
      ]
      const pond = pondCorner(draft, { x: -8.8, z: 9.8 }, random)
      const stains = [
        packingYard(draft, { x: 1.6, z: 5.6 }, 0, random),
        pond.stain,
        stain({ x: -8.2, z: -9.0 }, 2.4, 1.6, LEAVES, random),
        stain({ x: 9.4, z: 5.0 }, 2.0, 1.4, LEAVES, random),
        stain({ x: 4.4, z: -8.0 }, 1.4, 0.8, MOSS, random),
      ]
      landmark(draft, 'crateStack', { x: 4.4, z: 2.4 }, 0.4)
      draft.forceFeature('handcart', { x: 5.4, z: -4.0 }, 1.2)
      restSpot(draft, { x: -5.6, z: 8.6 }, Math.PI * 0.8)
      restSpot(draft, { x: -1.8, z: -4.6 }, Math.PI * 0.2)
      return {
        patches,
        blocks: [apples, cherries, golden, peaches, citrus, young, nursery, berries],
        stains,
        waters: [pond.water],
        butterflies: [center(berries), { x: 9.4, z: 8 }, { x: -9.4, z: 6.1 }, { x: -2.6, z: -11.1 }],
        clutterModels: FLOWERS,
        actors: [
          ...ladderPickers(draft, 'orchard', 3, 0),
          walker('orchard-carrier', [{ x: 2.8, z: 3.4 }, { x: 4.4, z: 6.6 }, { x: 5.6, z: 8.3 }, { x: 11.6, z: 8.3 }], 'carry', 3, 2.4),
          station('orchard-sorter', { x: 2.0, z: 8.7 }, { x: 2.0, z: 7.8 }, 'tend', 4),
          walker('orchard-nursery', [{ x: 9.8, z: -10.0 }, { x: 9.8, z: -12.4 }], 'water', 5, 3, Math.PI / 2),
        ],
        paths: [
          { points: [{ x: 2.6, z: 3.0 }, { x: 4.4, z: 6.6 }, { x: 5.6, z: 8.3 }, { x: 12.6, z: 8.3 }], width: 0.9 },
          { points: [{ x: -4.4, z: 0.6 }, { x: -4.8, z: 5.6 }, { x: -5.6, z: 7.4 }, { x: -7.2, z: 8.2 }], width: 0.9 },
          { points: [{ x: 9.6, z: -6.6 }, { x: 10.6, z: -9.4 }], width: 0.8 },
        ],
      }
    }),
  farm: (input, random) =>
    stageFarm('orchard', input, random, LOOK, ({ draft, hw, hh }) => {
      const west: Rect = { minX: -hw - 8.4, maxX: -hw - 2.2, minZ: -hh - 1, maxZ: hh + 3.6 }
      const back: Rect = { minX: -hw - 0.6, maxX: hw + 4.2, minZ: -hh - 7.8, maxZ: -hh - 2.4 }
      const east: Rect = { minX: hw + 5.6, maxX: hw + 9.4, minZ: -hh - 7.8, maxZ: -hh - 1.8 }
      const berries: Rect = { minX: hw + 1.8, maxX: hw + 5.2, minZ: hh + 2, maxZ: hh + 4.4 }
      const patches = [
        grove(draft, west, 'fruitTree', random, { height: 0.2, ladders: 1 }),
        grove(draft, back, 'citrusTree', random, { ladders: 1 }),
        grove(draft, east, 'peachTree', random, { height: 0.15, ladders: 0 }),
        berryRows(draft, berries, random),
        flowerStrip(draft, { minX: hw + 1.8, maxX: hw + 5.2, minZ: hh + 4.8, maxZ: hh + 5.6 }, random),
      ]
      const pond = pondCorner(draft, { x: -hw - 5, z: hh + 7.4 }, random)
      const stains = [packingYard(draft, { x: -hw - 5.4, z: -hh - 5.4 }, 0, random), pond.stain, stain({ x: hw + 3, z: -1.8 }, 1.6, 1.0, LEAVES, random)]
      restSpot(draft, { x: hw + 6.6, z: hh + 6.4 }, Math.PI * 0.85)
      return { patches, blocks: [west, back, east, berries], stains, waters: [pond.water], butterflies: [center(berries)], clutterModels: FLOWERS, actors: [...ladderPickers(draft, 'orchard-farm', 2, 0), station('orchard-farm-sorter', { x: -hw - 5.0, z: -hh - 2.4 }, { x: -hw - 5.0, z: -hh - 3.2 }, 'tend', 4)] }
    }),
}
