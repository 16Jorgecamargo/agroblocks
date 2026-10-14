import {
  describeConstraint,
  describeObjective,
  PLOT_STATE_LABELS,
  type CellRef,
  type Constraint,
  type GoalResult,
  type MissionGoals,
  type MissionValidation,
  type Objective,
} from '@/game/missions/goals'
import type { Cell, GameState } from '@/game/world/types'

function countMissing(state: GameState, cells: CellRef[], test: (cell: Cell) => boolean): number {
  return cells.filter(([x, y]) => !test(state.cells[y][x])).length
}

function soilCells(state: GameState): CellRef[] {
  const refs: CellRef[] = []
  state.cells.forEach((row, y) => row.forEach((cell, x) => cell.terrain === 'soil' && refs.push([x, y])))
  return refs
}

function checkObjective(state: GameState, objective: Objective): GoalResult {
  const description = describeObjective(objective)
  switch (objective.kind) {
    case 'harvestAtLeast': {
      const harvested = state.resources.harvested
      const met = harvested >= objective.count
      const detail = met
        ? `Colhidas: ${harvested} de ${objective.count}.`
        : `Ainda faltam ${objective.count - harvested} planta(s) para colher.`
      return { description, met, detail }
    }
    case 'cellsInState':
    case 'allSoilInState': {
      const cells = objective.kind === 'cellsInState' ? objective.cells : soilCells(state)
      const label = PLOT_STATE_LABELS[objective.state]
      const missing = countMissing(state, cells, (cell) => cell.plot === objective.state)
      const detail = missing === 0
        ? `Todos os ${cells.length} canteiro(s) estão com ${label}.`
        : `${missing} canteiro(s) ainda não estão com ${label}.`
      return { description, met: missing === 0, detail }
    }
    case 'robotAt': {
      const met = state.robot.x === objective.x && state.robot.y === objective.y
      const detail = met
        ? 'O robô está na posição certa.'
        : `O robô parou em (${state.robot.x}, ${state.robot.y}).`
      return { description, met, detail }
    }
    case 'cellsWet': {
      const missing = countMissing(state, objective.cells, (cell) => cell.moisture === 'wet')
      const detail = missing === 0
        ? 'Todos os canteiros estão molhados.'
        : `${missing} canteiro(s) ainda estão com solo seco.`
      return { description, met: missing === 0, detail }
    }
  }
}

const USAGE_KEY = { maxWaterUsed: 'water', maxSeedsUsed: 'seeds', maxEnergyUsed: 'energy' } as const

function checkConstraint(state: GameState, constraint: Constraint): GoalResult {
  const used = state.usage[USAGE_KEY[constraint.kind]]
  const met = used <= constraint.value
  return {
    description: describeConstraint(constraint),
    met,
    detail: met ? `Usado: ${used}.` : `Usou ${used}, o limite é ${constraint.value}.`,
  }
}

export function validateMission(state: GameState, goals: MissionGoals): MissionValidation {
  const objectives = goals.objectives.map((objective) => checkObjective(state, objective))
  const constraints = (goals.constraints ?? []).map((constraint) => checkConstraint(state, constraint))
  const success = [...objectives, ...constraints].every((result) => result.met)
  return { success, objectives, constraints }
}
