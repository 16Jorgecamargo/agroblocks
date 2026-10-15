import { HOME_HILLS, hillScatter, hillSurfaceY } from '@/render/world/hillScatter'
import { createRandom } from '@/render/seededRandom'
import { propMatrix } from '@/render/world/instancing'
import { Quaternion, Vector3 } from 'three'

function scatter(density: 'full' | 'light' = 'full') {
  return hillScatter(createRandom(7), HOME_HILLS, density)
}

describe('hillScatter', () => {
  it('is deterministic', () => {
    expect(scatter()).toEqual(scatter())
  })

  it('fills the far hills with trees, pines, bushes and rocks', () => {
    const props = scatter()
    expect(props.length).toBeGreaterThanOrEqual(60)
    const models = new Set(props.map((prop) => prop.model))
    expect(models.has('pine')).toBe(true)
    expect(models.has('bush')).toBe(true)
    expect(models.has('rock-a')).toBe(true)
    expect(scatter('light').length).toBeLessThan(props.length * 0.6)
  })

  it('stands every element on the surface of a hill, above the plain', () => {
    for (const prop of scatter()) {
      const y = prop.y ?? 0
      expect(y).toBeGreaterThan(0.3)
      expect(HOME_HILLS.some((hill) => Math.abs(hillSurfaceY(hill, prop.x, prop.z) - y) < 1e-9)).toBe(true)
    }
  })

  it('keeps real-world sizes so distance alone makes them look smaller', () => {
    for (const prop of scatter()) {
      expect(prop.scale).toBeGreaterThanOrEqual(0.85)
      expect(prop.scale).toBeLessThanOrEqual(1.3)
    }
  })

  it('places instances at the height of the hill surface', () => {
    const position = new Vector3()
    propMatrix({ model: 'pine', x: 1, z: 2, y: 3, rotation: 0, scale: 1 }, { scale: 1, yOffset: 0, rotationY: 0 }).decompose(position, new Quaternion(), new Vector3())
    expect(position.y).toBe(3)
  })

  it('reports no surface outside a hill footprint', () => {
    const hill = HOME_HILLS[0]
    expect(hillSurfaceY(hill, hill.x + hill.width * 2, hill.z)).toBe(-Infinity)
  })
})
