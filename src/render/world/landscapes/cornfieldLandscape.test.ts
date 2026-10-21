import { buildWorld } from '@/render/world/buildWorld'
import { distanceToPolyline } from '@/render/world/geometry'
import { CLUTTER_CEILING } from '@/render/world/landscapes/landscapeKit'
import { FEATURE_FOOTPRINTS, isClutter, TREE_MODELS } from '@/render/world/worldCatalog'
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
    const corn = ofKind(world, 'cornStalk')
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
