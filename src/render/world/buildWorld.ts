import { createRandom, hashString } from '@/render/seededRandom'
import { farmLayout } from '@/render/world/farmLayout'
import { homeLayout } from '@/render/world/homeLayout'
import { mapLayout } from '@/render/world/mapLayout'
import type { World, WorldInput } from '@/render/world/worldTypes'

export function gridSizeOf(cells: string[]): { width: number; height: number } {
  return { width: cells[0]?.trim().split(/\s+/).length ?? 0, height: cells.length }
}

export function buildWorld(input: WorldInput): World {
  const random = createRandom(hashString(`${input.layout}:${input.seed}:${input.gridWidth}x${input.gridHeight}`))
  if (input.layout === 'map') return mapLayout(input, random)
  if (input.layout === 'home') return homeLayout(input, random)
  return farmLayout(input, random)
}
