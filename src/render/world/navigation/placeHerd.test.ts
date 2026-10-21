import { WORLD_IDS } from '@/game/worlds/worldTypes'
import { createRandom } from '@/render/seededRandom'
import { BODY_RADIUS } from '@/render/world/animalBrain'
import { buildWorld } from '@/render/world/buildWorld'
import { pointInPolygon, rectPolygon } from '@/render/world/geometry'
import { buildOccupancy } from '@/render/world/navigation/buildOccupancy'
import { cellCenter, createGrid, markRect, OCCUPANTS } from '@/render/world/navigation/occupancy'
import { isOpen, walkMask } from '@/render/world/navigation/passability'
import { placeHerd } from '@/render/world/navigation/placeHerd'
import type { AnimalSpawn } from '@/render/world/worldTypes'

const scenes = () => WORLD_IDS.flatMap((theme) => [buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme }), buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: `${theme}-01`, density: 'full', theme })])

describe('place herd', () => {
  it('starts every animal on a free cell of its own pen, away from troughs and fences', () => {
    const worlds = scenes()
    expect(worlds.reduce((sum, world) => sum + world.animals.length, 0)).toBeGreaterThan(10)
    for (const world of worlds) {
      const mask = walkMask(buildOccupancy(world), 'animal')
      for (const animal of world.animals) {
        expect(isOpen(mask, animal)).toBe(true)
        expect(pointInPolygon(animal, animal.area)).toBe(true)
        expect(animal.walk!.length).toBeGreaterThan(0)
        for (const cell of animal.walk!) expect(isOpen(mask, cell) && pointInPolygon(cell, animal.area)).toBe(true)
      }
    }
  })

  it('never spawns two animals on top of each other', () => {
    for (const world of scenes()) {
      world.animals.forEach((a, index) =>
        world.animals.slice(index + 1).forEach((b) => expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(BODY_RADIUS[a.species] * a.scale + BODY_RADIUS[b.species] * b.scale - 1e-9)),
      )
    }
  })

  it('drops an animal whose pen has no free cell', () => {
    const grid = createGrid({ minX: -2, maxX: 2, minZ: -2, maxZ: 2 })
    markRect(grid, { x: 0, z: 0 }, 4, 4, 0, 'feed')
    const cow: AnimalSpawn = { id: 'c', species: 'cow', x: 0, z: 0, area: rectPolygon({ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }), scale: 1 }
    expect(placeHerd([cow], grid, createRandom(1))).toEqual([])
  })

  it('keeps every animal body clear of fences, troughs and shelters', () => {
    for (const world of scenes()) {
      const grid = buildOccupancy(world)
      for (const animal of world.animals) {
        const body = BODY_RADIUS[animal.species] * animal.scale
        for (let index = 0; index < grid.cells.length; index += 1) {
          if (OCCUPANTS[grid.cells[index]] === 'free') continue
          const center = cellCenter(grid, index)
          if (Math.abs(center.x - animal.x) > 1 || Math.abs(center.z - animal.z) > 1) continue
          const gap = Math.hypot(Math.max(Math.abs(center.x - animal.x) - grid.cell / 2, 0), Math.max(Math.abs(center.z - animal.z) - grid.cell / 2, 0))
          expect(gap, `${animal.id} near ${OCCUPANTS[grid.cells[index]]}`).toBeGreaterThanOrEqual(body - 1e-9)
        }
      }
    }
  })
})
