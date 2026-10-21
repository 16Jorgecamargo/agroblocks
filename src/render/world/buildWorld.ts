import { createRandom, hashString } from '@/render/seededRandom'
import { celebrationLayout } from '@/render/world/celebrationLayout'
import { farmLayout } from '@/render/world/farmLayout'
import { homeLayout } from '@/render/world/homeLayout'
import { LANDSCAPES } from '@/render/world/landscapes/landscapes'
import { worldMapLayout } from '@/render/world/worldMapLayout'
import type { World, WorldInput } from '@/render/world/worldTypes'

export function gridSizeOf(cells: string[]): { width: number; height: number } {
  return { width: cells[0]?.trim().split(/\s+/).length ?? 0, height: cells.length }
}

export function buildWorld(input: WorldInput): World {
  const random = createRandom(hashString(`${input.layout}:${input.seed}:${input.gridWidth}x${input.gridHeight}`))
  const landscape = input.theme ? LANDSCAPES[input.theme] : undefined
  if (input.layout === 'worldMap') return landscape ? landscape.map(input, random) : worldMapLayout(input, random)
  if (input.layout === 'home') return homeLayout(input, random)
  if (input.layout === 'celebration') return celebrationLayout(input, random)
  return landscape ? landscape.farm(input, random) : farmLayout(input, random)
}
