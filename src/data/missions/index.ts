import { BARNYARD_MISSIONS } from '@/data/missions/barnyard'
import { CORNFIELD_MISSIONS } from '@/data/missions/cornfield'
import { GARDEN_MISSIONS } from '@/data/missions/garden'
import { GREENHOUSE_MISSIONS } from '@/data/missions/greenhouse'
import { HOMESTEAD_MISSIONS } from '@/data/missions/homestead'
import { mission00Training } from '@/data/missions/mission00Training'
import { ORCHARD_MISSIONS } from '@/data/missions/orchard'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const MISSIONS: MissionDefinition[] = [
  mission00Training,
  ...GARDEN_MISSIONS,
  ...CORNFIELD_MISSIONS,
  ...ORCHARD_MISSIONS,
  ...GREENHOUSE_MISSIONS,
  ...BARNYARD_MISSIONS,
  ...HOMESTEAD_MISSIONS,
].sort((a, b) => a.order - b.order)

export function getMission(id: string): MissionDefinition | undefined {
  return MISSIONS.find((mission) => mission.id === id)
}

export function getNextMission(id: string): MissionDefinition | undefined {
  const index = MISSIONS.findIndex((mission) => mission.id === id)
  return index < 0 ? undefined : MISSIONS[index + 1]
}
