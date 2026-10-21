import { MISSIONS } from '@/data/missions'
import { buildWorld, gridSizeOf } from '@/render/world/buildWorld'
import { distanceToPolyline, rectDistance } from '@/render/world/geometry'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import { CLUTTER_CEILING } from '@/render/world/landscapes/landscapeKit'
import { FEATURE_FOOTPRINTS, FRONT_CLEARANCE, GRID_CLEARANCE, isClutter, TALL_FEATURES, TREE_MODELS } from '@/render/world/worldCatalog'
import { WORLD_STYLES } from '@/render/world/worldStyles'
import type { World, WorldDensity, WorldFeature } from '@/render/world/worldTypes'

const map = (density: WorldDensity = 'full') => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'cornfield', density, theme: 'cornfield' })

const ofKind = (world: World, kind: WorldFeature['kind']) => world.features.filter((feature) => feature.kind === kind)

function centroid(features: WorldFeature[]) {
  return { x: features.reduce((sum, item) => sum + item.x, 0) / features.length, z: features.reduce((sum, item) => sum + item.z, 0) / features.length }
}

describe('cornfield map', () => {
  it('has a grain-bin landmark', () => {
    const world = map()
    const landmark = [...ofKind(world, 'grainBin'), ...ofKind(world, 'grainDryer')]
    expect(ofKind(world, 'grainBin')).toHaveLength(3)
    expect(ofKind(world, 'grainDryer')).toHaveLength(1)
    const middle = centroid(landmark)
    for (const item of landmark) expect(Math.hypot(item.x - middle.x, item.z - middle.z)).toBeLessThanOrEqual(4)
  })

  it('grows corn in big blocks', () => {
    const world = map()
    const blocks = (world.patches ?? []).filter((patch) => (patch.rect.maxX - patch.rect.minX) * (patch.rect.maxZ - patch.rect.minZ) >= 20)
    expect(blocks.length).toBeGreaterThanOrEqual(2)
    const corn = ofKind(world, 'cornStalk').filter((stalk) => stalk.scale === 1)
    expect(corn.length).toBeGreaterThan(100)
    for (const stalk of corn) expect(blocks.some(({ rect }) => stalk.x >= rect.minX && stalk.x <= rect.maxX && stalk.z >= rect.minZ && stalk.z <= rect.maxZ)).toBe(true)
  })

  it('keeps the road clear', () => {
    const world = map()
    for (const feature of world.features) {
      expect(distanceToPolyline(feature, world.trail)).toBeGreaterThan(0.7 + FEATURE_FOOTPRINTS[feature.kind] * feature.scale)
      for (const node of world.trail) expect(Math.hypot(feature.x - node.x, feature.z - node.z)).toBeGreaterThan(1.6)
    }
  })

  it('keeps trees on the windbreak at the edge of the island', () => {
    const world = map()
    const trees = world.props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model))
    expect(trees.length).toBeGreaterThan(20)
    for (const tree of trees) expect(Math.min(tree.x - world.ground.minX, world.ground.maxX - tree.x, tree.z - world.ground.minZ, world.ground.maxZ - tree.z)).toBeLessThanOrEqual(1.5)
  })

  it('keeps clutter low', () => {
    expect(map().props.filter((prop) => isClutter(prop.model)).length).toBeLessThanOrEqual(CLUTTER_CEILING.map)
  })

  it('is the same on every visit', () => {
    expect(map()).toEqual(map())
  })

  it('stays recognisable in light graphics', () => {
    const light = map('light')
    expect(ofKind(light, 'grainBin')).toHaveLength(3)
    expect(ofKind(light, 'cornStalk').length).toBeLessThan(ofKind(map(), 'cornStalk').length)
  })

  it('rolls under a warm sky, with a farm lane, a wagon, a scarecrow and birds', () => {
    const world = map()
    expect(world.style).toEqual(WORLD_STYLES.cornfield)
    expect(world.mounds?.length).toBeGreaterThanOrEqual(6)
    expect(world.paths.length).toBe(2)
    expect(ofKind(world, 'cornWagon')).toHaveLength(1)
    expect(ofKind(world, 'scarecrow')).toHaveLength(1)
    expect(world.birds?.length).toBe(3)
    expect(world.river).toBeNull()
    expect(world.animals).toEqual([])
  })
})

const SIZES = [...new Map(MISSIONS.filter((mission) => mission.world === 'cornfield').map((mission) => gridSizeOf(mission.map.cells)).map((size) => [`${size.width}x${size.height}`, size])).values()]

const farm = (width: number, height: number, density: WorldDensity = 'full') => buildWorld({ layout: 'farm', gridWidth: width, gridHeight: height, seed: 'cornfield-01', density, theme: 'cornfield' })

describe('cornfield mission farm', () => {
  it.each(SIZES.map((size) => [`${size.width}x${size.height}`, size] as const))('builds a corn farm around a %s grid', (_, { width, height }) => {
    const world = farm(width, height)
    const grid = { minX: -width / 2, maxX: width / 2, minZ: -height / 2, maxZ: height / 2 }
    for (const prop of world.props) if (prop.model !== 'fence') expect(rectDistance(prop, grid)).toBeGreaterThanOrEqual(GRID_CLEARANCE)
    for (const feature of world.features) {
      expect(rectDistance(feature, grid)).toBeGreaterThanOrEqual(GRID_CLEARANCE)
      if (TALL_FEATURES.has(feature.kind) && feature.x + feature.z > 0) expect(rectDistance(feature, grid)).toBeGreaterThanOrEqual(FRONT_CLEARANCE)
    }
    for (const tree of world.props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model))) {
      if (tree.x + tree.z > 0) expect(rectDistance(tree, grid)).toBeGreaterThanOrEqual(FRONT_CLEARANCE)
    }
    const bins = [...ofKind(world, 'grainBin'), ...ofKind(world, 'grainDryer')]
    expect(bins).toHaveLength(4)
    const middle = centroid(bins)
    expect(middle.x + middle.z).toBeLessThan(0)
    const blocks = (world.patches ?? []).filter((patch) => (patch.rect.maxX - patch.rect.minX) * (patch.rect.maxZ - patch.rect.minZ) >= 18)
    expect(blocks.length).toBeGreaterThanOrEqual(2)
    for (const stalk of ofKind(world, 'cornStalk').filter((item) => item.scale === 1)) expect(blocks.some(({ rect }) => stalk.x >= rect.minX && stalk.x <= rect.maxX && stalk.z >= rect.minZ && stalk.z <= rect.maxZ)).toBe(true)
  })

  it('is a new place, not the base farm', () => {
    const world = farm(6, 1)
    expect(world.river).toBeNull()
    expect(world.pasture).toBeNull()
    expect(world.animals).toEqual([])
    for (const prop of world.props) expect(['barn', 'reservoir', 'chicken-coop', 'tower-windmill', 'water-tower']).not.toContain(prop.model)
    expect(world.style).toEqual(WORLD_STYLES.cornfield)
    expect(ofKind(world, 'cornWagon')).toHaveLength(1)
    expect(ofKind(world, 'scarecrow')).toHaveLength(1)
  })

  it('keeps clutter low and looks the same on every visit', () => {
    expect(farm(6, 1).props.filter((prop) => isClutter(prop.model)).length).toBeLessThanOrEqual(CLUTTER_CEILING.farm)
    expect(farm(6, 1)).toEqual(farm(6, 1))
    expect(ofKind(farm(6, 1, 'light'), 'grainBin')).toHaveLength(3)
  })
})

describe('cornfield landscape contract', () => {
  describeLandscape({ world: 'cornfield', landmark: ['grainBin', 'grainDryer'], crops: ['cornStalk'], minBlocks: { map: 3, farm: 2 } })
})
