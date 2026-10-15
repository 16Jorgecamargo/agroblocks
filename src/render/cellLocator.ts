import type { Point } from '@/features/gameplay/hudLogic'

type Locator = (x: number, y: number) => Point | null

let current: Locator | null = null

export function registerCellLocator(locator: Locator): () => void {
  current = locator
  return () => {
    if (current === locator) current = null
  }
}

export function locateCell(x: number, y: number): Point | null {
  return current ? current(x, y) : null
}
