import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import type { FeatureKind, World } from '@/render/world/worldTypes'

const FRUIT: FeatureKind[] = ['fruitTree', 'pearTree', 'peachTree', 'cherryTree', 'citrusTree']

const map = () => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'orchard', density: 'full', theme: 'orchard' })
const farm = () => buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'orchard-01', density: 'full', theme: 'orchard' })
const ofKind = (world: World, kind: FeatureKind) => world.features.filter((feature) => feature.kind === kind)

describe('orchard landscape', () => {
  describeLandscape({ world: 'orchard', landmark: ['packingShed', 'sortingTable', 'crateStack'], crops: [...FRUIT, 'sapling'], minBlocks: { map: 5, farm: 3 } })

  it('grows several fruit varieties, each in its own grove', () => {
    const world = map()
    const trees = world.features.filter((feature) => FRUIT.includes(feature.kind))
    expect(trees.length).toBeGreaterThanOrEqual(45)
    expect(new Set(trees.map((tree) => tree.kind)).size).toBe(5)
    for (const patch of (world.patches ?? []).filter((item) => trees.some((tree) => tree.x >= item.rect.minX && tree.x <= item.rect.maxX && tree.z >= item.rect.minZ && tree.z <= item.rect.maxZ))) {
      const inside = trees.filter((tree) => tree.x >= patch.rect.minX && tree.x <= patch.rect.maxX && tree.z >= patch.rect.minZ && tree.z <= patch.rect.maxZ)
      expect(new Set(inside.map((tree) => `${tree.kind}${tree.tint}`)).size).toBe(1)
      for (const tree of inside) expect(tree.y ?? 0).toBe(patch.height ?? 0)
    }
  })

  it('shows the harvest at work: ladders, baskets, fallen fruit, saplings and a nursery', () => {
    for (const world of [map(), farm()]) {
      expect(ofKind(world, 'orchardLadder').length).toBeGreaterThanOrEqual(1)
      expect(ofKind(world, 'fallenFruit').length).toBeGreaterThanOrEqual(3)
      expect(ofKind(world, 'berryBush').length).toBeGreaterThanOrEqual(6)
    }
    expect(ofKind(map(), 'sapling').length).toBeGreaterThanOrEqual(10)
    expect(ofKind(map(), 'handcart').length).toBeGreaterThanOrEqual(2)
  })

  it('keeps a pond with reeds and a pier, and shaded benches to rest', () => {
    const world = map()
    expect(world.waters).toHaveLength(1)
    expect(ofKind(world, 'pier')).toHaveLength(1)
    expect(ofKind(world, 'reeds').length).toBeGreaterThanOrEqual(3)
    expect(ofKind(world, 'bench')).toHaveLength(2)
  })
})
