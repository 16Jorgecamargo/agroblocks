import { buildWorld } from '@/render/world/buildWorld'
import { CELEBRATION_BED_CENTERS, CELEBRATION_BEDS, CELEBRATION_ROBOT, CELEBRATION_ROBOT_ZONE } from '@/render/world/celebrationLayout'
import { pointInPolygon, rectDistance } from '@/render/world/geometry'
import { FRONT_CLEARANCE, TALL_MODELS } from '@/render/world/worldCatalog'
import type { WorldDensity } from '@/render/world/worldTypes'

const BUILDINGS = ['barn', 'small-barn', 'open-barn', 'silo', 'silo-house', 'tower-windmill', 'windmill', 'water-tower', 'chicken-coop']

function celebration(density: WorldDensity = 'full') {
  return buildWorld({ layout: 'celebration', gridWidth: 0, gridHeight: 0, seed: 'celebration', density })
}

describe('buildWorld celebration', () => {
  it('is deterministic', () => {
    expect(celebration()).toEqual(celebration())
  })

  it('keeps the robot spot and the tomato beds clear', () => {
    for (const prop of celebration().props) {
      if (prop.model === 'fence' || prop.model === 'fence-gate') continue
      expect(Math.hypot(prop.x - CELEBRATION_ROBOT.x, prop.z - CELEBRATION_ROBOT.z)).toBeGreaterThanOrEqual(1.2)
      expect(rectDistance(prop, CELEBRATION_BEDS)).toBeGreaterThanOrEqual(0.4)
    }
  })

  it('keeps tall models out of the space between the camera and the robot', () => {
    for (const prop of celebration().props) {
      if (TALL_MODELS.has(prop.model) && prop.x + prop.z > 0) expect(rectDistance(prop, CELEBRATION_ROBOT_ZONE)).toBeGreaterThanOrEqual(FRONT_CLEARANCE)
    }
  })

  it('fills the scene with buildings, animals, trees, flowers and butterflies', () => {
    const world = celebration()
    expect(world.props.length).toBeGreaterThanOrEqual(250)
    expect(world.props.filter((prop) => BUILDINGS.includes(prop.model)).length).toBeGreaterThanOrEqual(4)
    expect(world.animals.length).toBeGreaterThanOrEqual(4)
    for (const animal of world.animals) expect(pointInPolygon(animal, animal.area)).toBe(true)
    expect(world.butterflies.length).toBeGreaterThanOrEqual(5)
    expect(world.props.some((prop) => prop.model === 'fence')).toBe(true)
  })

  it('is lighter with light graphics', () => {
    expect(celebration('light').props.length).toBeLessThan(celebration().props.length * 0.6)
  })

  it('places six tomato beds next to the robot', () => {
    expect(CELEBRATION_BED_CENTERS).toHaveLength(6)
    for (const center of CELEBRATION_BED_CENTERS) expect(rectDistance(center, CELEBRATION_BEDS)).toBe(0)
  })
})
