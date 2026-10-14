import type { Program } from '@/blocks/interpreter/ast'
import type { BlockType } from '@/blocks/blockTypes'
import type { EfficiencyReference } from '@/game/missions/efficiency'
import type { Constraint, Objective } from '@/game/missions/goals'
import type { ErrorCode, Robot, WorldResources } from '@/game/world/types'

export type MissionConcept =
  | 'interface'
  | 'sequencing'
  | 'repetition'
  | 'conditionals'
  | 'sensors'
  | 'variables'
  | 'efficiency'

export const CONCEPT_LABELS: Record<MissionConcept, string> = {
  interface: 'Interface do jogo',
  sequencing: 'Sequenciamento',
  repetition: 'Repetição (laços)',
  conditionals: 'Condicionais (se / senão)',
  sensors: 'Sensores e laço enquanto',
  variables: 'Variáveis e recursos',
  efficiency: 'Depuração e eficiência',
}

export interface MissionDefinition {
  id: string
  order: number
  title: string
  concept: MissionConcept
  difficulty: 1 | 2 | 3
  tutorial?: boolean
  briefing: { conceptIntro: string; goalText: string; demo?: Program }
  map: { cells: string[] }
  robot: Robot
  resources: WorldResources
  growTicks: number
  rules: { forbidWaterWet?: boolean; stepLimit?: number }
  allowedBlocks: BlockType[]
  initialProgram?: Program
  objectives: Objective[]
  constraints?: Constraint[]
  efficiency: EfficiencyReference
  hints: [string, string, string, string]
  solutionExplanation: string
  referenceSolution: Program
  commonMistakes?: Partial<Record<ErrorCode, string>>
}
