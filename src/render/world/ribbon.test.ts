import { ribbonGeometry } from '@/render/world/ribbon'

describe('ribbonGeometry', () => {
  it('builds a strip with two vertices per sample along the line', () => {
    const geometry = ribbonGeometry([{ x: 0, z: 0 }, { x: 4, z: 0 }], 1)
    const positions = geometry.getAttribute('position')
    expect(positions.count % 2).toBe(0)
    expect(positions.count).toBeGreaterThanOrEqual(10)
    for (let index = 0; index < positions.count; index += 1) {
      expect(Math.abs(positions.getZ(index))).toBeCloseTo(0.5, 5)
      expect(positions.getY(index)).toBe(0)
    }
    expect(geometry.getIndex()?.count).toBe((positions.count / 2 - 1) * 6)
  })

  it('returns an empty geometry for lines with fewer than two points', () => {
    expect(ribbonGeometry([{ x: 0, z: 0 }], 1).getAttribute('position')).toBeUndefined()
  })
})
