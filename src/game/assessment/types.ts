import type { Facing } from '@/game/world/types'

export type AssessmentConcept = 'sequencing' | 'repetition' | 'conditionals' | 'debugging' | 'interpretation'

export const ASSESSMENT_CONCEPTS: AssessmentConcept[] = ['sequencing', 'repetition', 'conditionals', 'debugging', 'interpretation']

export const ASSESSMENT_CONCEPT_LABELS: Record<AssessmentConcept, string> = {
  sequencing: 'Sequenciamento',
  repetition: 'Repetição',
  conditionals: 'Condicionais',
  debugging: 'Identificação de erros',
  interpretation: 'Interpretação de algoritmos',
}

export type ItemKind = 'choice' | 'ordering' | 'findError' | 'predictPosition'

export interface AssessmentItem {
  id: string
  pairId: string
  variant: 'A' | 'B'
  concept: AssessmentConcept
  kind: ItemKind
  prompt: string
  code?: string
  grid?: { width: number; height: number; robot: { x: number; y: number; facing: Facing } }
  options: string[]
  correctIndex: number
}
