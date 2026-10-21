import { rectDistance, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { HOME_HILLS, hillScatter, hillSurfaceY } from '@/render/world/hillScatter'
import { styleOf } from '@/render/world/worldStyles'
import { WorldDraft } from '@/render/world/worldDraft'
import { themePalette } from '@/render/world/worldThemes'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const HOME_BEDS: Rect = { minX: -1.6, maxX: 2.8, minZ: 0, maxZ: 3.2 }

export const HOME_ROBOT: Vec2 = { x: 3.4, z: 4.6 }

export const HOME_TITLE_LANE = { x: 1, halfWidth: 9, minZ: -18 }

export function homeLayout(input: WorldInput, random: () => number): World {
  const full = input.density === 'full'
  const farmPath: Polyline = { points: [{ x: -4.5, z: -1.5 }, { x: -2.4, z: -0.2 }, { x: -1.9, z: 1.2 }], width: 1.1 }
  const pastureRect: Rect = { minX: 3.2, maxX: 7.2, minZ: -2.8, maxZ: -0.5 }
  const pasture = rectPolygon(pastureRect)
  const robotZone = rectPolygon({ minX: HOME_ROBOT.x - 1, maxX: HOME_ROBOT.x + 1, minZ: HOME_ROBOT.z - 1, maxZ: HOME_ROBOT.z + 1 })
  const draft = new WorldDraft(random, { grid: null, paths: [farmPath], river: null, keepOut: [pasture, robotZone, rectPolygon(HOME_BEDS)], frontGuard: null })
  const awayFromBeds = (point: Vec2) => rectDistance(point, HOME_BEDS) > 0.6 && Math.hypot(point.x - HOME_ROBOT.x, point.z - HOME_ROBOT.z) > 1.2

  draft.placeNear('barn', { x: -6.5, z: -3.6 }, -1.15)
  draft.placeNear('water-tower', { x: -9.5, z: -8 }, 0)
  draft.placeNear('tower-windmill', { x: 8.6, z: -4.6 }, -0.4)
  draft.placeNear('small-barn', { x: -1.2, z: -11 }, -1.4)
  draft.placeNear('small-barn', { x: 5.5, z: -14 }, 0.3)
  draft.placeNear('silo', { x: -11, z: -12 }, 0)
  draft.placeNear('chicken-coop', { x: -3.8, z: -4.4 }, 0.4)
  draft.placeNear('log-stack', { x: -2.6, z: -2.8 }, 0.2)

  draft.fenceLine({ x: -3.1, z: 3.6 }, { x: 3.9, z: 3.6 })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.maxX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.minX, z: pastureRect.maxZ }, 1)

  const behindTitle = (point: Vec2) => Math.abs(point.x - HOME_TITLE_LANE.x) < HOME_TITLE_LANE.halfWidth && point.z > HOME_TITLE_LANE.minZ
  const offHills = (point: Vec2) => !behindTitle(point) && HOME_HILLS.every((hill) => hillSurfaceY(hill, point.x, point.z) < 0)
  draft.scatter(FOREST_MODELS, full ? 80 : 35, { minX: -28, maxX: 28, minZ: -32, maxZ: -6 }, [0.9, 1.3], offHills)
  draft.scatter(TREE_MODELS, full ? 12 : 6, { minX: -13, maxX: -7, minZ: -4, maxZ: 5 }, [0.9, 1.2])
  draft.scatter(TREE_MODELS, full ? 10 : 5, { minX: 8, maxX: 13, minZ: -3, maxZ: 5 }, [0.9, 1.2])
  addClutter(draft, { minX: -11, maxX: 11, minZ: -4, maxZ: 8 }, input.density, 260, awayFromBeds)

  return {
    ground: { minX: -60, maxX: 60, minZ: -60, maxZ: 12 },
    island: false,
    paths: [farmPath],
    river: null,
    trail: [],
    props: [...draft.props, ...hillScatter(random, HOME_HILLS, input.density)],
    pasture,
    animals: spawnHerd(random, pasture, [['cow', 2], ['sheep', 2]], 'home'),
    butterflies: addButterflies(random, { minX: -2, maxX: 4, minZ: -0.5, maxZ: 4 }, 5),
    features: draft.features,
    palette: themePalette(input.theme),
    style: styleOf(input.theme),
  }
}
