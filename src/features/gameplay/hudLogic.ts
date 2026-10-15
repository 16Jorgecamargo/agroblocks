import { programBlockTypes } from '@/blocks/analysis/programBlockTypes'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export type ResourceLevel = 'ok' | 'low' | 'empty'

export interface Point {
  x: number
  y: number
}

export function resourceLevel(value: number | null, max: number | null): ResourceLevel {
  if (value === null || max === null || max <= 0) return 'ok'
  if (value <= 0) return 'empty'
  return value / max <= 0.2 ? 'low' : 'ok'
}

export function resourceMaxima(mission: MissionDefinition): { seeds: number | null; water: number | null; energy: number | null } {
  const { resources } = mission
  return {
    seeds: resources.seedCapacity ?? resources.seeds,
    water: resources.waterCapacity ?? resources.water,
    energy: resources.energy,
  }
}

export function arcKeyframes(from: Point, to: Point, lift = 120): { x: number[]; y: number[] } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return { x: [0, dx / 2, dx], y: [0, Math.min(0, dy) / 2 - lift, dy] }
}

export type HudResource = 'seeds' | 'water' | 'energy' | 'harvest'

export function visibleResources(mission: MissionDefinition): HudResource[] {
  const blocks = programBlockTypes(mission.referenceSolution)
  const { resources } = mission
  const visible: HudResource[] = []
  if (blocks.has('farm_plant') || resources.seeds !== null) visible.push('seeds')
  if (blocks.has('farm_water') || resources.water !== null) visible.push('water')
  if (resources.energy !== null) visible.push('energy')
  if (blocks.has('farm_harvest')) visible.push('harvest')
  return visible
}
