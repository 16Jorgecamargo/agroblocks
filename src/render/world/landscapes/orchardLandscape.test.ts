import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'

describe('orchard landscape', () => {
  describeLandscape({ world: 'orchard', landmark: ['packingShed', 'crateStack'], crops: ['fruitTree'], minBlocks: { map: 3, farm: 2 } })

  it('grows one fruit per block, on terraces that step up', () => {
    for (const world of [
      buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'orchard', density: 'full', theme: 'orchard' }),
      buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'orchard-01', density: 'full', theme: 'orchard' }),
    ]) {
      const terraces = (world.patches ?? []).filter((patch) => (patch.height ?? 0) > 0)
      expect(new Set(terraces.map((patch) => patch.height)).size).toBeGreaterThanOrEqual(2)
      for (const terrace of terraces) {
        const trees = world.features.filter((feature) => feature.kind === 'fruitTree' && feature.x >= terrace.rect.minX && feature.x <= terrace.rect.maxX && feature.z >= terrace.rect.minZ && feature.z <= terrace.rect.maxZ)
        expect(trees.length).toBeGreaterThan(0)
        expect(new Set(trees.map((tree) => tree.tint)).size).toBe(1)
        for (const tree of trees) expect(tree.y).toBe(terrace.height)
      }
      expect(world.features.filter((feature) => feature.kind === 'orchardLadder').length).toBeGreaterThanOrEqual(1)
    }
  })
})
