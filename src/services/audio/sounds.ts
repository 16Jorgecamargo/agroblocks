import type { GameEvent } from '@/game/world/types'

export type SoundName = 'move' | 'turn' | 'plant' | 'water' | 'harvest' | 'collect' | 'error' | 'success'

function soundFor(event: GameEvent): SoundName | null {
  switch (event.type) {
    case 'robotMoved':
      return 'move'
    case 'robotTurned':
      return 'turn'
    case 'plotChanged':
      if (event.to === 'harvested') return 'harvest'
      if (event.to === 'seeded' || event.to === 'tilled') return 'plant'
      return null
    case 'moistureChanged':
      return event.moisture === 'wet' ? 'water' : null
    case 'resourcesCollected':
      return 'collect'
    case 'resourceChanged':
      return null
  }
}

export function soundsForEvents(events: GameEvent[]): SoundName[] {
  const result: SoundName[] = []
  for (const event of events) {
    const sound = soundFor(event)
    if (sound && !result.includes(sound)) result.push(sound)
  }
  return result
}
