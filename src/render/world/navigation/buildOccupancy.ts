import { createGrid, markCircle, markPolygon, markRect, markSegment, type OccupancyGrid } from '@/render/world/navigation/occupancy'
import { FEATURE_SHAPES, modelShape, type Shape } from '@/render/world/navigation/shapes'
import type { Vec2, World } from '@/render/world/worldTypes'

const MARKER_RADIUS = 0.8
const FENCE_THICKNESS = 0.15

function markShape(grid: OccupancyGrid, shape: Shape, at: Vec2, rotation: number, scale: number): void {
  if (shape.form === 'none') return
  if (shape.form === 'circle') {
    markCircle(grid, at, shape.radius * scale, shape.occupant)
    return
  }
  const offset = shape.offset ?? { x: 0, z: 0 }
  const center = { x: at.x + (offset.x * Math.cos(rotation) + offset.z * Math.sin(rotation)) * scale, z: at.z + (-offset.x * Math.sin(rotation) + offset.z * Math.cos(rotation)) * scale }
  markRect(grid, center, shape.width * scale, shape.depth * scale, rotation, shape.occupant)
}

export function buildOccupancy(world: World): OccupancyGrid {
  const grid = createGrid(world.ground)
  for (const path of world.paths) for (let index = 1; index < path.points.length; index += 1) markSegment(grid, path.points[index - 1], path.points[index], path.width, 'road')
  for (const water of world.waters ?? []) markPolygon(grid, water, 'water')
  for (const feature of world.features) markShape(grid, FEATURE_SHAPES[feature.kind], feature, feature.rotation, feature.scale)
  for (const prop of world.props) {
    if (prop.model === 'fence' || prop.model === 'fence-gate') {
      const half = prop.scale / 2
      const direction = { x: Math.cos(prop.rotation), z: -Math.sin(prop.rotation) }
      markSegment(grid, { x: prop.x - direction.x * half, z: prop.z - direction.z * half }, { x: prop.x + direction.x * half, z: prop.z + direction.z * half }, FENCE_THICKNESS, 'fence')
      continue
    }
    markShape(grid, modelShape(prop.model), prop, prop.rotation, prop.scale)
  }
  for (const node of world.trail) markCircle(grid, node, MARKER_RADIUS, 'marker')
  if (world.missionGrid) markRect(grid, { x: (world.missionGrid.minX + world.missionGrid.maxX) / 2, z: (world.missionGrid.minZ + world.missionGrid.maxZ) / 2 }, world.missionGrid.maxX - world.missionGrid.minX, world.missionGrid.maxZ - world.missionGrid.minZ, 0, 'missionGrid')
  return grid
}
