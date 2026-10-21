import { rectPolygon } from '@/render/world/geometry'
import { farmLayout } from '@/render/world/farmLayout'
import { borderBelt, cropBlock, edgeClutter, landmark, reliefMounds } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { WORLD_MAP_ISLAND } from '@/render/world/worldMapLayout'
import { WorldDraft } from '@/render/world/worldDraft'
import { WORLD_STYLES } from '@/render/world/worldStyles'
import { WORLD_TRAILS } from '@/render/world/worldTrails'
import type { GroundPatch, Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

const STYLE = WORLD_STYLES.cornfield
const SOIL = '#8a6a3a'
const STUBBLE = '#d9c682'
const YARD = '#c8b06a'
const NODE_CLEARANCE = 1.6

function inset(rect: Rect, amount: number): Rect {
  return { minX: rect.minX + amount, maxX: rect.maxX - amount, minZ: rect.minZ + amount, maxZ: rect.maxZ - amount }
}

function center(rect: Rect): Vec2 {
  return { x: (rect.minX + rect.maxX) / 2, z: (rect.minZ + rect.maxZ) / 2 }
}

export function binCluster(draft: WorldDraft, at: Vec2, rotation: number): void {
  const turn = (x: number, z: number): Vec2 => ({ x: at.x + x * Math.cos(rotation) + z * Math.sin(rotation), z: at.z - x * Math.sin(rotation) + z * Math.cos(rotation) })
  landmark(draft, 'grainDryer', turn(-2.3, -0.4), rotation)
  landmark(draft, 'grainBin', turn(-0.5, -1.4), rotation)
  landmark(draft, 'grainBin', turn(1.5, -0.9), rotation)
  landmark(draft, 'grainBin', turn(0.3, 0.8), rotation)
  for (const [x, z] of [
    [-2.1, 2.0],
    [2.4, 1.6],
  ]) {
    const base = turn(x, z)
    draft.forceFeature('hayBale', { x: base.x - 0.45 * Math.cos(rotation), z: base.z + 0.45 * Math.sin(rotation) }, rotation, 1)
    draft.forceFeature('hayBale', { x: base.x + 0.45 * Math.cos(rotation), z: base.z - 0.45 * Math.sin(rotation) }, rotation, 1)
    draft.forceFeature('hayBale', base, rotation, 1, undefined, 0.78)
  }
}

function map(input: WorldInput, random: () => number): World {
  const full = input.density === 'full'
  const trail = WORLD_TRAILS.cornfield
  const road: Polyline = { points: trail, width: 1.4 }
  const lane: Polyline = { points: [trail[trail.length - 1], { x: -4.2, z: 6 }, { x: 15.5, z: 6 }], width: 1.2 }
  const yard: Rect = { minX: 6.4, maxX: 12.4, minZ: 7.4, maxZ: 12.4 }
  const nodeZones = trail.map((node) => rectPolygon({ minX: node.x - NODE_CLEARANCE, maxX: node.x + NODE_CLEARANCE, minZ: node.z - NODE_CLEARANCE, maxZ: node.z + NODE_CLEARANCE }))
  const draft = new WorldDraft(random, { grid: null, paths: [road, lane], river: null, keepOut: nodeZones, frontGuard: null, bounds: inset(WORLD_MAP_ISLAND, 0.6) })
  const spacing: [number, number] = full ? [0.62, 0.8] : [1, 1.2]
  const blocks: Rect[] = [
    { minX: 0.6, maxX: 12.2, minZ: -2.2, maxZ: 4.9 },
    { minX: -3.4, maxX: 5.4, minZ: 7.2, maxZ: 12.2 },
    { minX: -12.2, maxX: -6.6, minZ: 5, maxZ: 12.2 },
  ]
  const patches: GroundPatch[] = blocks.map((rect) => cropBlock(draft, { rect, color: SOIL }, 'cornStalk', spacing, random))
  patches.push({ rect: yard, color: YARD })
  const stubble: Rect = { minX: -10.6, maxX: 5.4, minZ: -9.4, maxZ: -7.4 }
  patches.push({ rect: stubble, color: STUBBLE })
  for (let x = stubble.minX + 1.2; x < stubble.maxX - 0.6; x += full ? 2.6 : 4.2) draft.forceFeature('hayBale', { x, z: (stubble.minZ + stubble.maxZ) / 2 + (random() - 0.5) * 0.6 }, random() * 0.5, 1)
  binCluster(draft, center(yard), 0)
  draft.forceFeature('cornWagon', { x: 2.4, z: 6 }, 0, 1)
  draft.forceFeature('scarecrow', { x: 6.4, z: 1.2 }, 0.4, 1)
  borderBelt(draft, 'windbreak', inset(WORLD_MAP_ISLAND, 0.8), random, [{ x: 15.5, z: 6 }])
  edgeClutter(draft, [...blocks, yard], input.density, random, 5)

  return {
    ground: WORLD_MAP_ISLAND,
    island: true,
    paths: [road, lane],
    river: null,
    trail,
    props: draft.props,
    pasture: null,
    animals: [],
    butterflies: [],
    birds: blocks.map(center),
    features: draft.features,
    palette: STYLE.palette,
    style: STYLE,
    patches,
    mounds: reliefMounds(STYLE.relief, inset(WORLD_MAP_ISLAND, 3.2), inset(WORLD_MAP_ISLAND, 0.3), random),
  }
}

export const cornfieldLandscape: Landscape = {
  map,
  farm: (input, random) => farmLayout(input, random),
}
