import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'

describe('homestead landscape', () => {
  describeLandscape({ world: 'homestead', landmark: ['farmhouse', 'water-tower'], crops: ['cornStalk', 'fruitTree', 'vegetableBed'], minBlocks: { map: 4, farm: 3 } })

  it('shows a piece of every earlier world', () => {
    for (const world of [
      buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'homestead', density: 'full', theme: 'homestead' }),
      buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'homestead-01', density: 'full', theme: 'homestead' }),
    ]) {
      const kinds = new Set(world.features.map((feature) => feature.kind))
      for (const kind of ['cornStalk', 'fruitTree', 'greenhouseBay', 'vegetableBed', 'trough'] as const) expect(kinds.has(kind), kind).toBe(true)
      expect(world.animals.length).toBeGreaterThanOrEqual(2)
      expect(world.mounds?.length).toBeGreaterThanOrEqual(6)
    }
  })
})
