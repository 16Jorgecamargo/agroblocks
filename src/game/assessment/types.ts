import type { Facing } from '@/game/world/types'
import type { WorldId } from '@/game/worlds/worldTypes'

export const ITEMS_PER_FORM = 5

export type AssessmentSkill = 'build' | 'predict' | 'debug'

export const ASSESSMENT_SKILLS: AssessmentSkill[] = ['build', 'predict', 'debug']

export const SKILL_LABELS: Record<AssessmentSkill, string> = { build: 'Montar', predict: 'Prever', debug: 'Consertar' }

export type ItemKind = 'choice' | 'ordering' | 'findError' | 'predictPosition'

export interface AssessmentItem {
  id: string
  pairId: string
  variant: 'A' | 'B'
  world: WorldId
  skill: AssessmentSkill
  kind: ItemKind
  prompt: string
  code?: string
  grid?: { width: number; height: number; robot: { x: number; y: number; facing: Facing } }
  options: string[]
  correctIndex: number
  explanation: string
}
