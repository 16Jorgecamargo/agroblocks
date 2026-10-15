import type { GameEvent } from '@/game/world/types'
import type { RobotClip } from '@/render/robot/robotPoses'

interface StepInput {
  events: GameEvent[]
  failed: boolean
  celebrating: boolean
  moving: boolean
}

function workClip(event: GameEvent): RobotClip | null {
  if (event.type === 'plotChanged' && event.to === 'tilled') return 'till'
  if (event.type === 'plotChanged' && event.to === 'seeded') return 'plant'
  if (event.type === 'plotChanged' && event.to === 'harvested') return 'harvest'
  if (event.type === 'moistureChanged' && event.moisture === 'wet') return 'water'
  if (event.type === 'resourcesCollected') return 'collect'
  if (event.type === 'robotTurned') return 'turn'
  return null
}

export function clipForStep({ events, failed, celebrating, moving }: StepInput): RobotClip {
  if (failed) return 'error'
  if (celebrating) return 'success'
  for (const event of events) {
    const clip = workClip(event)
    if (clip) return clip
  }
  return moving ? 'move' : 'idle'
}
