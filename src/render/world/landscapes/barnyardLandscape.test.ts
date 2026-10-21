import { buildWorld } from '@/render/world/buildWorld'
import { pointInPolygon } from '@/render/world/geometry'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'

describe('barnyard landscape', () => {
  describeLandscape({ world: 'barnyard', landmark: ['barn', 'silo', 'feedShed'], crops: [], minBlocks: { map: 2, farm: 1 } })

  it('keeps square paddocks stocked, each with a trough', () => {
    for (const world of [
      buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'barnyard', density: 'full', theme: 'barnyard' }),
      buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'barnyard-01', density: 'full', theme: 'barnyard' }),
    ]) {
      const paddocks = (world.patches ?? []).filter((patch) => patch.color === '#8fcf63')
      expect(paddocks.length).toBeGreaterThanOrEqual(1)
      for (const { rect } of paddocks) {
        const aspect = (rect.maxX - rect.minX) / (rect.maxZ - rect.minZ)
        expect(aspect).toBeGreaterThanOrEqual(0.75)
        expect(aspect).toBeLessThanOrEqual(1.33)
        expect(world.features.some((feature) => feature.kind === 'trough' && feature.x > rect.minX && feature.x < rect.maxX && feature.z > rect.minZ && feature.z < rect.maxZ)).toBe(true)
      }
      expect(world.animals.length).toBeGreaterThanOrEqual(3)
      for (const animal of world.animals) {
        expect(pointInPolygon(animal, animal.area)).toBe(true)
        expect(paddocks.some(({ rect }) => animal.x > rect.minX && animal.x < rect.maxX && animal.z > rect.minZ && animal.z < rect.maxZ)).toBe(true)
      }
      expect(world.features.filter((feature) => feature.kind === 'baleStack').length).toBeGreaterThanOrEqual(2)
    }
  })
})
