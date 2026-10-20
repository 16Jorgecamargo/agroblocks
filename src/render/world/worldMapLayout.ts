import type { WorldId } from '@/game/worlds/worldTypes'
import type { ModelId } from '@/render/models/manifest'
import { rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter } from '@/render/world/scenery'
import { FOREST_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import { addThemeFeatures, themePalette } from '@/render/world/worldThemes'
import { WORLD_TRAILS } from '@/render/world/worldTrails'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const WORLD_MAP_ISLAND: Rect = { minX: -10.5, maxX: 10.5, minZ: -10.5, maxZ: 10.5 }

const NODE_CLEARANCE = 1.3
const EDGE = 0.6

const LANDMARKS: Record<WorldId, [ModelId, number, number, number][]> = {
  garden: [['small-barn', -8, 8.5, 0.7], ['chicken-coop', 8.5, -8.5, 0.8]],
  cornfield: [['silo', 8.5, 8, 0.55], ['windmill', -8.5, 7.5, 0.55]],
  orchard: [['small-barn', 8.5, 8.5, 0.7], ['log-stack', -8.5, -8.5, 0.8]],
  greenhouse: [['water-tower', -8.5, -8, 0.5], ['reservoir', 8, -8.5, 0.7]],
  barnyard: [['barn', 0, 0.3, 0.6], ['silo', 2.4, -1.6, 0.5]],
  homestead: [['barn', -2.5, 2.5, 0.55], ['tower-windmill', 2.5, -2.5, 0.55]],
}

export function worldMapLayout(input: WorldInput, random: () => number): World {
  const theme = input.theme ?? 'garden'
  const full = input.density === 'full'
  const trail = WORLD_TRAILS[theme]
  const trailPath: Polyline = { points: trail, width: 1 }
  const nodeZones = trail.map((node) => rectPolygon({ minX: node.x - NODE_CLEARANCE, maxX: node.x + NODE_CLEARANCE, minZ: node.z - NODE_CLEARANCE, maxZ: node.z + NODE_CLEARANCE }))
  const inner: Rect = { minX: WORLD_MAP_ISLAND.minX + EDGE, maxX: WORLD_MAP_ISLAND.maxX - EDGE, minZ: WORLD_MAP_ISLAND.minZ + EDGE, maxZ: WORLD_MAP_ISLAND.maxZ - EDGE }
  const draft = new WorldDraft(random, { grid: null, paths: [trailPath], river: null, keepOut: nodeZones, frontGuard: null, bounds: inner })
  const onIsland = (point: Vec2) => point.x > inner.minX && point.x < inner.maxX && point.z > inner.minZ && point.z < inner.maxZ

  for (const [model, x, z, scale] of LANDMARKS[theme]) draft.placeNear(model, { x, z }, random() * Math.PI * 2, scale)
  addThemeFeatures(draft, theme, inner, input.density, random)
  draft.scatter(FOREST_MODELS, full ? 60 : 30, WORLD_MAP_ISLAND, [0.5, 0.75], onIsland)
  const awayFromNodes = (point: Vec2) => onIsland(point) && trail.every((node) => Math.hypot(point.x - node.x, point.z - node.z) >= NODE_CLEARANCE)
  addClutter(draft, WORLD_MAP_ISLAND, input.density, 200, awayFromNodes)

  return {
    ground: WORLD_MAP_ISLAND,
    island: true,
    paths: [trailPath],
    river: null,
    trail,
    props: draft.props,
    pasture: null,
    animals: [],
    butterflies: addButterflies(random, WORLD_MAP_ISLAND, 6),
    features: draft.features,
    palette: themePalette(theme),
  }
}
