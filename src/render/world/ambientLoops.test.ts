import { butterflyPath } from '@/render/world/ambientLoops'

describe('butterflyPath', () => {
  it('loops around its center and closes where it started', () => {
    const path = butterflyPath({ x: 2, z: -1 }, 3)
    expect(path.x.length).toBe(path.z.length)
    expect(path.x[0]).toBeCloseTo(path.x[path.x.length - 1])
    expect(path.z[0]).toBeCloseTo(path.z[path.z.length - 1])
    for (let index = 0; index < path.x.length; index += 1) {
      expect(Math.hypot(path.x[index] - 2, path.z[index] + 1)).toBeLessThanOrEqual(1.01)
      expect(path.y[index]).toBeGreaterThanOrEqual(0.5)
    }
  })
})
