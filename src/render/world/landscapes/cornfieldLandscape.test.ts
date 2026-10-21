import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import type { World, WorldDensity, WorldFeature } from '@/render/world/worldTypes'

const map = (density: WorldDensity = 'full') => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'cornfield', density, theme: 'cornfield' })
const farm = (density: WorldDensity = 'full') => buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 1, seed: 'cornfield-01', density, theme: 'cornfield' })

const ofKind = (world: World, kind: WorldFeature['kind']) => world.features.filter((feature) => feature.kind === kind)
const area = (world: World, predicate: (color: string) => boolean) => (world.patches ?? []).filter((patch) => predicate(patch.color)).reduce((sum, { rect }) => sum + (rect.maxX - rect.minX) * (rect.maxZ - rect.minZ), 0)

describe('cornfield landscape', () => {
  describeLandscape({ world: 'cornfield', landmark: ['grainBin', 'grainDryer', 'grainAuger', 'machineShed'], crops: ['cornStalk'], minBlocks: { map: 4, farm: 3 } })

  it('makes corn the dominant feature of the map', () => {
    const world = map()
    const corn = area(world, (color) => color === '#8a6a3a' || color === '#7a5a3a')
    expect(corn / (27 * 27)).toBeGreaterThan(0.25)
    expect(ofKind(world, 'cornStalk').length).toBeGreaterThan(300)
  })

  it('grows fields of different shapes at different stages', () => {
    const world = map()
    const fields = (world.patches ?? []).filter((patch) => patch.texture === 'furrows')
    expect(new Set(fields.map(({ rect }) => `${(rect.maxX - rect.minX).toFixed(1)}x${(rect.maxZ - rect.minZ).toFixed(1)}`)).size).toBe(fields.length)
    const heights = ofKind(world, 'cornStalk').map((stalk) => stalk.scale)
    expect(heights.some((scale) => scale < 0.6)).toBe(true)
    expect(heights.some((scale) => scale > 0.9)).toBe(true)
    expect(ofKind(world, 'hayBale').length).toBeGreaterThan(2)
  })

  it('works around a silo yard, a machinery shed and a harvest staging area', () => {
    for (const world of [map(), farm()]) {
      expect(ofKind(world, 'grainBin')).toHaveLength(3)
      expect(ofKind(world, 'machineShed')).toHaveLength(1)
      expect(ofKind(world, 'supplyTank')).toHaveLength(1)
    }
    const world = map()
    expect(ofKind(world, 'sackPallet').length).toBeGreaterThanOrEqual(2)
    expect(ofKind(world, 'harvestBin').length).toBeGreaterThanOrEqual(3)
    expect(ofKind(world, 'farmhouse')).toHaveLength(1)
    expect(world.waters?.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps fewer stalks in light graphics', () => {
    expect(ofKind(map('light'), 'cornStalk').length).toBeLessThan(ofKind(map(), 'cornStalk').length)
    expect(ofKind(farm('light'), 'grainBin')).toHaveLength(3)
  })
})
