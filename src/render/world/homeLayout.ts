import { farmLayout } from '@/render/world/farmLayout'
import type { World, WorldInput } from '@/render/world/worldTypes'

export function homeLayout(input: WorldInput, random: () => number): World {
  return farmLayout(input, random)
}
