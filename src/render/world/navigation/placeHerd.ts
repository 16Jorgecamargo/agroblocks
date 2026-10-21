import { BODY_RADIUS } from '@/render/world/animalBrain'
import { pointInPolygon, polygonBounds } from '@/render/world/geometry'
import { cellCenter, cellIndex } from '@/render/world/navigation/occupancy'
import type { OccupancyGrid } from '@/render/world/navigation/occupancy'
import { CLEARANCE, walkMask, type WalkMask } from '@/render/world/navigation/passability'
import type { AnimalSpawn, Vec2 } from '@/render/world/worldTypes'

const TRIES = 60

function penCells(mask: WalkMask, area: Vec2[]): Vec2[] {
  const { grid } = mask
  const bounds = polygonBounds(area)
  const first = cellIndex(grid, { x: Math.max(bounds.minX, grid.minX), z: Math.max(bounds.minZ, grid.minZ) })
  if (first < 0) return []
  const cells: Vec2[] = []
  const startColumn = first % grid.columns
  const startRow = Math.floor(first / grid.columns)
  for (let row = startRow; row < grid.rows; row += 1) {
    const rowCenter = grid.minZ + (row + 0.5) * grid.cell
    if (rowCenter > bounds.maxZ) break
    for (let column = startColumn; column < grid.columns; column += 1) {
      const index = row * grid.columns + column
      const center = cellCenter(grid, index)
      if (center.x > bounds.maxX) break
      if (mask.open[index] && pointInPolygon(center, area)) cells.push(center)
    }
  }
  return cells
}

export function placeHerd(animals: AnimalSpawn[], grid: OccupancyGrid, random: () => number): AnimalSpawn[] {
  const placed: AnimalSpawn[] = []
  const masks = new Map<number, WalkMask>()
  const maskFor = (animal: AnimalSpawn) => {
    const radius = Math.max(CLEARANCE.animal, BODY_RADIUS[animal.species] * animal.scale)
    let mask = masks.get(radius)
    if (!mask) {
      mask = walkMask(grid, 'animal', radius)
      masks.set(radius, mask)
    }
    return mask
  }
  const fits = (spot: Vec2, animal: AnimalSpawn) => placed.every((other) => Math.hypot(other.x - spot.x, other.z - spot.z) >= BODY_RADIUS[other.species] * other.scale + BODY_RADIUS[animal.species] * animal.scale)
  for (const animal of animals) {
    const walk = penCells(maskFor(animal), animal.area)
    if (walk.length === 0) continue
    let spot: Vec2 | undefined
    for (let tries = 0; tries < TRIES && !spot; tries += 1) {
      const candidate = walk[Math.floor(random() * walk.length)]
      if (fits(candidate, animal)) spot = candidate
    }
    spot = spot ?? walk.find((candidate) => fits(candidate, animal))
    if (!spot) continue
    placed.push({ ...animal, x: spot.x, z: spot.z, walk })
  }
  return placed
}
