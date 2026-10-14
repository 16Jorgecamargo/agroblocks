import { mission00Training } from '@/data/missions/mission00Training'
import { mission01FirstHarvest } from '@/data/missions/mission01FirstHarvest'
import { mission02RowPlanting } from '@/data/missions/mission02RowPlanting'
import { mission03SmartIrrigation } from '@/data/missions/mission03SmartIrrigation'
import { mission04AutoHarvest } from '@/data/missions/mission04AutoHarvest'
import { mission05LimitedResources } from '@/data/missions/mission05LimitedResources'
import { mission06EfficientFarm } from '@/data/missions/mission06EfficientFarm'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const MISSIONS: MissionDefinition[] = [
  mission00Training,
  mission01FirstHarvest,
  mission02RowPlanting,
  mission03SmartIrrigation,
  mission04AutoHarvest,
  mission05LimitedResources,
  mission06EfficientFarm,
].sort((a, b) => a.order - b.order)

export function getMission(id: string): MissionDefinition | undefined {
  return MISSIONS.find((mission) => mission.id === id)
}

export function getNextMission(id: string): MissionDefinition | undefined {
  const current = getMission(id)
  return current ? MISSIONS.find((mission) => mission.order === current.order + 1) : undefined
}
