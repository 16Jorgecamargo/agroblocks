import { distanceToSegment, pointInPolygon, polygonBounds } from '@/render/world/geometry'
import type { Rect, Vec2 } from '@/render/world/worldTypes'

export const OCCUPANTS = ['free', 'road', 'crop', 'tree', 'feed', 'structure', 'fence', 'water', 'marker', 'missionGrid'] as const

export type Occupant = (typeof OCCUPANTS)[number]

export interface OccupancyGrid {
  cell: number
  minX: number
  minZ: number
  columns: number
  rows: number
  cells: Uint8Array
}

const RANK: Record<Occupant, number> = Object.fromEntries(OCCUPANTS.map((occupant, index) => [occupant, index])) as Record<Occupant, number>

export function createGrid(area: Rect, cell = 0.25): OccupancyGrid {
  const columns = Math.ceil((area.maxX - area.minX) / cell - 1e-9)
  const rows = Math.ceil((area.maxZ - area.minZ) / cell - 1e-9)
  return { cell, minX: area.minX, minZ: area.minZ, columns, rows, cells: new Uint8Array(columns * rows) }
}

export function cellIndex(grid: OccupancyGrid, point: Vec2): number {
  const column = Math.floor((point.x - grid.minX) / grid.cell)
  const row = Math.floor((point.z - grid.minZ) / grid.cell)
  if (column < 0 || row < 0 || column >= grid.columns || row >= grid.rows) return -1
  return row * grid.columns + column
}

export function cellCenter(grid: OccupancyGrid, index: number): Vec2 {
  return { x: grid.minX + ((index % grid.columns) + 0.5) * grid.cell, z: grid.minZ + (Math.floor(index / grid.columns) + 0.5) * grid.cell }
}

export function occupantAt(grid: OccupancyGrid, point: Vec2): Occupant {
  const index = cellIndex(grid, point)
  return index < 0 ? 'structure' : OCCUPANTS[grid.cells[index]]
}

function markWhere(grid: OccupancyGrid, bounds: Rect, occupant: Occupant, inside: (center: Vec2) => boolean): void {
  const rank = RANK[occupant]
  const fromColumn = Math.max(0, Math.floor((bounds.minX - grid.minX) / grid.cell))
  const toColumn = Math.min(grid.columns - 1, Math.floor((bounds.maxX - grid.minX) / grid.cell))
  const fromRow = Math.max(0, Math.floor((bounds.minZ - grid.minZ) / grid.cell))
  const toRow = Math.min(grid.rows - 1, Math.floor((bounds.maxZ - grid.minZ) / grid.cell))
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let column = fromColumn; column <= toColumn; column += 1) {
      const index = row * grid.columns + column
      if (grid.cells[index] >= rank) continue
      if (inside(cellCenter(grid, index))) grid.cells[index] = rank
    }
  }
}

export function markRect(grid: OccupancyGrid, center: Vec2, width: number, depth: number, rotation: number, occupant: Occupant): void {
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const reach = Math.hypot(width, depth) / 2
  markWhere(grid, { minX: center.x - reach, maxX: center.x + reach, minZ: center.z - reach, maxZ: center.z + reach }, occupant, (point) => {
    const dx = point.x - center.x
    const dz = point.z - center.z
    const localX = dx * cos - dz * sin
    const localZ = dx * sin + dz * cos
    return Math.abs(localX) <= width / 2 && Math.abs(localZ) <= depth / 2
  })
}

export function markCircle(grid: OccupancyGrid, center: Vec2, radius: number, occupant: Occupant): void {
  markWhere(grid, { minX: center.x - radius, maxX: center.x + radius, minZ: center.z - radius, maxZ: center.z + radius }, occupant, (point) => Math.hypot(point.x - center.x, point.z - center.z) <= radius)
}

export function markPolygon(grid: OccupancyGrid, points: Vec2[], occupant: Occupant): void {
  markWhere(grid, polygonBounds(points), occupant, (point) => pointInPolygon(point, points))
}

export function markSegment(grid: OccupancyGrid, from: Vec2, to: Vec2, thickness: number, occupant: Occupant): void {
  const half = Math.max(thickness / 2, grid.cell / 2)
  const bounds = { minX: Math.min(from.x, to.x) - half, maxX: Math.max(from.x, to.x) + half, minZ: Math.min(from.z, to.z) - half, maxZ: Math.max(from.z, to.z) + half }
  markWhere(grid, bounds, occupant, (point) => distanceToSegment(point, from, to) <= half)
}
