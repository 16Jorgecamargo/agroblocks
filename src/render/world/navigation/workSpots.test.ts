import type { WorldId } from '@/game/worlds/worldTypes'
import { headingAlong } from '@/render/world/actors/actorMotion'
import { buildWorld } from '@/render/world/buildWorld'
import { buildOccupancy } from '@/render/world/navigation/buildOccupancy'
import { isOpen, walkMask } from '@/render/world/navigation/passability'
import { workSpots } from '@/render/world/navigation/workSpots'

const map = (theme: WorldId) => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })

describe('work spots', () => {
  it('waters only next to a bed, facing it, on walkable ground', () => {
    const world = map('garden')
    const person = walkMask(buildOccupancy(world), 'person')
    const spots = workSpots(world, person, 'water')
    expect(spots.length).toBeGreaterThan(10)
    for (const spot of spots) {
      expect(isOpen(person, spot.at)).toBe(true)
      expect(Math.hypot(spot.at.x - spot.target.x, spot.at.z - spot.target.z)).toBeLessThan(1.4)
      expect(Math.cos(spot.facing - headingAlong(spot.at, spot.target))).toBeCloseTo(1, 5)
    }
  })

  it('feeds beside a trough or hay rack', () => {
    const world = map('barnyard')
    const spots = workSpots(world, walkMask(buildOccupancy(world), 'person'), 'feed')
    expect(spots.length).toBeGreaterThan(0)
    for (const spot of spots) expect(world.features.some((feature) => (feature.kind === 'trough' || feature.kind === 'hayRack') && feature.x === spot.target.x && feature.z === spot.target.z)).toBe(true)
  })

  it('limits spots to an area', () => {
    const world = map('garden')
    const area = { minX: -12.4, maxX: -4.6, minZ: -12.4, maxZ: -7.3 }
    const spots = workSpots(world, walkMask(buildOccupancy(world), 'person'), 'hoe', area)
    expect(spots.length).toBeGreaterThan(0)
    for (const spot of spots) expect(spot.target.x >= area.minX && spot.target.x <= area.maxX && spot.target.z >= area.minZ && spot.target.z <= area.maxZ).toBe(true)
  })

  it('finds nothing when no target exists', () => {
    const world = map('cornfield')
    expect(workSpots(world, walkMask(buildOccupancy(world), 'person'), 'pick')).toEqual([])
  })
})
