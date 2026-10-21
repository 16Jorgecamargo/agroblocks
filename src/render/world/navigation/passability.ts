import { cellIndex, OCCUPANTS, type OccupancyGrid, type Occupant } from '@/render/world/navigation/occupancy'
import type { Vec2 } from '@/render/world/worldTypes'

export type AgentKind = 'person' | 'tractor' | 'animal'

export interface WalkMask {
  grid: OccupancyGrid
  open: Uint8Array
}

export const PASSABLE: Record<AgentKind, ReadonlySet<Occupant>> = {
  person: new Set<Occupant>(['free', 'road']),
  tractor: new Set<Occupant>(['free', 'road']),
  animal: new Set<Occupant>(['free']),
}

export const CLEARANCE: Record<AgentKind, number> = { person: 0.2, tractor: 0.8, animal: 0.35 }

function disc(grid: OccupancyGrid, radius: number): [number, number][] {
  const reach = Math.ceil(radius / grid.cell + 0.5)
  const offsets: [number, number][] = []
  for (let dz = -reach; dz <= reach; dz += 1) for (let dx = -reach; dx <= reach; dx += 1) if (Math.hypot(Math.max(Math.abs(dx) - 0.5, 0), Math.max(Math.abs(dz) - 0.5, 0)) * grid.cell < radius) offsets.push([dx, dz])
  return offsets
}

export function walkMask(grid: OccupancyGrid, agent: AgentKind, clearance = CLEARANCE[agent]): WalkMask {
  const passable = new Uint8Array(OCCUPANTS.length)
  OCCUPANTS.forEach((occupant, index) => {
    passable[index] = PASSABLE[agent].has(occupant) ? 1 : 0
  })
  const offsets = disc(grid, clearance)
  const open = new Uint8Array(grid.cells.length)
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      open[row * grid.columns + column] = offsets.every(([dx, dz]) => {
        const x = column + dx
        const z = row + dz
        return x >= 0 && z >= 0 && x < grid.columns && z < grid.rows && passable[grid.cells[z * grid.columns + x]] === 1
      })
        ? 1
        : 0
    }
  }
  return { grid, open }
}

export function isOpen(mask: WalkMask, point: Vec2): boolean {
  const index = cellIndex(mask.grid, point)
  return index >= 0 && mask.open[index] === 1
}
