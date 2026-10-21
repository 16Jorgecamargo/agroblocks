import { buildWorld } from '@/render/world/buildWorld'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import type { FeatureKind, World } from '@/render/world/worldTypes'

const CROPS: FeatureKind[] = ['cornStalk', 'fruitTree', 'sapling', 'vegetableBed', 'cabbageBed', 'tomatoBed', 'carrotBed', 'beanTrellis', 'onionBed', 'pepperBed', 'sproutBed', 'herbBed']

const map = () => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'homestead', density: 'full', theme: 'homestead' })
const farm = () => buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'homestead-01', density: 'full', theme: 'homestead' })
const has = (world: World, kind: FeatureKind) => world.features.some((feature) => feature.kind === kind)

describe('homestead landscape', () => {
  describeLandscape({ world: 'homestead', landmark: ['farmhouse', 'greenhouseBay', 'waterTank'], crops: CROPS, minBlocks: { map: 5, farm: 3 } })

  it('brings every district of the property together', () => {
    for (const world of [map(), farm()]) {
      for (const kind of ['farmhouse', 'fruitTree', 'cornStalk', 'greenhouseBay', 'trough', 'pumpHouse', 'workbench'] as FeatureKind[]) expect(has(world, kind), kind).toBe(true)
      expect(CROPS.filter((kind) => kind.endsWith('Bed') || kind === 'beanTrellis').some((kind) => has(world, kind))).toBe(true)
      expect(world.animals.length).toBeGreaterThanOrEqual(3)
      expect(world.waters?.length).toBeGreaterThanOrEqual(1)
    }
    const world = map()
    for (const kind of ['machineShed', 'nurseryHouse', 'bench', 'pier', 'compostBins'] as FeatureKind[]) expect(has(world, kind), kind).toBe(true)
    expect(world.props.some((prop) => prop.model === 'barn')).toBe(true)
    expect(world.mounds?.length).toBeGreaterThanOrEqual(4)
  })

  it('puts the farmhouse at the heart of the road network', () => {
    const world = map()
    const house = world.features.find((feature) => feature.kind === 'farmhouse')!
    expect(Math.hypot(house.x, house.z)).toBeLessThan(4.5)
    expect(Math.min(...world.trail.map((node) => Math.hypot(node.x - house.x, node.z - house.z)))).toBeLessThan(6)
  })

  it('keeps its tractor at work', () => {
    expect((map().actors ?? []).some((actor) => actor.kind === 'tractor')).toBe(true)
  })
})
