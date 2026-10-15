import { NODE_POSITIONS } from '@/features/mission-select/missionMapLayout'
import { crossings, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const MAP_ISLAND: Rect = { minX: -10.5, maxX: 10.5, minZ: -10.5, maxZ: 10.5 }

function screen(horizontal: number, depth: number): Vec2 {
  return { x: (horizontal + depth) / 2, z: (depth - horizontal) / 2 }
}

const RIVER_SCREEN: [number, number][] = [
  [-16, 5],
  [-10, 6],
  [-6, 4],
  [-6, -4],
  [-2, -7.5],
  [6, -7.5],
  [6, -4],
  [6, 4],
  [10, 7],
  [16, 5],
]

export function mapLayout(input: WorldInput, random: () => number): World {
  const full = input.density === 'full'
  const trail = NODE_POSITIONS.map(([x, z]) => ({ x, z }))
  const trailPath: Polyline = { points: trail, width: 1 }
  const river: Polyline = { points: RIVER_SCREEN.map(([h, d]) => screen(h, d)), width: 1 }
  const pastureRect: Rect = { minX: -10, maxX: -7, minZ: -2.5, maxZ: 0.5 }
  const pasture = rectPolygon(pastureRect)
  const nodeZones = trail.map((node) => rectPolygon({ minX: node.x - 1.2, maxX: node.x + 1.2, minZ: node.z - 1.2, maxZ: node.z + 1.2 }))
  const draft = new WorldDraft(random, { grid: null, paths: [trailPath], river, keepOut: [pasture, ...nodeZones], frontGuard: null, bounds: { minX: MAP_ISLAND.minX + 0.6, maxX: MAP_ISLAND.maxX - 0.6, minZ: MAP_ISLAND.minZ + 0.6, maxZ: MAP_ISLAND.maxZ - 0.6 } })
  const onIsland = (point: Vec2) => point.x > MAP_ISLAND.minX + 0.6 && point.x < MAP_ISLAND.maxX - 0.6 && point.z > MAP_ISLAND.minZ + 0.6 && point.z < MAP_ISLAND.maxZ - 0.6

  for (const crossing of crossings(trailPath, river)) draft.force('bridge', crossing.point, crossing.angle, 0.7)

  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.maxZ }, 1)
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.minZ })

  draft.placeNear('barn', screen(-14, -7), Math.PI / 4, 0.6)
  draft.placeNear('small-barn', screen(1, 8), -0.4, 0.7)
  draft.placeNear('windmill', screen(11, -8), 0.3, 0.55)
  draft.placeNear('silo', screen(13, 4), 0, 0.5)
  draft.placeNear('tower-windmill', screen(-3, -9), 0.2, 0.55)
  draft.placeNear('chicken-coop', screen(-10, -5), 0.5, 0.8)
  draft.placeNear('water-tower', screen(16, 0), 0, 0.5)

  draft.scatter(FOREST_MODELS, full ? 160 : 70, MAP_ISLAND, [0.5, 0.75], onIsland)
  const awayFromNodes = (point: Vec2) => onIsland(point) && trail.every((node) => Math.hypot(point.x - node.x, point.z - node.z) >= 1.3)
  addClutter(draft, MAP_ISLAND, input.density, 240, awayFromNodes)

  return {
    ground: MAP_ISLAND,
    island: true,
    paths: [trailPath],
    river,
    trail,
    props: draft.props,
    pasture,
    animals: spawnHerd(random, pasture, [['sheep', 3], ['cow', 2]], 'map'),
    butterflies: addButterflies(random, MAP_ISLAND, 6),
  }
}
