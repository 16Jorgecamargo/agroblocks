import { DURATIONS } from '@/motion/presets'
import { createRandom } from '@/render/seededRandom'
import { closestAngle, headingTo, idleSeconds, nextTarget, walkSeconds } from '@/render/world/animalBrain'
import { pointInPolygon, rectPolygon } from '@/render/world/geometry'

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
})
