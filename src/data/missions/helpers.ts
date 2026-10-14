import type { CellRef } from '@/game/missions/goals'

export function rectCells(x: number, y: number, width: number, height: number): CellRef[] {
  const cells: CellRef[] = []
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) cells.push([column, row])
  }
  return cells
}

export function rowCells(y: number, fromX: number, toX: number): CellRef[] {
  return rectCells(fromX, y, toX - fromX + 1, 1)
}
