import { MISSIONS } from '@/data/missions'
import { buildWorld, gridSizeOf } from '@/render/world/buildWorld'
import { distanceToPolyline, pointInPolygon, rectDistance } from '@/render/world/geometry'
import { CLUTTER_MODELS, EXEMPT_MODELS, GRID_CLEARANCE, TALL_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import type { World } from '@/render/world/worldTypes'

const BUILDINGS = ['barn', 'small-barn', 'open-barn', 'silo', 'silo-house', 'tower-windmill', 'windmill', 'water-tower', 'reservoir', 'chicken-coop']

function farm(width: number, height: number, density: 'full' | 'light' = 'full'): World {
  return buildWorld({ layout: 'farm', gridWidth: width, gridHeight: height, seed: 'test', density })
}

describe('buildWorld farm', () => {
  it('is deterministic for the same seed', () => {
    expect(farm(5, 5)).toEqual(farm(5, 5))
  })

  it.each(MISSIONS.map((mission) => [mission.id, gridSizeOf(mission.map.cells)] as const))('keeps the grid of %s clear and visible', (_, size) => {
    const world = farm(size.width, size.height)
    const grid = { minX: -size.width / 2, maxX: size.width / 2, minZ: -size.height / 2, maxZ: size.height / 2 }
    for (const prop of world.props) {
      if (prop.model === 'fence' || prop.model === 'fence-gate') continue
      expect(rectDistance(prop, grid)).toBeGreaterThanOrEqual(GRID_CLEARANCE)
      if (TALL_MODELS.has(prop.model) && prop.x + prop.z > 0) expect(rectDistance(prop, grid)).toBeGreaterThanOrEqual(5)
    }
  })

  it('keeps paths and the river free except for bridges, signs and lilies', () => {
    const world = farm(5, 5)
    for (const prop of world.props) {
      if (EXEMPT_MODELS.has(prop.model)) continue
      for (const path of world.paths) expect(distanceToPolyline(prop, path.points)).toBeGreaterThanOrEqual(path.width / 2)
      if (world.river) expect(distanceToPolyline(prop, world.river.points)).toBeGreaterThanOrEqual(world.river.width / 2)
    }
  })

  it('fills the farm densely when graphics are full', () => {
    const world = farm(5, 5)
    const count = (models: readonly string[]) => world.props.filter((prop) => models.includes(prop.model)).length
    expect(count(CLUTTER_MODELS)).toBeGreaterThanOrEqual(300)
    expect(count(TREE_MODELS)).toBeGreaterThanOrEqual(60)
    expect(count(BUILDINGS)).toBeGreaterThanOrEqual(9)
    expect(count(['apple-tree'])).toBeGreaterThanOrEqual(8)
    expect(count(['bridge'])).toBeGreaterThanOrEqual(1)
    expect(world.animals.length).toBeGreaterThanOrEqual(12)
    expect(world.butterflies).toHaveLength(8)
  })

  it('drops ground clutter and half the forest in light mode', () => {
    const full = farm(5, 5)
    const light = farm(5, 5, 'light')
    expect(light.props.filter((prop) => (CLUTTER_MODELS as readonly string[]).includes(prop.model))).toHaveLength(0)
    const trees = (world: World) => world.props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model)).length
    expect(trees(light)).toBeLessThan(trees(full) * 0.7)
  })

  it('spawns pasture animals inside the pasture', () => {
    const world = farm(5, 5)
    for (const animal of world.animals) expect(pointInPolygon(animal, animal.area)).toBe(true)
  })

  it('reads mission grid sizes from the map rows', () => {
    expect(gridSizeOf(['. . . m .', '. # . . .'])).toEqual({ width: 5, height: 2 })
  })
})
