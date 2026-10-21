import type { ModelId } from '@/render/models/manifest'
import type { FeatureKind } from '@/render/world/worldTypes'

export const CLUTTER_MODELS = ['grass-short', 'grass-tall', 'clover', 'flower-patch', 'flower-red', 'flower-yellow', 'flower-purple', 'fern', 'mushrooms', 'pebble'] as const satisfies readonly ModelId[]

export const TREE_MODELS = ['tree-a', 'tree-b', 'tree-c', 'tree-d', 'pine', 'pine-round'] as const satisfies readonly ModelId[]

export const FOREST_MODELS: readonly ModelId[] = [...TREE_MODELS, ...TREE_MODELS, 'bush-large', 'bush', 'rock-medium', 'rock-a']

export const TALL_MODELS: ReadonlySet<ModelId> = new Set<ModelId>([
  ...TREE_MODELS,
  'apple-tree',
  'barn',
  'small-barn',
  'open-barn',
  'silo',
  'silo-house',
  'tower-windmill',
  'windmill',
  'water-tower',
  'reservoir',
])

export const EXEMPT_MODELS: ReadonlySet<ModelId> = new Set<ModelId>(['fence', 'fence-gate', 'bridge', 'sign', 'lily'])

const FOOTPRINTS: Partial<Record<ModelId, number>> = {
  barn: 3.2,
  'small-barn': 1.8,
  'open-barn': 2.2,
  silo: 1.3,
  'silo-house': 2,
  'tower-windmill': 1.4,
  windmill: 1.8,
  'water-tower': 1.4,
  reservoir: 0.9,
  'chicken-coop': 0.9,
  'log-stack': 0.7,
  'apple-tree': 1.1,
  'rock-medium': 0.7,
  'rock-a': 0.6,
  'bush-large': 0.6,
  bush: 0.4,
}

const CLUTTER_SET: ReadonlySet<ModelId> = new Set<ModelId>(CLUTTER_MODELS)

export function isClutter(model: ModelId): boolean {
  return CLUTTER_SET.has(model)
}

export function footprint(model: ModelId): number {
  if (CLUTTER_SET.has(model)) return 0.15
  if ((TREE_MODELS as readonly ModelId[]).includes(model)) return 0.8
  return FOOTPRINTS[model] ?? 0.4
}

export const FEATURE_FOOTPRINTS: Record<FeatureKind, number> = {
  cornStalk: 0.22,
  fruitTree: 0.9,
  greenhouse: 2.2,
  vegetableBed: 0.8,
  hayBale: 0.55,
  trough: 0.6,
  hedge: 0.3,
  stoneWall: 0.3,
  meshFence: 0.2,
  grainBin: 1.1,
  grainDryer: 1.3,
  cornWagon: 1.0,
  scarecrow: 0.4,
  toolShed: 1.3,
  compostBins: 0.9,
  wateringCan: 0.25,
  chicken: 0.25,
}

export const TALL_FEATURES: ReadonlySet<FeatureKind> = new Set<FeatureKind>(['greenhouse', 'fruitTree', 'grainBin', 'grainDryer', 'toolShed'])

export const GRID_CLEARANCE = 1.2

export const FRONT_CLEARANCE = 5

export const RIVER_BANK = 0.3
