import type { PlotState } from '@/game/world/types'

export type CellRef = [number, number]

export type Objective =
  | { kind: 'harvestAtLeast'; count: number }
  | { kind: 'cellsInState'; cells: CellRef[]; state: PlotState }
  | { kind: 'allSoilInState'; state: PlotState }
  | { kind: 'robotAt'; x: number; y: number }
  | { kind: 'cellsWet'; cells: CellRef[] }

export type Constraint = { kind: 'maxWaterUsed' | 'maxSeedsUsed' | 'maxEnergyUsed'; value: number }

export interface MissionGoals {
  objectives: Objective[]
  constraints?: Constraint[]
}

export interface GoalResult {
  description: string
  met: boolean
  detail: string
}

export interface MissionValidation {
  success: boolean
  objectives: GoalResult[]
  constraints: GoalResult[]
}

export const PLOT_STATE_LABELS: Record<PlotState, string> = {
  untilled: 'solo sem preparo',
  tilled: 'solo preparado',
  seeded: 'semente plantada',
  growing: 'planta em crescimento',
  mature: 'planta madura',
  harvested: 'colheita realizada',
}

export const CONSTRAINT_UNITS: Record<Constraint['kind'], string> = {
  maxWaterUsed: 'unidade(s) de água',
  maxSeedsUsed: 'semente(s)',
  maxEnergyUsed: 'unidade(s) de energia',
}

export function describeObjective(objective: Objective): string {
  switch (objective.kind) {
    case 'harvestAtLeast':
      return `Colher pelo menos ${objective.count} planta(s)`
    case 'cellsInState':
      return `Deixar ${objective.cells.length} canteiro(s) com ${PLOT_STATE_LABELS[objective.state]}`
    case 'allSoilInState':
      return `Deixar todos os canteiros com ${PLOT_STATE_LABELS[objective.state]}`
    case 'robotAt':
      return `Levar o robô até a posição (${objective.x}, ${objective.y})`
    case 'cellsWet':
      return `Deixar ${objective.cells.length} canteiro(s) com solo molhado`
  }
}

export function describeConstraint(constraint: Constraint): string {
  return `Usar no máximo ${constraint.value} ${CONSTRAINT_UNITS[constraint.kind]}`
}
