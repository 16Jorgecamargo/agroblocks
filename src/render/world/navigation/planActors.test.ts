import type { WorldId } from '@/game/worlds/worldTypes'
import { createRandom } from '@/render/seededRandom'
import { buildWorld } from '@/render/world/buildWorld'
import { buildOccupancy } from '@/render/world/navigation/buildOccupancy'
import { segmentClear } from '@/render/world/navigation/findPath'
import { walkMask, type WalkMask } from '@/render/world/navigation/passability'
import { planActors, type Job } from '@/render/world/navigation/planActors'
import type { Vec2 } from '@/render/world/worldTypes'

const map = (theme: WorldId) => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })
const legsClear = (mask: WalkMask, route: Vec2[]) => route.every((point, index) => index === 0 || segmentClear(mask, route[index - 1], point))

describe('plan actors', () => {
  it('turns a watering job into a route between two beds that never crosses anything', () => {
    const world = map('garden')
    const grid = buildOccupancy(world)
    const [actor] = planActors(world, grid, [{ id: 'w', kind: 'worker', task: 'water', shirt: 1, stops: 2 }], createRandom(1))
    expect(actor.task).toBe('water')
    expect(actor.route.length).toBeGreaterThanOrEqual(2)
    expect(actor.facings).toHaveLength(2)
    expect(legsClear(walkMask(grid, 'person'), actor.route)).toBe(true)
  })

  it('drives a tractor only where the tractor fits, around mission markers', () => {
    const world = map('cornfield')
    const grid = buildOccupancy(world)
    const [tractor] = planActors(world, grid, [{ id: 't', kind: 'tractor', via: [{ x: -3.7, z: 4.8 }, { x: -12, z: -1.95 }] }], createRandom(1))
    expect(tractor.kind).toBe('tractor')
    expect(legsClear(walkMask(grid, 'tractor'), tractor.route)).toBe(true)
  })

  it('drops a job with nothing to work on', () => {
    const world = map('cornfield')
    expect(planActors(world, buildOccupancy(world), [{ id: 'p', kind: 'worker', task: 'pick', shirt: 0 }], createRandom(1))).toEqual([])
  })

  it('is the same cast on every build', () => {
    const world = map('orchard')
    const jobs: Job[] = [{ id: 'p', kind: 'worker', task: 'pick', shirt: 0 }]
    expect(planActors(world, buildOccupancy(world), jobs, createRandom(4))).toEqual(planActors(world, buildOccupancy(world), jobs, createRandom(4)))
  })
})
