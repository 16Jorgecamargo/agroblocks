import { WORLD_IDS } from '@/game/worlds/worldTypes'

const KEPT_SLOTS: Record<(typeof WORLD_IDS)[number], number[]> = {
  garden: [1, 4, 8, 9, 10],
  cornfield: [1, 2, 7, 9, 10],
  orchard: [1, 4, 8, 9, 10],
  greenhouse: [1, 3, 8, 9, 10],
  barnyard: [1, 5, 8, 9, 10],
  homestead: [1, 6, 7, 9, 10],
}

const pad = (slot: number) => String(slot).padStart(2, '0')

export const TEN_MISSION_IDS: ReadonlyMap<string, string> = new Map(
  WORLD_IDS.flatMap((world) => KEPT_SLOTS[world].map((oldSlot, index) => [`${world}-${pad(oldSlot)}`, `${world}-${pad(index + 1)}`] as const)),
)

export function renameTenMissionId(id: string): string | null {
  if (id === 'm0-training') return id
  return TEN_MISSION_IDS.get(id) ?? null
}
