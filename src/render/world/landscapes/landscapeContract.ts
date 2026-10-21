import { expect, it } from 'vitest'
import { MISSIONS } from '@/data/missions'
import type { WorldId } from '@/game/worlds/worldTypes'
import type { ModelId } from '@/render/models/manifest'
import { buildWorld, gridSizeOf } from '@/render/world/buildWorld'
import { distanceToPolyline, pointInPolygon, rectDistance } from '@/render/world/geometry'
import { CLUTTER_CEILING } from '@/render/world/landscapes/landscapeKit'
import { FEATURE_FOOTPRINTS, FRONT_CLEARANCE, GRID_CLEARANCE, isClutter, TALL_FEATURES, TALL_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { WORLD_STYLES } from '@/render/world/worldStyles'
import { FEATURE_KINDS, type FeatureKind, type Rect, type Vec2, type World, type WorldDensity } from '@/render/world/worldTypes'

export interface LandscapeExpectations {
  world: WorldId
  landmark: (FeatureKind | ModelId)[]
  crops: FeatureKind[]
  minBlocks: { map: number; farm: number }
}

const BASE_FARM: ModelId[] = ['barn', 'reservoir', 'chicken-coop', 'tower-windmill', 'water-tower']

const isFeatureKind = (kind: string): kind is FeatureKind => (FEATURE_KINDS as readonly string[]).includes(kind)

function pieces(world: World, kind: FeatureKind | ModelId): Vec2[] {
  return isFeatureKind(kind) ? world.features.filter((feature) => feature.kind === kind) : world.props.filter((prop) => prop.model === kind)
}

const area = (rect: Rect) => (rect.maxX - rect.minX) * (rect.maxZ - rect.minZ)
const within = (point: Vec2, rect: Rect) => point.x >= rect.minX - 0.01 && point.x <= rect.maxX + 0.01 && point.z >= rect.minZ - 0.01 && point.z <= rect.maxZ + 0.01

function checkCommon(world: World, expected: LandscapeExpectations, minBlocks: number, ceiling: number): void {
  for (const kind of expected.landmark) expect(pieces(world, kind).length, `${kind} present`).toBeGreaterThan(0)
  const blocks = (world.patches ?? []).filter((patch) => area(patch.rect) >= 12)
  expect(blocks.length).toBeGreaterThanOrEqual(minBlocks)
  for (const feature of world.features.filter((item) => expected.crops.includes(item.kind))) {
    expect((world.patches ?? []).some((patch) => within(feature, patch.rect)), `${feature.kind} at ${feature.x},${feature.z} on a block`).toBe(true)
  }
  expect(world.props.filter((prop) => isClutter(prop.model)).length).toBeLessThanOrEqual(ceiling)
  expect(world.style).toEqual(WORLD_STYLES[expected.world])
}

export function openGroundUse(world: World): number {
  let open = 0
  let used = 0
  for (let x = -13.75; x <= 13.75; x += 0.5) {
    for (let z = -13.75; z <= 13.75; z += 0.5) {
      const point = { x, z }
      if (world.paths.some((path) => distanceToPolyline(point, path.points) < path.width / 2 + 0.6)) continue
      open += 1
      const busy =
        (world.patches ?? []).some((patch) => within(point, patch.rect)) ||
        (world.waters ?? []).some((water) => pointInPolygon(point, water)) ||
        world.props.some((prop) => !isClutter(prop.model) && Math.hypot(prop.x - x, prop.z - z) < 1.2) ||
        world.features.some((feature) => Math.hypot(feature.x - x, feature.z - z) < 1.2) ||
        (world.mounds ?? []).some((mound) => Math.hypot(mound.x - x, mound.z - z) < mound.radius)
      if (busy) used += 1
    }
  }
  return used / open
}

export function describeLandscape(expected: LandscapeExpectations): void {
  const map = (density: WorldDensity = 'full') => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: expected.world, density, theme: expected.world })
  const sizes = [...new Map(MISSIONS.filter((mission) => mission.world === expected.world).map((mission) => gridSizeOf(mission.map.cells)).map((size) => [`${size.width}x${size.height}`, size])).values()]
  const farm = (width: number, height: number, density: WorldDensity = 'full') => buildWorld({ layout: 'farm', gridWidth: width, gridHeight: height, seed: `${expected.world}-01`, density, theme: expected.world })

  it('map: landmark, blocks, clutter and style', () => checkCommon(map(), expected, expected.minBlocks.map, CLUTTER_CEILING.map))

  it('map: gives most of the open ground a purpose instead of empty grass', () => {
    const world = map()
    expect(openGroundUse(world)).toBeGreaterThanOrEqual(0.55)
    expect(world.waters?.length ?? 0).toBeGreaterThanOrEqual(1)
    expect(world.features.some((feature) => feature.kind === 'tractor' || feature.kind === 'wheelbarrow') || (world.actors ?? []).some((actor) => actor.kind === 'tractor')).toBe(true)
  })

  it('map: a farm road links the landmark to the trail without crossing fields', () => {
    const world = map()
    const lanes = world.paths.slice(1)
    expect(lanes.length).toBeGreaterThanOrEqual(1)
    const fields = (world.patches ?? []).filter((patch) => patch.texture || world.features.some((feature) => expected.crops.includes(feature.kind) && within(feature, patch.rect)))
    for (const lane of lanes) {
      for (let index = 1; index < lane.points.length; index += 1) {
        const a = lane.points[index - 1]
        const b = lane.points[index]
        for (let t = 0.05; t < 1; t += 0.05) {
          const point = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
          for (const field of fields) expect(within(point, field.rect), `lane through a field at ${point.x},${point.z}`).toBe(false)
        }
      }
    }
    const reach = (lane: (typeof lanes)[number]) => Math.min(...[lane.points[0], lane.points[lane.points.length - 1]].flatMap((end) => world.trail.map((node) => Math.hypot(node.x - end.x, node.z - end.z))))
    expect(Math.min(...lanes.map(reach)), 'a lane reaches the trail').toBeLessThanOrEqual(1.5)
  })

  it('map: keeps the trail and its nodes clear', () => {
    const world = map()
    for (const feature of world.features) {
      expect(distanceToPolyline(feature, world.trail), `${feature.kind} at ${feature.x},${feature.z}`).toBeGreaterThan(0.6 + FEATURE_FOOTPRINTS[feature.kind] * feature.scale * 0.5)
      for (const node of world.trail) expect(Math.hypot(feature.x - node.x, feature.z - node.z)).toBeGreaterThan(1.4)
    }
  })

  it('map: wild trees grow in clusters along the edge, not across the farm', () => {
    const world = map()
    const trees = world.props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model))
    expect(trees.length).toBeGreaterThan(12)
    for (const tree of trees) expect(Math.min(tree.x - world.ground.minX, world.ground.maxX - tree.x, tree.z - world.ground.minZ, world.ground.maxZ - tree.z)).toBeLessThanOrEqual(4.6)
    const back = trees.filter((tree) => tree.x + tree.z < 0).length
    expect(back).toBeGreaterThan(trees.length - back)
  })

  it('raises hills only on open ground, never under objects, roads or blocks', () => {
    const [{ width, height }] = sizes
    for (const world of [map(), farm(width, height)]) {
      for (const mound of world.mounds ?? []) {
        for (const prop of world.props) expect(Math.hypot(prop.x - mound.x, prop.z - mound.z), `${prop.model} under a hill`).toBeGreaterThan(mound.radius)
        for (const feature of world.features) expect(Math.hypot(feature.x - mound.x, feature.z - mound.z), `${feature.kind} under a hill`).toBeGreaterThan(mound.radius)
        for (const path of world.paths) expect(distanceToPolyline(mound, path.points)).toBeGreaterThan(mound.radius + path.width / 2)
        for (const patch of world.patches ?? []) expect(rectDistance(mound, patch.rect)).toBeGreaterThan(mound.radius)
      }
    }
  })

  it('map: the same on every visit, and recognisable in light graphics', () => {
    expect(map()).toEqual(map())
    const light = map('light')
    for (const kind of expected.landmark) expect(pieces(light, kind).length).toBeGreaterThan(0)
  })

  it.each(sizes.map((size) => [`${size.width}x${size.height}`, size] as const))('farm around a %s grid', (_, { width, height }) => {
    const world = farm(width, height)
    checkCommon(world, expected, expected.minBlocks.farm, CLUTTER_CEILING.farm)
    const grid = { minX: -width / 2, maxX: width / 2, minZ: -height / 2, maxZ: height / 2 }
    for (const prop of world.props) {
      if (prop.model === 'fence' || prop.model === 'fence-gate') continue
      expect(rectDistance(prop, grid)).toBeGreaterThanOrEqual(GRID_CLEARANCE)
      if ((TALL_MODELS.has(prop.model) || (TREE_MODELS as readonly string[]).includes(prop.model)) && prop.x + prop.z > 0) expect(rectDistance(prop, grid)).toBeGreaterThanOrEqual(FRONT_CLEARANCE)
    }
    for (const feature of world.features) {
      expect(rectDistance(feature, grid)).toBeGreaterThanOrEqual(GRID_CLEARANCE)
      if (TALL_FEATURES.has(feature.kind) && feature.x + feature.z > 0) expect(rectDistance(feature, grid)).toBeGreaterThanOrEqual(FRONT_CLEARANCE)
    }
    const landmark = expected.landmark.flatMap((kind) => pieces(world, kind))
    const middle = { x: landmark.reduce((sum, item) => sum + item.x, 0) / landmark.length, z: landmark.reduce((sum, item) => sum + item.z, 0) / landmark.length }
    expect(middle.x + middle.z).toBeLessThan(0)
  })

  it('brings people to work on the map and the farm, never on the mission grid', () => {
    expect((map().actors ?? []).filter((actor) => actor.kind === 'worker').length).toBeGreaterThanOrEqual(3)
    for (const { width, height } of sizes) {
      const world = farm(width, height)
      const actors = world.actors ?? []
      expect(actors.length).toBeGreaterThanOrEqual(2)
      const grid = { minX: -width / 2, maxX: width / 2, minZ: -height / 2, maxZ: height / 2 }
      for (const actor of actors) {
        for (let index = 0; index < actor.route.length; index += 1) {
          const a = actor.route[index]
          const b = actor.route[Math.min(index + 1, actor.route.length - 1)]
          for (let t = 0; t <= 1; t += 0.1) expect(rectDistance({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, grid), actor.id).toBeGreaterThanOrEqual(1.2)
        }
      }
    }
    expect(new Set((map().actors ?? []).map((actor) => actor.id)).size).toBe((map().actors ?? []).length)
  })

  it('farm: a new place, not the base farm, the same on every visit', () => {
    const [{ width, height }] = sizes
    const world = farm(width, height)
    expect(world.river).toBeNull()
    for (const prop of world.props) if (!expected.landmark.includes(prop.model)) expect(BASE_FARM).not.toContain(prop.model)
    expect(farm(width, height)).toEqual(world)
    for (const kind of expected.landmark) expect(pieces(farm(width, height, 'light'), kind).length).toBeGreaterThan(0)
  })
}
