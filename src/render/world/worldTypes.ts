import type { WorldId } from '@/game/worlds/worldTypes'
import type { ModelId } from '@/render/models/manifest'
import type { WorldStyle } from '@/render/world/worldStyles'

export interface Vec2 {
  x: number
  z: number
}

export interface Rect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface Polyline {
  points: Vec2[]
  width: number
}

export interface PropItem {
  model: ModelId
  x: number
  z: number
  y?: number
  rotation: number
  scale: number
}

export type AnimalSpecies = 'cow' | 'horse' | 'pig' | 'sheep' | 'llama' | 'pug'

export interface AnimalSpawn {
  id: string
  species: AnimalSpecies
  x: number
  z: number
  area: Vec2[]
  scale: number
}

export type WorldLayout = 'farm' | 'worldMap' | 'home' | 'celebration'

export type WorldDensity = 'full' | 'light'

export interface WorldInput {
  layout: WorldLayout
  gridWidth: number
  gridHeight: number
  seed: string
  density: WorldDensity
  theme?: WorldId | null
}

export const FEATURE_KINDS = ['cornStalk', 'fruitTree', 'greenhouse', 'vegetableBed', 'hayBale', 'trough', 'hedge', 'stoneWall', 'meshFence', 'grainBin', 'grainDryer', 'cornWagon', 'scarecrow', 'toolShed', 'compostBins', 'wateringCan', 'chicken', 'packingShed', 'crateStack', 'orchardLadder', 'greenhouseBay', 'supportShed', 'waterTank', 'sprinkler', 'feedShed', 'baleStack', 'farmhouse', 'tractor', 'wheelbarrow', 'pier', 'shadeTree', 'bench', 'pergola', 'rainBarrel', 'workbench', 'basket', 'potStack', 'sackPallet', 'reeds', 'fallenFruit', 'barrels', 'supplyTank', 'cabbageBed', 'carrotBed', 'tomatoBed', 'pepperBed', 'onionBed', 'herbBed', 'sproutBed', 'beanTrellis', 'seedlingTable', 'trailer', 'plow', 'machineShed', 'grainAuger', 'harvestBin', 'pearTree', 'peachTree', 'cherryTree', 'citrusTree', 'sapling', 'berryBush', 'sortingTable', 'handcart', 'tallGreenhouse', 'nurseryHouse', 'pumpHouse', 'controlStation', 'animalShelter', 'hayRack', 'nestBoxes', 'equipmentRack'] as const

export type FeatureKind = (typeof FEATURE_KINDS)[number]

export interface WorldFeature {
  kind: FeatureKind
  x: number
  z: number
  rotation: number
  scale: number
  tint?: string
  y?: number
}

export interface WorldPaletteColors {
  grass: string
  grassDeep: string
  path: string
}

export interface World {
  ground: Rect
  island: boolean
  paths: Polyline[]
  river: Polyline | null
  trail: Vec2[]
  props: PropItem[]
  pasture: Vec2[] | null
  animals: AnimalSpawn[]
  butterflies: Vec2[]
  features: WorldFeature[]
  palette: WorldPaletteColors
  style: WorldStyle
  patches?: GroundPatch[]
  mounds?: Mound[]
  birds?: Vec2[]
  waters?: Vec2[][]
  stains?: Stain[]
  actors?: Actor[]
}

export interface Stain {
  points: Vec2[]
  color: string
}

export type GroundTexture = 'furrows' | 'stripes'

export interface GroundPatch {
  rect: Rect
  color: string
  height?: number
  texture?: GroundTexture
}

export interface Mound {
  x: number
  z: number
  radius: number
  height: number
}

export type ActorKind = 'worker' | 'tractor'

export type ActorTask = 'walk' | 'hoe' | 'water' | 'pick' | 'feed' | 'carry' | 'drive' | 'tend'

export interface Actor {
  id: string
  kind: ActorKind
  route: Vec2[]
  task: ActorTask
  tint: string
  speed: number
  facing?: number
  pause?: number
  y?: number
}
