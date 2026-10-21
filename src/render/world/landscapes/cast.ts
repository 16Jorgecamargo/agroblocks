import { headingAlong } from '@/render/world/actors/actorMotion'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { Actor, ActorTask, Vec2 } from '@/render/world/worldTypes'

export const SHIRTS = ['#c94f4f', '#4f7fc9', '#e0a83c', '#5aa36a', '#8a5ac9', '#e07a3c', '#3fa3a3']

const WALK_SPEED = 0.55
const DRIVE_SPEED = 1.1

export function walker(id: string, route: Vec2[], task: ActorTask, shirt: number, pause?: number, facing?: number): Actor {
  const actor: Actor = { id, kind: 'worker', route, task, tint: SHIRTS[shirt % SHIRTS.length], speed: WALK_SPEED }
  if (pause !== undefined) actor.pause = pause
  if (facing !== undefined) actor.facing = facing
  return actor
}

export function station(id: string, at: Vec2, toward: Vec2, task: ActorTask, shirt: number): Actor {
  return { id, kind: 'worker', route: [at], task, tint: SHIRTS[shirt % SHIRTS.length], speed: WALK_SPEED, facing: headingAlong(at, toward) }
}

export function tractorRun(id: string, route: Vec2[]): Actor {
  return { id, kind: 'tractor', route, task: 'drive', tint: SHIRTS[(id.length * 3) % SHIRTS.length], speed: DRIVE_SPEED, pause: 2.2 }
}

export function ladderPickers(draft: WorldDraft, prefix: string, count: number, shirt: number): Actor[] {
  return draft.features
    .filter((feature) => feature.kind === 'orchardLadder')
    .slice(0, count)
    .map((ladder, index) => ({ ...station(`${prefix}-picker-${index}`, { x: ladder.x + 0.15, z: ladder.z + 0.45 }, { x: ladder.x - 0.7, z: ladder.z - 0.5 }, 'pick', shirt + index), y: ladder.y ?? 0 }))
}
