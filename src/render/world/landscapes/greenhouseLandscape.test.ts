import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import type { FeatureKind, World } from '@/render/world/worldTypes'

const BEDS: FeatureKind[] = ['vegetableBed', 'cabbageBed', 'carrotBed', 'tomatoBed', 'pepperBed', 'onionBed', 'herbBed', 'sproutBed', 'beanTrellis']

const map = () => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'greenhouse', density: 'full', theme: 'greenhouse' })
const farm = () => buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'greenhouse-01', density: 'full', theme: 'greenhouse' })
const ofKind = (world: World, kind: FeatureKind) => world.features.filter((feature) => feature.kind === kind)

describe('greenhouse landscape', () => {
  describeLandscape({ world: 'greenhouse', landmark: ['greenhouseBay', 'tallGreenhouse', 'supportShed', 'waterTank', 'pumpHouse'], crops: BEDS, minBlocks: { map: 4, farm: 2 } })

  it('builds greenhouses of different roles around one service courtyard', () => {
    const world = map()
    expect(ofKind(world, 'greenhouseBay')).toHaveLength(3)
    expect(ofKind(world, 'tallGreenhouse')).toHaveLength(1)
    expect(ofKind(world, 'nurseryHouse')).toHaveLength(1)
    const houses = [...ofKind(world, 'greenhouseBay'), ...ofKind(world, 'tallGreenhouse')]
    for (const house of houses) expect(Math.hypot(house.x - 0, house.z + 3.5)).toBeLessThan(9)
  })

  it('keeps the water works next to the greenhouses and the beds watered', () => {
    for (const world of [map(), farm()]) {
      const tank = ofKind(world, 'waterTank')[0]
      const pump = ofKind(world, 'pumpHouse')[0]
      expect(Math.hypot(tank.x - pump.x, tank.z - pump.z)).toBeLessThan(3)
      expect(ofKind(world, 'controlStation')).toHaveLength(1)
      expect(ofKind(world, 'sprinkler').length).toBeGreaterThanOrEqual(4)
      expect(world.waters?.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('works at a potting station and packs near the entrance', () => {
    const world = map()
    for (const kind of ['workbench', 'seedlingTable', 'potStack', 'sackPallet', 'packingShed', 'compostBins'] as FeatureKind[]) expect(ofKind(world, kind).length, kind).toBeGreaterThanOrEqual(1)
    const packing = ofKind(world, 'packingShed')[0]
    expect(Math.min(...world.trail.slice(0, 3).map((node) => Math.hypot(node.x - packing.x, node.z - packing.z)))).toBeLessThan(5)
  })
})
