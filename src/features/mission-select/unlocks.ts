import { MISSIONS } from '@/data/missions'
import type { SaveData } from '@/game/progress/types'

export function newlyUnlocked(save: SaveData, missionIds: string[], seen: string[]): string[] {
  const seenSet = new Set(seen)
  return missionIds.filter((id) => {
    const index = MISSIONS.findIndex((candidate) => candidate.id === id)
    const status = save.missions[id]?.status
    if (index <= 1) return false
    return (status === 'available' || status === 'completed') && !seenSet.has(id)
  })
}
