import { getWorld } from '@/data/worlds'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export function missionLabel(mission: MissionDefinition): string {
  if (mission.world === null || mission.slot === null) return 'Treinamento'
  return `${getWorld(mission.world).name} · Missão ${mission.slot}`
}
