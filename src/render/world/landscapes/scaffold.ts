import type { WorldId } from '@/game/worlds/worldTypes'
import type { ModelId } from '@/render/models/manifest'
import { rectPolygon } from '@/render/world/geometry'
import { borderBelt, edgeClutter, openGround, reliefMounds, WORLD_MAP_ISLAND } from '@/render/world/landscapes/landscapeKit'
import { FOREST_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import { WORLD_STYLES } from '@/render/world/worldStyles'
import { WORLD_TRAILS } from '@/render/world/worldTrails'
import type { AnimalSpawn, GroundPatch, Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export interface SceneParts {
  patches: GroundPatch[]
  blocks: Rect[]
  paths?: Polyline[]
  animals?: AnimalSpawn[]
  pasture?: Vec2[] | null
  birds?: Vec2[]
  butterflies?: Vec2[]
  clutterModels?: readonly ModelId[]
}

export interface MapContext {
  draft: WorldDraft
  trail: Vec2[]
  full: boolean
  random: () => number
}

export interface FarmContext extends MapContext {
  hw: number
  hh: number
  grid: Rect
  core: Rect
  road: Polyline
}

const NODE_CLEARANCE = 1.6

const MAP_CENTER: Rect = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }

export function inset(rect: Rect, amount: number): Rect {
  return { minX: rect.minX + amount, maxX: rect.maxX - amount, minZ: rect.minZ + amount, maxZ: rect.maxZ - amount }
}

export function center(rect: Rect): Vec2 {
  return { x: (rect.minX + rect.maxX) / 2, z: (rect.minZ + rect.maxZ) / 2 }
}

export function nearestGap(rect: Rect, toward: Vec2): Vec2 {
  return { x: Math.min(rect.maxX, Math.max(rect.minX, toward.x)), z: Math.min(rect.maxZ, Math.max(rect.minZ, toward.z)) }
}

export function composeMap(theme: WorldId, input: WorldInput, random: () => number, build: (context: MapContext) => SceneParts, roadWidth = 1.2): World {
  const style = WORLD_STYLES[theme]
  const trail = WORLD_TRAILS[theme]
  const road: Polyline = { points: trail, width: roadWidth }
  const nodeZones = trail.map((node) => rectPolygon({ minX: node.x - NODE_CLEARANCE, maxX: node.x + NODE_CLEARANCE, minZ: node.z - NODE_CLEARANCE, maxZ: node.z + NODE_CLEARANCE }))
  const draft = new WorldDraft(random, { grid: null, paths: [road], river: null, keepOut: nodeZones, frontGuard: null, bounds: inset(WORLD_MAP_ISLAND, 0.6) })
  const parts = build({ draft, trail, full: input.density === 'full', random })
  borderBelt(draft, style.border, inset(WORLD_MAP_ISLAND, 0.8), random)
  edgeClutter(draft, parts.blocks, input.density, random, 5, parts.clutterModels)
  return {
    ground: WORLD_MAP_ISLAND,
    island: true,
    paths: [road, ...(parts.paths ?? [])],
    river: null,
    trail,
    props: draft.props,
    pasture: parts.pasture ?? null,
    animals: parts.animals ?? [],
    butterflies: parts.butterflies ?? [],
    birds: parts.birds ?? [],
    features: draft.features,
    palette: style.palette,
    style,
    patches: parts.patches,
    mounds: reliefMounds(style.relief, MAP_CENTER, inset(WORLD_MAP_ISLAND, 1.6), random, openGround(draft, [road, ...(parts.paths ?? [])], parts.patches)),
  }
}

export function composeFarm(theme: WorldId, input: WorldInput, random: () => number, build: (context: FarmContext) => SceneParts): World {
  const style = WORLD_STYLES[theme]
  const hw = input.gridWidth / 2
  const hh = input.gridHeight / 2
  const grid: Rect = { minX: -hw, maxX: hw, minZ: -hh, maxZ: hh }
  const core = inset(grid, -9)
  const exit = { x: core.maxX, z: 0.4 }
  const road: Polyline = { points: [{ x: hw + 1.4, z: 0 }, { x: hw + 5, z: 0.5 }, exit, { x: core.maxX + 4, z: 0.2 }], width: 1.3 }
  const draft = new WorldDraft(random, { grid, paths: [road], river: null, keepOut: [], frontGuard: grid })
  const parts = build({ draft, trail: [], full: input.density === 'full', random, hw, hh, grid, core, road })
  borderBelt(draft, style.border, core, random, [exit])
  edgeClutter(draft, parts.blocks, input.density, random, 6, parts.clutterModels)
  const fringe = inset(core, -1.6)
  const outskirts = inset(core, -11)
  const paths = [road, ...(parts.paths ?? [])]
  const mounds = reliefMounds(style.relief, inset(core, -0.5), inset(core, -10), random, openGround(draft, paths, parts.patches))
  const offHills = (point: Vec2) => mounds.every((mound) => Math.hypot(mound.x - point.x, mound.z - point.z) > mound.radius + 0.6)
  const offRoad = (point: Vec2) => (point.x < fringe.minX || point.x > fringe.maxX || point.z < fringe.minZ || point.z > fringe.maxZ) && Math.abs(point.z - 0.3) > 2.2 && offHills(point)
  draft.scatter(FOREST_MODELS, input.density === 'full' ? 70 : 35, outskirts, [0.85, 1.15], offRoad)
  return {
    ground: inset(core, -12),
    island: false,
    paths: [road, ...(parts.paths ?? [])],
    river: null,
    trail: [],
    props: draft.props,
    pasture: parts.pasture ?? null,
    animals: parts.animals ?? [],
    butterflies: parts.butterflies ?? [],
    birds: parts.birds ?? [],
    features: draft.features,
    palette: style.palette,
    style,
    patches: parts.patches,
    mounds,
  }
}
