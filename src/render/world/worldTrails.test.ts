import { WORLD_IDS } from '@/game/worlds/worldTypes'
import { buildWorld } from '@/render/world/buildWorld'
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
