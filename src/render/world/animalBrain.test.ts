import { DURATIONS } from '@/motion/presets'
import { createRandom } from '@/render/seededRandom'
import { closestAngle, headingTo, idleSeconds, nextTarget, nextWalkTarget, walkSeconds, type Course } from '@/render/world/animalBrain'
import { pointInPolygon, rectPolygon, segmentDistance } from '@/render/world/geometry'
import { SPECIES_GAIT } from '@/render/world/animalBrain'

const pasture = rectPolygon({ minX: 0, maxX: 6, minZ: 0, maxZ: 4 })

describe('animalBrain', () => {
  it('always picks targets inside the pasture and at least a step away', () => {
    const random = createRandom(7)
    let from = { x: 3, z: 2 }
    for (let index = 0; index < 50; index += 1) {
      const target = nextTarget(random, pasture, from)
      expect(pointInPolygon(target, pasture)).toBe(true)
      expect(Math.hypot(target.x - from.x, target.z - from.z)).toBeGreaterThanOrEqual(1.2)
      from = target
    }
  })

  it('stays put when the pasture is too small to move', () => {
    const tiny = rectPolygon({ minX: 0, maxX: 0.5, minZ: 0, maxZ: 0.5 })
    expect(nextTarget(createRandom(1), tiny, { x: 0.25, z: 0.25 })).toEqual({ x: 0.25, z: 0.25 })
  })

  it('rests between the idle limits', () => {
    const random = createRandom(3)
    for (let index = 0; index < 20; index += 1) {
      const seconds = idleSeconds(random)
      expect(seconds).toBeGreaterThanOrEqual(DURATIONS.animalIdleMin)
      expect(seconds).toBeLessThanOrEqual(DURATIONS.animalIdleMax)
    }
  })

  it('walks at the species speed with a minimum step time', () => {
    expect(walkSeconds({ x: 0, z: 0 }, { x: 3, z: 4 }, 1)).toBe(5)
    expect(walkSeconds({ x: 0, z: 0 }, { x: 0, z: 0.01 }, 1)).toBe(DURATIONS.animalStepMin)
  })

  it('faces the target and turns the short way', () => {
    expect(headingTo({ x: 0, z: 0 }, { x: 0, z: 1 })).toBeCloseTo(0)
    expect(headingTo({ x: 0, z: 0 }, { x: 1, z: 0 })).toBeCloseTo(Math.PI / 2)
    expect(closestAngle(3, -3)).toBeCloseTo(-3 + Math.PI * 2)
  })

  it('keeps away from where other animals stand or are heading', () => {
    const random = createRandom(11)
    const others = [{ x: 1, z: 1 }, { x: 5, z: 3 }, { x: 3, z: 0.5 }].map((point) => ({ from: point, to: point }))
    for (let index = 0; index < 40; index += 1) {
      const from = { x: 3, z: 3 }
      const target = nextTarget(random, pasture, from, 1.2, others)
      if (target === from) continue
      for (const other of others) expect(Math.hypot(target.x - other.to.x, target.z - other.to.z)).toBeGreaterThanOrEqual(1.2)
    }
  })

  it('never walks through another animal on the way', () => {
    const random = createRandom(5)
    const blocker = { x: 3, z: 2 }
    for (let index = 0; index < 40; index += 1) {
      const target = nextTarget(random, pasture, { x: 0.5, z: 2 }, 1.2, [{ from: blocker, to: blocker }])
      const t = Math.max(0, Math.min(1, ((blocker.x - 0.5) * (target.x - 0.5) + (blocker.z - 2) * (target.z - 2)) / ((target.x - 0.5) ** 2 + (target.z - 2) ** 2 || 1)))
      const closest = { x: 0.5 + (target.x - 0.5) * t, z: 2 + (target.z - 2) * t }
      expect(Math.hypot(closest.x - blocker.x, closest.z - blocker.z)).toBeGreaterThanOrEqual(1)
    }
  })

  it('lets only animals with a walk cycle roam; the others graze in place', () => {
    expect(SPECIES_GAIT.cow).toBe('walk')
    expect(SPECIES_GAIT.horse).toBe('walk')
    expect(SPECIES_GAIT.pig).toBe('graze')
    expect(SPECIES_GAIT.sheep).toBe('graze')
  })

  it('never crosses the path another animal is walking', () => {
    const random = createRandom(9)
    const walker = { from: { x: 0, z: 2 }, to: { x: 6, z: 2 } }
    for (let index = 0; index < 40; index += 1) {
      const from = { x: 3, z: 0.4 }
      const target = nextTarget(random, pasture, from, 1.2, [walker])
      expect(segmentDistance(from, target, walker.from, walker.to)).toBeGreaterThanOrEqual(1)
    }
  })

  it('shrinks personal space with the animal scale', () => {
    const random = createRandom(2)
    const others = [{ from: { x: 3, z: 2 }, to: { x: 3, z: 2 } }]
    const target = nextTarget(random, pasture, { x: 0.5, z: 0.5 }, 0.6, others, 0.5)
    expect(Math.hypot(target.x - 3, target.z - 2)).toBeGreaterThanOrEqual(0.6)
  })

  const walk = Array.from({ length: 24 * 24 }, (_, index) => ({ x: -3 + (index % 24) * 0.25 + 0.125, z: -3 + Math.floor(index / 24) * 0.25 + 0.125 })).filter((cell) => !(cell.x > -0.5 && cell.x < 0.5 && cell.z > -0.5 && cell.z < 0.5))

  it('only walks across free cells of the pen', () => {
    const random = createRandom(2)
    for (let run = 0; run < 50; run += 1) {
      const target = nextWalkTarget(random, walk, { x: -2.125, z: -2.125 }, 0.4, [])
      for (let t = 0; t <= 1; t += 0.05) {
        const point = { x: -2.125 + (target.x + 2.125) * t, z: -2.125 + (target.z + 2.125) * t }
        expect(walk.some((cell) => Math.hypot(cell.x - point.x, cell.z - point.z) <= 0.19)).toBe(true)
      }
    }
  })

  it('never walks through another animal standing or walking', () => {
    const random = createRandom(3)
    const other: Course = { from: { x: 0.125, z: 2.125 }, to: { x: 0.125, z: 2.125 }, radius: 0.55 }
    for (let run = 0; run < 50; run += 1) {
      const target = nextWalkTarget(random, walk, { x: -2.125, z: 2.125 }, 0.55, [other])
      expect(segmentDistance({ x: -2.125, z: 2.125 }, target, other.from, other.to)).toBeGreaterThanOrEqual(1.1 - 1e-9)
    }
  })

  it('stays put when boxed in', () => {
    expect(nextWalkTarget(createRandom(1), [{ x: 0.125, z: 0.125 }], { x: 0.125, z: 0.125 }, 0.4, [])).toEqual({ x: 0.125, z: 0.125 })
  })
})
