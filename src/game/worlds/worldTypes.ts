import type { BlockType } from '@/blocks/blockTypes'
import type { MissionConcept } from '@/game/missions/missionTypes'

export const WORLD_IDS = ['garden', 'cornfield', 'orchard', 'greenhouse', 'barnyard', 'homestead'] as const

export type WorldId = (typeof WORLD_IDS)[number]

export const MISSIONS_PER_WORLD = 5

export type MissionRole = 'learn' | 'practice' | 'challenge' | 'debug' | 'final'

export const ROLE_LABELS: Record<MissionRole, string> = {
  learn: 'Conhecer',
  practice: 'Praticar',
  challenge: 'Apertar',
  debug: 'Consertar',
  final: 'Desafio final',
}

export function roleForSlot(slot: number): MissionRole {
  if (slot <= 1) return 'learn'
  if (slot === 2) return 'practice'
  if (slot === 3) return 'challenge'
  if (slot === 4) return 'debug'
  return 'final'
}

export interface WorldDefinition {
  id: WorldId
  order: number
  name: string
  concept: Exclude<MissionConcept, 'interface'>
  conceptLabel: string
  keyBlock: BlockType | null
}
