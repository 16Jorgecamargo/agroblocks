import { PLOT_STATE_LABELS } from '@/game/missions/goals'
import { getCell } from '@/game/world/grid'
import type { Cell, Facing, GameState, Terrain } from '@/game/world/types'

export const FACING_LABELS: Record<Facing, string> = {
  N: 'o Norte (para cima)',
  E: 'o Leste (para a direita)',
  S: 'o Sul (para baixo)',
  W: 'o Oeste (para a esquerda)',
}

const TERRAIN_LABELS: Record<Exclude<Terrain, 'soil'>, string> = {
  obstacle: 'pedra (obstáculo)',
  blocked: 'área bloqueada',
  reservoir: 'reservatório de água',
  seedDepot: 'depósito de sementes',
}

export function describeCell(cell: Cell): string {
  if (cell.terrain !== 'soil') return TERRAIN_LABELS[cell.terrain]
  return `${PLOT_STATE_LABELS[cell.plot]}, solo ${cell.moisture === 'wet' ? 'molhado' : 'seco'}`
}

export function describeRobot(state: GameState): string {
  const { x, y, facing } = state.robot
  return `Robô na coluna ${x + 1}, linha ${y + 1}, virado para ${FACING_LABELS[facing]}. Canteiro atual: ${describeCell(getCell(state, state.robot))}.`
}
