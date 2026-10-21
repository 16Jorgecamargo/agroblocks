import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'

describe('garden landscape', () => {
  describeLandscape({ world: 'garden', landmark: ['toolShed', 'compostBins', 'chicken-coop', 'reservoir'], crops: ['vegetableBed'], minBlocks: { map: 3, farm: 2 } })

  it('keeps the chickens in their run and hedges the beds', () => {
    for (const world of [
      buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'garden', density: 'full', theme: 'garden' }),
      buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'garden-01', density: 'full', theme: 'garden' }),
    ]) {
      const chickens = world.features.filter((feature) => feature.kind === 'chicken')
      expect(chickens.length).toBeGreaterThanOrEqual(4)
      const coop = world.props.find((prop) => prop.model === 'chicken-coop')
      expect(coop).toBeDefined()
      for (const chicken of chickens) expect(Math.hypot(chicken.x - (coop?.x ?? 0), chicken.z - (coop?.z ?? 0))).toBeLessThan(3.5)
      const hedges = world.features.filter((feature) => feature.kind === 'hedge')
      for (const bed of (world.patches ?? []).filter((patch) => patch.color === '#8a6448')) {
        expect(hedges.some((hedge) => Math.abs(hedge.x - bed.rect.minX) < 0.8 || Math.abs(hedge.x - bed.rect.maxX) < 0.8 || Math.abs(hedge.z - bed.rect.minZ) < 0.8 || Math.abs(hedge.z - bed.rect.maxZ) < 0.8)).toBe(true)
      }
      expect(world.butterflies.length).toBeGreaterThan(0)
    }
  })
})
