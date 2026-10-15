import { DURATIONS } from '@/motion/presets'
import { createRandom } from '@/render/seededRandom'
import { closestAngle, headingTo, idleSeconds, nextTarget, walkSeconds } from '@/render/world/animalBrain'
import { pointInPolygon, rectPolygon } from '@/render/world/geometry'
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
    const others = [{ x: 1, z: 1 }, { x: 5, z: 3 }, { x: 3, z: 0.5 }]
    for (let index = 0; index < 40; index += 1) {
      const from = { x: 3, z: 3 }
      const target = nextTarget(random, pasture, from, 1.2, others)
      if (target === from) continue
      for (const other of others) expect(Math.hypot(target.x - other.x, target.z - other.z)).toBeGreaterThanOrEqual(1.2)
    }
  })

  it('never walks through another animal on the way', () => {
    const random = createRandom(5)
    const blocker = { x: 3, z: 2 }
    for (let index = 0; index < 40; index += 1) {
      const target = nextTarget(random, pasture, { x: 0.5, z: 2 }, 1.2, [blocker])
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
})
