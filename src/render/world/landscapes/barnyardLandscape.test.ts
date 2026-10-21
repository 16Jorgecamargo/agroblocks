import { buildWorld } from '@/render/world/buildWorld'
import { pointInPolygon } from '@/render/world/geometry'
import { describeLandscape } from '@/render/world/landscapes/landscapeContract'
import type { FeatureKind, World } from '@/render/world/worldTypes'

const map = () => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'barnyard', density: 'full', theme: 'barnyard' })
const farm = () => buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'barnyard-01', density: 'full', theme: 'barnyard' })
const ofKind = (world: World, kind: FeatureKind) => world.features.filter((feature) => feature.kind === kind)

describe('barnyard landscape', () => {
  describeLandscape({ world: 'barnyard', landmark: ['barn', 'silo', 'feedShed', 'chicken-coop'], crops: [], minBlocks: { map: 5, farm: 2 } })

  it('keeps every herd inside its own fenced paddock, each with a trough', () => {
    for (const world of [map(), farm()]) {
      const pens = (world.patches ?? []).filter((patch) => world.features.some((feature) => feature.kind === 'trough' && feature.x > patch.rect.minX && feature.x < patch.rect.maxX && feature.z > patch.rect.minZ && feature.z < patch.rect.maxZ))
      expect(pens.length).toBeGreaterThanOrEqual(2)
      for (const animal of world.animals) {
        expect(pointInPolygon(animal, animal.area)).toBe(true)
        expect(pens.some(({ rect }) => animal.x > rect.minX && animal.x < rect.maxX && animal.z > rect.minZ && animal.z < rect.maxZ)).toBe(true)
      }
      expect(world.props.filter((prop) => prop.model === 'fence').length).toBeGreaterThan(20)
    }
    expect(new Set(map().animals.map((animal) => animal.species))).toEqual(new Set(['cow', 'sheep', 'pig', 'horse']))
  })

  it('stores hay in deliberate groups and keeps chickens in their run', () => {
    for (const world of [map(), farm()]) {
      expect(ofKind(world, 'baleStack').length).toBeGreaterThanOrEqual(3)
      const coop = world.props.find((prop) => prop.model === 'chicken-coop')!
      const chickens = ofKind(world, 'chicken')
      expect(chickens.length).toBeGreaterThanOrEqual(5)
      for (const chicken of chickens) expect(Math.hypot(chicken.x - coop.x, chicken.z - coop.z)).toBeLessThan(4)
    }
  })

  it('gives the animals shelters, racks and nests, and the yard a working corner', () => {
    const world = map()
    for (const kind of ['animalShelter', 'hayRack', 'nestBoxes', 'tractor', 'equipmentRack', 'farmhouse'] as FeatureKind[]) expect(ofKind(world, kind).length, kind).toBeGreaterThanOrEqual(1)
    expect(world.stains?.length).toBeGreaterThanOrEqual(6)
  })
})
