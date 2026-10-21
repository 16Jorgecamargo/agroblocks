import type { World, WorldInput } from '@/render/world/worldTypes'

export interface Landscape {
  map(input: WorldInput, random: () => number): World
  farm(input: WorldInput, random: () => number): World
}
