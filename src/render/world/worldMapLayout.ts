import type { WorldId } from '@/game/worlds/worldTypes'
import type { ModelId } from '@/render/models/manifest'
import { rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, addLilies, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { styleOf } from '@/render/world/worldStyles'
import { WorldDraft } from '@/render/world/worldDraft'
import { CELL, freeGrid, largestBlock, trailFreeParcels as parcels } from '@/render/world/landscapes/landscapeKit'
import { themePalette } from '@/render/world/worldThemes'
import { WORLD_TRAILS } from '@/render/world/worldTrails'
import type { AnimalSpawn, AnimalSpecies, FeatureKind, GroundPatch, Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const WORLD_MAP_ISLAND: Rect = { minX: -15.5, maxX: 15.5, minZ: -15.5, maxZ: 15.5 }

const NODE_CLEARANCE = 1.6
const EDGE = 0.6
const FOREST_LINE = 11.5
const FENCE_STEP = 1

type Quadrant = 'north' | 'east' | 'south' | 'west'

const QUADRANTS: Record<Quadrant, Rect> = {
  north: { minX: 2.5, maxX: 11, minZ: -11, maxZ: -2.5 },
  east: { minX: 2.5, maxX: 11, minZ: 2.5, maxZ: 11 },
  south: { minX: -11, maxX: -2.5, minZ: 2.5, maxZ: 11 },
  west: { minX: -11, maxX: -2.5, minZ: -11, maxZ: -2.5 },
}

type Zone =
  | { kind: 'field'; feature: FeatureKind; quadrant: Quadrant; spacing: [number, number]; fenced: boolean; tints?: string[] }
  | { kind: 'yard'; quadrant: Quadrant; models: [ModelId, number][] }
  | { kind: 'pasture'; quadrant: Quadrant; herd: [AnimalSpecies, number][] }
  | { kind: 'pond'; quadrant: Quadrant }
  | { kind: 'scatter'; feature: FeatureKind; quadrant: Quadrant; count: number }

const FRUIT_TINTS = ['#e0473c', '#f29a2e', '#f2c94c']

const PATCH_COLORS: Partial<Record<FeatureKind, string>> = {
  vegetableBed: '#8a6448',
  cornStalk: '#b99a4b',
  fruitTree: '#5f9e44',
  greenhouse: '#a99a80',
}

const PASTURE_COLOR = '#8fcf63'

const ZONES: Record<WorldId, Zone[]> = {
  garden: [
    { kind: 'field', feature: 'vegetableBed', quadrant: 'west', spacing: [1.9, 1.3], fenced: true },
    { kind: 'field', feature: 'vegetableBed', quadrant: 'east', spacing: [1.9, 1.3], fenced: true },
    { kind: 'yard', quadrant: 'north', models: [['small-barn', 0.9], ['chicken-coop', 1], ['log-stack', 1]] },
    { kind: 'pond', quadrant: 'south' },
  ],
  cornfield: [
    { kind: 'field', feature: 'cornStalk', quadrant: 'north', spacing: [0.8, 1], fenced: false },
    { kind: 'field', feature: 'cornStalk', quadrant: 'east', spacing: [0.8, 1], fenced: false },
    { kind: 'field', feature: 'cornStalk', quadrant: 'south', spacing: [0.8, 1], fenced: false },
    { kind: 'yard', quadrant: 'west', models: [['silo', 0.8], ['small-barn', 0.9], ['windmill', 0.7]] },
    { kind: 'scatter', feature: 'hayBale', quadrant: 'west', count: 6 },
  ],
  orchard: [
    { kind: 'field', feature: 'fruitTree', quadrant: 'north', spacing: [2.4, 2.4], fenced: true, tints: FRUIT_TINTS },
    { kind: 'field', feature: 'fruitTree', quadrant: 'east', spacing: [2.4, 2.4], fenced: true, tints: FRUIT_TINTS },
    { kind: 'field', feature: 'fruitTree', quadrant: 'west', spacing: [2.4, 2.4], fenced: true, tints: FRUIT_TINTS },
    { kind: 'pond', quadrant: 'south' },
  ],
  greenhouse: [
    { kind: 'field', feature: 'greenhouse', quadrant: 'north', spacing: [4.8, 3.6], fenced: false },
    { kind: 'field', feature: 'greenhouse', quadrant: 'east', spacing: [4.8, 3.6], fenced: false },
    { kind: 'field', feature: 'greenhouse', quadrant: 'south', spacing: [4.8, 3.6], fenced: false },
    { kind: 'field', feature: 'vegetableBed', quadrant: 'west', spacing: [1.9, 1.3], fenced: true },
    { kind: 'yard', quadrant: 'west', models: [['water-tower', 0.8], ['reservoir', 1]] },
  ],
  barnyard: [
    { kind: 'yard', quadrant: 'north', models: [['barn', 0.8], ['silo', 0.8], ['silo-house', 0.8]] },
    { kind: 'pasture', quadrant: 'east', herd: [['cow', 3], ['horse', 2]] },
    { kind: 'pasture', quadrant: 'west', herd: [['sheep', 4], ['pig', 2]] },
    { kind: 'scatter', feature: 'hayBale', quadrant: 'south', count: 8 },
    { kind: 'scatter', feature: 'trough', quadrant: 'east', count: 2 },
    { kind: 'scatter', feature: 'trough', quadrant: 'west', count: 2 },
  ],
  homestead: [
    { kind: 'field', feature: 'cornStalk', quadrant: 'north', spacing: [0.8, 1], fenced: false },
    { kind: 'field', feature: 'fruitTree', quadrant: 'east', spacing: [2.4, 2.4], fenced: true, tints: FRUIT_TINTS },
    { kind: 'pasture', quadrant: 'south', herd: [['cow', 2], ['sheep', 3]] },
    { kind: 'field', feature: 'vegetableBed', quadrant: 'west', spacing: [1.9, 1.3], fenced: true },
    { kind: 'scatter', feature: 'hayBale', quadrant: 'south', count: 3 },
  ],
}


function inset(rect: Rect, amount: number): Rect {
  return { minX: rect.minX + amount, maxX: rect.maxX - amount, minZ: rect.minZ + amount, maxZ: rect.maxZ - amount }
}

function center(rect: Rect): Vec2 {
  return { x: (rect.minX + rect.maxX) / 2, z: (rect.minZ + rect.maxZ) / 2 }
}

function fenceRect(draft: WorldDraft, rect: Rect): void {
  const sides: [Vec2, Vec2][] = [
    [{ x: rect.minX, z: rect.minZ }, { x: rect.maxX, z: rect.minZ }],
    [{ x: rect.maxX, z: rect.minZ }, { x: rect.maxX, z: rect.maxZ }],
    [{ x: rect.maxX, z: rect.maxZ }, { x: rect.minX, z: rect.maxZ }],
    [{ x: rect.minX, z: rect.maxZ }, { x: rect.minX, z: rect.minZ }],
  ]
  for (const [from, to] of sides) {
    const length = Math.hypot(to.x - from.x, to.z - from.z)
    const segments = Math.max(1, Math.round(length / FENCE_STEP))
    const rotation = Math.atan2(-(to.z - from.z), to.x - from.x)
    for (let index = 0; index < segments; index += 1) {
      const t = (index + 0.5) / segments
      draft.place('fence', { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t }, rotation, length / segments)
    }
  }
}

function field(draft: WorldDraft, rect: Rect, feature: FeatureKind, [stepX, stepZ]: [number, number], random: () => number, tints?: string[]): void {
  const area = inset(rect, feature === 'greenhouse' ? 1.6 : 0.5)
  for (let z = area.minZ; z <= area.maxZ; z += stepZ) {
    for (let x = area.minX; x <= area.maxX; x += stepX) {
      const tint = tints ? tints[Math.floor(random() * tints.length)] : undefined
      draft.placeFeature(feature, { x, z }, feature === 'cornStalk' ? random() * 0.4 - 0.2 : 0, feature === 'fruitTree' ? 0.85 : 1, tint)
    }
  }
}

function scatterFeature(draft: WorldDraft, rect: Rect, feature: FeatureKind, count: number, random: () => number): void {
  let placed = 0
  for (let tries = 0; tries < count * 30 && placed < count; tries += 1) {
    const point = { x: rect.minX + random() * (rect.maxX - rect.minX), z: rect.minZ + random() * (rect.maxZ - rect.minZ) }
    if (draft.placeFeature(feature, point, random() * Math.PI * 2, 1)) placed += 1
  }
}

const POND_SHAPE: [number, number][] = [
  [-1, -0.4],
  [-0.5, -0.9],
  [0.5, -0.85],
  [1, -0.15],
  [0.65, 0.75],
  [-0.35, 0.9],
  [-1, 0.25],
]

function pondFor(rect: Rect, trail: Vec2[]): Polyline | null {
  const grid = freeGrid(rect, trail, 2.2)
  const block = largestBlock(grid)
  if (!block || block.rows < 4 || block.columns < 4) return null
  const area = { minX: rect.minX + block.column * CELL, maxX: rect.minX + (block.column + block.columns) * CELL, minZ: rect.minZ + block.row * CELL, maxZ: rect.minZ + (block.row + block.rows) * CELL }
  const { x, z } = center(area)
  const width = 1.8
  const radiusX = Math.min(3.2, (area.maxX - area.minX) / 2 - width / 2 - 0.3)
  const radiusZ = Math.min(2.6, (area.maxZ - area.minZ) / 2 - width / 2 - 0.3)
  return { points: POND_SHAPE.map(([px, pz]) => ({ x: x + px * radiusX, z: z + pz * radiusZ })), width }
}

export function worldMapLayout(input: WorldInput, random: () => number): World {
  const theme = input.theme ?? 'garden'
  const full = input.density === 'full'
  const trail = WORLD_TRAILS[theme]
  const trailPath: Polyline = { points: trail, width: 1.1 }
  const zones = ZONES[theme]
  const pondZone = zones.find((zone) => zone.kind === 'pond')
  const pond = pondZone ? pondFor(QUADRANTS[pondZone.quadrant], trail) : null
  const nodeZones = trail.map((node) => rectPolygon({ minX: node.x - NODE_CLEARANCE, maxX: node.x + NODE_CLEARANCE, minZ: node.z - NODE_CLEARANCE, maxZ: node.z + NODE_CLEARANCE }))
  const inner: Rect = { minX: WORLD_MAP_ISLAND.minX + EDGE, maxX: WORLD_MAP_ISLAND.maxX - EDGE, minZ: WORLD_MAP_ISLAND.minZ + EDGE, maxZ: WORLD_MAP_ISLAND.maxZ - EDGE }
  const draft = new WorldDraft(random, { grid: null, paths: [trailPath], river: pond, keepOut: nodeZones, frontGuard: null, bounds: inner })
  const animals: AnimalSpawn[] = []
  const patches: GroundPatch[] = []
  let pasture: Vec2[] | null = null

  if (pond) addLilies(draft, pond, 4)

  for (const [index, zone] of zones.entries()) {
    const rect = QUADRANTS[zone.quadrant]
    if (zone.kind === 'field') {
      const color = PATCH_COLORS[zone.feature]
      for (const parcel of parcels(rect, trail, 4)) {
        if (color) patches.push({ rect: inset(parcel, 0.15), color })
        if (zone.fenced) fenceRect(draft, inset(parcel, 0.05))
        field(draft, parcel, zone.feature, zone.spacing, random, zone.tints)
      }
    }
    if (zone.kind === 'yard') {
      const middle = center(rect)
      zone.models.forEach(([model, scale], position) => {
        const angle = (position / zone.models.length) * Math.PI * 2
        draft.placeNear(model, { x: middle.x + Math.cos(angle) * 2.6, z: middle.z + Math.sin(angle) * 2.6 }, random() * Math.PI * 2, scale)
      })
    }
    if (zone.kind === 'pasture') {
      const [best] = parcels(rect, trail, 1)
      if (!best) continue
      const area = inset(best, 0.1)
      patches.push({ rect: area, color: PASTURE_COLOR })
      fenceRect(draft, area)
      const polygon = rectPolygon(inset(area, 0.6))
      pasture = pasture ?? polygon
      animals.push(...spawnHerd(random, polygon, zone.herd, `map-${index}`, 0.9))
    }
    if (zone.kind === 'scatter') scatterFeature(draft, inset(rect, 0.8), zone.feature, zone.count, random)
  }

  const nearEdge = (point: Vec2) => Math.abs(point.x) > FOREST_LINE || Math.abs(point.z) > FOREST_LINE
  draft.scatter(FOREST_MODELS, full ? 150 : 75, WORLD_MAP_ISLAND, [0.75, 1.05], nearEdge)
  draft.scatter(TREE_MODELS, full ? 6 : 3, inset(WORLD_MAP_ISLAND, 3), [0.8, 1])
  draft.scatter(['bush', 'bush-large'], full ? 14 : 7, inset(WORLD_MAP_ISLAND, 2), [0.8, 1.1])
  const awayFromNodes = (point: Vec2) => trail.every((node) => Math.hypot(point.x - node.x, point.z - node.z) >= NODE_CLEARANCE)
  addClutter(draft, inset(WORLD_MAP_ISLAND, 1), input.density, 260, awayFromNodes)

  return {
    ground: WORLD_MAP_ISLAND,
    island: true,
    paths: [trailPath],
    river: pond,
    trail,
    props: draft.props,
    pasture,
    animals,
    butterflies: addButterflies(random, WORLD_MAP_ISLAND, 10),
    features: draft.features,
    palette: themePalette(theme),
    style: styleOf(theme),
    patches,
  }
}
