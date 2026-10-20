import { missionsOfWorld } from '@/data/worlds'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { isWorldOpen, worldStep } from '@/game/progress/progression'
import type { MissionRef, SaveData } from '@/game/progress/types'
import type { WorldId } from '@/game/worlds/worldTypes'

export type TrailNode = { kind: 'preTest' } | { kind: 'mission'; mission: MissionDefinition } | { kind: 'postTest' }

export type NodeState = 'done' | 'current' | 'open' | 'locked'

export function trailNodes(world: WorldId, missions: MissionDefinition[]): TrailNode[] {
  return [{ kind: 'preTest' }, ...missionsOfWorld(world, missions).map((mission): TrailNode => ({ kind: 'mission', mission })), { kind: 'postTest' }]
}

export function nodeKey(node: TrailNode): string {
  return node.kind === 'mission' ? node.mission.id : node.kind
}

export function nodeState(save: SaveData, world: WorldId, node: TrailNode, missions: MissionRef[]): NodeState {
  if (!isWorldOpen(save, world, missions)) return 'locked'
  const step = worldStep(save, world, missions)
  const tests = save.assessments[world]
  if (node.kind === 'preTest') return tests?.pre ? 'done' : 'current'
  if (node.kind === 'postTest') {
    if (tests?.post) return 'done'
    return step.kind === 'postTest' ? 'current' : 'locked'
  }
  const status = save.missions[node.mission.id]?.status ?? 'locked'
  if (status === 'completed') return 'done'
  if (step.kind === 'mission' && step.missionId === node.mission.id) return 'current'
  return status === 'available' && tests?.pre ? 'open' : 'locked'
}
