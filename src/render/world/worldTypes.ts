import type { ModelId } from '@/render/models/manifest'

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
}

export type WorldLayout = 'farm' | 'map' | 'home'

export type WorldDensity = 'full' | 'light'

export interface WorldInput {
  layout: WorldLayout
  gridWidth: number
  gridHeight: number
  seed: string
  density: WorldDensity
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
}
