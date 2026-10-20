import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { WorldDefinition, WorldId } from '@/game/worlds/worldTypes'

export const WORLDS: WorldDefinition[] = [
  { id: 'garden', order: 1, name: 'Horta', concept: 'sequencing', conceptLabel: 'Sequência', keyBlock: null },
  { id: 'cornfield', order: 2, name: 'Milharal', concept: 'repetition', conceptLabel: 'Repetição', keyBlock: 'controls_repeat_ext' },
  { id: 'orchard', order: 3, name: 'Pomar', concept: 'conditionals', conceptLabel: 'Condições', keyBlock: 'controls_if' },
  { id: 'greenhouse', order: 4, name: 'Estufa', concept: 'sensors', conceptLabel: 'Sensores', keyBlock: 'controls_whileUntil' },
  { id: 'barnyard', order: 5, name: 'Celeiro', concept: 'variables', conceptLabel: 'Variáveis', keyBlock: 'variables_set' },
  { id: 'homestead', order: 6, name: 'Fazenda completa', concept: 'efficiency', conceptLabel: 'Eficiência', keyBlock: 'procedures_defnoreturn' },
]

export function getWorld(id: WorldId): WorldDefinition {
  const world = WORLDS.find((item) => item.id === id)
  if (!world) throw new Error(`unknown world ${id}`)
  return world
}

export function missionsOfWorld(world: WorldId, missions: MissionDefinition[]): MissionDefinition[] {
  return missions.filter((mission) => mission.world === world).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
}
