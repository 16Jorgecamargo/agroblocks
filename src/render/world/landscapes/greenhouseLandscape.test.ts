import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import type { World } from '@/render/world/worldTypes'

function longestRow(world: World): number {
  const bays = world.features.filter((feature) => feature.kind === 'greenhouseBay')
  let best = 0
  for (const bay of bays) {
    const row = bays.filter((other) => Math.abs(other.z - bay.z) < 0.01 && other.rotation === bay.rotation).sort((a, b) => a.x - b.x)
    let run = 1
    for (let index = 1; index < row.length; index += 1) {
      run = Math.abs(row[index].x - row[index - 1].x - 3) < 0.01 ? run + 1 : 1
      best = Math.max(best, run)
    }
    best = Math.max(best, run)
  }
  return best
}

describe('greenhouse landscape', () => {
  describeLandscape({ world: 'greenhouse', landmark: ['greenhouseBay', 'supportShed', 'waterTank'], crops: ['vegetableBed'], minBlocks: { map: 2, farm: 1 } })

  it('joins the greenhouses side by side and waters the seedlings', () => {
    const map = buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'greenhouse', density: 'full', theme: 'greenhouse' })
    const farm = buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'greenhouse-01', density: 'full', theme: 'greenhouse' })
    expect(longestRow(map)).toBeGreaterThanOrEqual(4)
    expect(longestRow(farm)).toBeGreaterThanOrEqual(3)
    for (const world of [map, farm]) expect(world.features.filter((feature) => feature.kind === 'sprinkler').length).toBeGreaterThanOrEqual(2)
  })
})
