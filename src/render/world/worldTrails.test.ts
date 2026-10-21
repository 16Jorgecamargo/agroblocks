import { LANDSCAPES } from '@/render/world/landscapes/landscapes'
import { WORLD_IDS } from '@/game/worlds/worldTypes'
import { buildWorld } from '@/render/world/buildWorld'
import { crossings, distanceToPolyline, rectDistance } from '@/render/world/geometry'
import { TREE_MODELS } from '@/render/world/worldCatalog'
import { WORLD_TRAILS } from '@/render/world/worldTrails'

describe('world trails', () => {
  it.each(WORLD_IDS)('%s trail has 12 points inside the island, well spaced on the bigger island', (world) => {
    const trail = WORLD_TRAILS[world]
    expect(trail).toHaveLength(12)
    for (const point of trail) expect(Math.abs(point.x) < 14.5 && Math.abs(point.z) < 14.5).toBe(true)
    for (let index = 1; index < trail.length; index += 1) {
      expect(Math.hypot(trail[index].x - trail[index - 1].x, trail[index].z - trail[index - 1].z)).toBeGreaterThanOrEqual(3.2)
    }
  })

  it('gives every world a different trail', () => {
    expect(new Set(WORLD_IDS.map((world) => JSON.stringify(WORLD_TRAILS[world]))).size).toBe(6)
  })

  it.each(WORLD_IDS)('%s map keeps features away from the trail nodes', (theme) => {
    const world = buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })
    expect(world.trail).toEqual(WORLD_TRAILS[theme])
    expect(world.features.length).toBeGreaterThan(0)
    for (const node of world.trail) for (const feature of world.features) expect(Math.hypot(feature.x - node.x, feature.z - node.z)).toBeGreaterThan(1.2)
  })
})

describe('world map landscapes', () => {
  const map = (theme: (typeof WORLD_IDS)[number]) => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })
  const count = (theme: (typeof WORLD_IDS)[number], kind: string) => map(theme).features.filter((feature) => feature.kind === kind).length

  it('keeps the forest on the edges of the island', () => {
    for (const theme of WORLD_IDS) {
      const trees = map(theme).props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model))
      const inner = trees.filter((tree) => Math.abs(tree.x) < 10 && Math.abs(tree.z) < 10)
      expect(inner.length).toBeLessThanOrEqual(Math.ceil(trees.length * 0.15))
    }
  })

  it('gives every world its own organised zones', () => {
    expect(count('garden', 'vegetableBed')).toBeGreaterThanOrEqual(12)
    expect(count('cornfield', 'cornStalk')).toBeGreaterThanOrEqual(80)
    expect(count('orchard', 'fruitTree')).toBeGreaterThanOrEqual(12)
    expect(count('greenhouse', 'greenhouseBay')).toBeGreaterThanOrEqual(3)
    expect(map('barnyard').animals.length).toBeGreaterThanOrEqual(6)
    expect(new Set(map('homestead').features.map((feature) => feature.kind)).size).toBeGreaterThanOrEqual(3)
  })

  it('fences the zones without crossing the trail', () => {
    for (const theme of WORLD_IDS) {
      const world = map(theme)
      const fences = world.props.filter((prop) => prop.model === 'fence')
      if (!LANDSCAPES[theme]) expect(fences.length).toBeGreaterThan(0)
      for (const fence of fences) {
        for (let index = 1; index < world.trail.length; index += 1) {
          const a = world.trail[index - 1]
          const b = world.trail[index]
          const t = Math.max(0, Math.min(1, ((fence.x - a.x) * (b.x - a.x) + (fence.z - a.z) * (b.z - a.z)) / ((b.x - a.x) ** 2 + (b.z - a.z) ** 2)))
          expect(Math.hypot(fence.x - (a.x + t * (b.x - a.x)), fence.z - (a.z + t * (b.z - a.z)))).toBeGreaterThan(0.6)
        }
      }
    }
  })
})

describe('trail rules on world maps', () => {
  const map = (theme: (typeof WORLD_IDS)[number]) => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })
  const CROPS = new Set(['cornStalk', 'vegetableBed', 'fruitTree', 'greenhouse'])

  it.each(WORLD_IDS)('%s keeps plantations and their ground off the trail', (theme) => {
    const world = map(theme)
    for (const feature of world.features.filter((item) => CROPS.has(item.kind))) expect(distanceToPolyline(feature, world.trail)).toBeGreaterThan(1.1)
    for (const patch of world.patches ?? []) {
      for (let index = 1; index < world.trail.length; index += 1) {
        const a = world.trail[index - 1]
        const b = world.trail[index]
        for (let step = 0; step <= 40; step += 1) {
          const point = { x: a.x + ((b.x - a.x) * step) / 40, z: a.z + ((b.z - a.z) * step) / 40 }
          expect(rectDistance(point, patch.rect)).toBeGreaterThan(0.55)
        }
      }
    }
  })

  it.each(WORLD_IDS)('%s never crosses the pond', (theme) => {
    const world = map(theme)
    if (!world.river) return
    expect(crossings({ points: world.trail, width: 1 }, world.river)).toEqual([])
    for (const node of world.trail) expect(distanceToPolyline(node, world.river.points)).toBeGreaterThan(world.river.width / 2 + 0.8)
  })
})
