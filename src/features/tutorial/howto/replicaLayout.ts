import type { Point } from '@/features/tutorial/howto/howtoTypes'
import type { SideTab } from '@/features/tutorial/tutorialTypes'

export const STAGE = { width: 640, height: 360 }

export const MOVE = 'mover para frente'
export const HARVEST = 'colher planta'

export const CATEGORY_POINTS = { movement: { x: 45, y: 30 }, farm: { x: 45, y: 64 } }

export const FLYOUT_LABELS = [MOVE, 'virar à esquerda', 'virar à direita', HARVEST]

export function flyoutBlockAt(index: number): Point {
  return { x: 100, y: 30 + 34 * index }
}

export const HAT_POINT: Point = { x: 245, y: 40 }

export function stackBlockAt(index: number): Point {
  return { x: 245, y: 70 + 30 * index }
}

export const TRASH_POINT: Point = { x: 375, y: 320 }
export const KEY_POINT: Point = { x: 310, y: 320 }
export const RUN_POINT: Point = { x: 520, y: 35 }
export const STEP_TOGGLE_POINT: Point = { x: 595, y: 80 }
export const TAB_POINTS: Record<SideTab, Point> = { console: { x: 440, y: 140 }, hints: { x: 510, y: 140 }, pseudocode: { x: 585, y: 140 } }
export const HINT_BUTTON_POINT: Point = { x: 520, y: 228 }

export function farmCellAt(index: number): Point {
  return { x: 432 + 44 * index, y: 305 }
}

export const PLANT_CELL = 2
export const ROCK_CELL = 3

export function toPercent(point: Point): { left: string; top: string } {
  return { left: `${(point.x / STAGE.width) * 100}%`, top: `${(point.y / STAGE.height) * 100}%` }
}
