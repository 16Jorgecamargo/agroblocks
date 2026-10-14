import type { Cell, GameState, Position } from '@/game/world/types'

export function isInside(state: Pick<GameState, 'width' | 'height'>, position: Position): boolean {
  return position.x >= 0 && position.y >= 0 && position.x < state.width && position.y < state.height
}

export function getCell(state: Pick<GameState, 'cells' | 'width' | 'height'>, position: Position): Cell {
  if (!isInside(state, position)) {
    throw new RangeError(`Posição fora do mapa: (${position.x}, ${position.y})`)
  }
  return state.cells[position.y][position.x]
}

export function isWalkable(cell: Cell): boolean {
  return cell.terrain !== 'obstacle' && cell.terrain !== 'blocked'
}

export function updateCell(state: GameState, position: Position, patch: Partial<Cell>): GameState {
  const current = getCell(state, position)
  const row = state.cells[position.y].map((cell, x) => (x === position.x ? { ...current, ...patch } : cell))
  const cells = state.cells.map((existing, y) => (y === position.y ? row : existing))
  return { ...state, cells }
}
