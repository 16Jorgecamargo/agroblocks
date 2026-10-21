import { rectDistance, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { styleOf } from '@/render/world/worldStyles'
import { WorldDraft } from '@/render/world/worldDraft'
import { themePalette } from '@/render/world/worldThemes'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const CELEBRATION_ROBOT: Vec2 = { x: -2.4, z: 2.4 }

export const CELEBRATION_ROBOT_ZONE: Rect = { minX: -3.4, maxX: -1.4, minZ: 1.4, maxZ: 3.4 }

export const CELEBRATION_BEDS: Rect = { minX: -5, maxX: -2, minZ: -0.25, maxZ: 1.75 }

export const CELEBRATION_BED_CENTERS: Vec2[] = [-4.5, -3.5, -2.5].flatMap((x) => [0.25, 1.25].map((z) => ({ x, z })))

export function celebrationLayout(input: WorldInput, random: () => number): World {
  const full = input.density === 'full'
  const lane: Polyline = { points: [{ x: -1, z: 6 }, { x: -0.6, z: 2 }, { x: 0.2, z: -2 }, { x: 1.5, z: -7 }], width: 1.1 }
  const pastureRect: Rect = { minX: 1.8, maxX: 6, minZ: -5.5, maxZ: -1.8 }
  const pasture = rectPolygon(pastureRect)
  const robotZone = rectPolygon(CELEBRATION_ROBOT_ZONE)
  const bedZone = rectPolygon({ minX: CELEBRATION_BEDS.minX - 0.4, maxX: CELEBRATION_BEDS.maxX + 0.4, minZ: CELEBRATION_BEDS.minZ - 0.4, maxZ: CELEBRATION_BEDS.maxZ + 0.4 })
  const draft = new WorldDraft(random, { grid: null, paths: [lane], river: null, keepOut: [pasture, robotZone, bedZone], frontGuard: CELEBRATION_ROBOT_ZONE })
  const open = (point: Vec2) => rectDistance(point, CELEBRATION_BEDS) >= 0.4 && Math.hypot(point.x - CELEBRATION_ROBOT.x, point.z - CELEBRATION_ROBOT.z) >= 1.2
  const framing = (point: Vec2) => open(point) && Math.hypot(point.x + 1, point.z + 1) > 7

  draft.placeNear('barn', { x: -5.8, z: -3 }, -0.9)
  draft.placeNear('tower-windmill', { x: -1.5, z: -6.5 }, -0.4)
  draft.placeNear('silo', { x: -8.5, z: -0.5 }, 0)
  draft.placeNear('small-barn', { x: 3.5, z: -9 }, 0.3)
  draft.placeNear('chicken-coop', { x: -7.5, z: 3.5 }, 0.8)
  draft.placeNear('water-tower', { x: -10, z: -5 }, 0)
  draft.placeNear('log-stack', { x: -6.8, z: 1.6 }, 0.4)

  draft.fenceLine({ x: CELEBRATION_BEDS.minX - 0.3, z: CELEBRATION_BEDS.minZ - 0.4 }, { x: CELEBRATION_BEDS.maxX + 0.3, z: CELEBRATION_BEDS.minZ - 0.4 })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.maxZ }, 1)
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.minZ })

  draft.scatter(['apple-tree'], full ? 5 : 3, { minX: -11, maxX: -6, minZ: -9, maxZ: -4 }, [0.9, 1.1], open)
  draft.scatter(TREE_MODELS, full ? 40 : 18, { minX: -16, maxX: 16, minZ: -16, maxZ: 12 }, [0.9, 1.3], framing)
  draft.scatter(FOREST_MODELS, full ? 50 : 20, { minX: -26, maxX: 26, minZ: -28, maxZ: -12 }, [0.9, 1.3])
  draft.scatter(['bush', 'bush-large'], full ? 14 : 6, { minX: -9, maxX: 6, minZ: -4, maxZ: 7 }, [0.8, 1.1], open)
  addClutter(draft, { minX: -14, maxX: 12, minZ: -12, maxZ: 10 }, input.density, 320, open)

  return {
    ground: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 },
    island: false,
    paths: [lane],
    river: null,
    trail: [],
    props: draft.props,
    pasture,
    animals: spawnHerd(random, pasture, [['cow', 2], ['sheep', 2], ['pig', 1]], 'celebration'),
    butterflies: addButterflies(random, { minX: -5, maxX: -0.5, minZ: -0.5, maxZ: 4 }, 6),
    features: draft.features,
    palette: themePalette(input.theme),
    style: styleOf(input.theme),
  }
}
