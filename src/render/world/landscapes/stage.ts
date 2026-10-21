import type { WorldId } from '@/game/worlds/worldTypes'
import type { ModelId } from '@/render/models/manifest'
import { rectPolygon } from '@/render/world/geometry'
import { edgeClutter, openGround, reliefMounds, WORLD_MAP_ISLAND } from '@/render/world/landscapes/landscapeKit'
import { smoothPath, woodland } from '@/render/world/landscapes/natureKit'
import { inset } from '@/render/world/landscapes/scaffold'
import { WorldDraft } from '@/render/world/worldDraft'
import { WORLD_STYLES } from '@/render/world/worldStyles'
import { WORLD_TRAILS } from '@/render/world/worldTrails'
import type { AnimalSpawn, GroundPatch, Polyline, Rect, Stain, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export interface StageParts {
  patches: GroundPatch[]
  blocks: Rect[]
  paths?: Polyline[]
  stains?: Stain[]
  waters?: Vec2[][]
  animals?: AnimalSpawn[]
  pasture?: Vec2[] | null
  birds?: Vec2[]
  butterflies?: Vec2[]
  clutterModels?: readonly ModelId[]
  gaps?: Vec2[]
}

export interface StageContext {
  draft: WorldDraft
  trail: Vec2[]
  road: Polyline
  full: boolean
  random: () => number
}

export interface FarmStageContext extends StageContext {
  hw: number
  hh: number
  grid: Rect
  core: Rect
}

export interface StageLook {
  trees: readonly ModelId[]
  openSides?: ('minX' | 'maxX' | 'minZ' | 'maxZ')[]
}

const NODE_CLEARANCE = 1.6
const MAP_CENTER: Rect = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }

function world(theme: WorldId, ground: Rect, island: boolean, trail: Vec2[], paths: Polyline[], draft: WorldDraft, parts: StageParts, mounds: World['mounds']): World {
  const style = WORLD_STYLES[theme]
  return {
    ground,
    island,
    paths,
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
    waters: parts.waters ?? [],
    stains: parts.stains ?? [],
    mounds,
  }
}

export function stageMap(theme: WorldId, input: WorldInput, random: () => number, look: StageLook, build: (context: StageContext) => StageParts, roadWidth = 1.3): World {
  const trail = WORLD_TRAILS[theme]
  const road: Polyline = { points: smoothPath(trail), width: roadWidth }
  const nodeZones = trail.map((node) => rectPolygon({ minX: node.x - NODE_CLEARANCE, maxX: node.x + NODE_CLEARANCE, minZ: node.z - NODE_CLEARANCE, maxZ: node.z + NODE_CLEARANCE }))
  const draft = new WorldDraft(random, { grid: null, paths: [road], river: null, keepOut: nodeZones, frontGuard: null, bounds: inset(WORLD_MAP_ISLAND, 0.6) })
  const parts = build({ draft, trail, road, full: input.density === 'full', random })
  const paths = [road, ...(parts.paths ?? [])]
  woodland(draft, inset(WORLD_MAP_ISLAND, 1.1), random, { trees: look.trees, openSides: look.openSides ?? ['maxX', 'maxZ'], density: input.density, gaps: parts.gaps })
  edgeClutter(draft, parts.blocks, input.density, random, 3, parts.clutterModels)
  const mounds = reliefMounds(WORLD_STYLES[theme].relief, MAP_CENTER, inset(WORLD_MAP_ISLAND, 1.6), random, openGround(draft, paths, parts.patches))
  return world(theme, WORLD_MAP_ISLAND, true, trail, paths, draft, parts, mounds)
}

export function stageFarm(theme: WorldId, input: WorldInput, random: () => number, look: StageLook, build: (context: FarmStageContext) => StageParts): World {
  const hw = input.gridWidth / 2
  const hh = input.gridHeight / 2
  const grid: Rect = { minX: -hw, maxX: hw, minZ: -hh, maxZ: hh }
  const core = inset(grid, -9)
  const exit = { x: core.maxX + 4, z: 0.2 }
  const road: Polyline = { points: smoothPath([{ x: hw + 1.4, z: 0 }, { x: hw + 4.5, z: 0.6 }, { x: core.maxX - 1, z: 0.1 }, exit]), width: 1.3 }
  const draft = new WorldDraft(random, { grid, paths: [road], river: null, keepOut: [], frontGuard: grid })
  const parts = build({ draft, trail: [], road, full: input.density === 'full', random, hw, hh, grid, core })
  const paths = [road, ...(parts.paths ?? [])]
  const gaps = [{ x: core.maxX, z: 0.2 }, ...(parts.gaps ?? [])]
  woodland(draft, inset(core, -0.8), random, { trees: look.trees, openSides: ['maxX', 'maxZ'], density: input.density, gaps, depth: 3 })
  woodland(draft, inset(core, -6), random, { trees: look.trees, openSides: [], density: input.density, gaps: [{ x: core.maxX + 6, z: 0.2 }], depth: 5 })
  edgeClutter(draft, parts.blocks, input.density, random, 5, parts.clutterModels)
  const mounds = reliefMounds(WORLD_STYLES[theme].relief, inset(core, -0.5), inset(core, -10), random, openGround(draft, paths, parts.patches))
  return world(theme, inset(core, -12), false, [], paths, draft, parts, mounds)
}
