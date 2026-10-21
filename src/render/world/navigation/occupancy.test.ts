import { createGrid, markCircle, markPolygon, markRect, markSegment, occupantAt } from '@/render/world/navigation/occupancy'

describe('occupancy grid', () => {
  it('starts free and reports structure outside', () => {
    const grid = createGrid({ minX: -2, maxX: 2, minZ: -1, maxZ: 1 })
    expect(grid.columns).toBe(16)
    expect(grid.rows).toBe(8)
    expect(occupantAt(grid, { x: 0, z: 0 })).toBe('free')
    expect(occupantAt(grid, { x: 5, z: 0 })).toBe('structure')
  })

  it('marks a rotated rectangle by its real shape', () => {
    const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
    markRect(grid, { x: 0, z: 0 }, 4, 0.5, Math.PI / 2, 'structure')
    expect(occupantAt(grid, { x: 0, z: 1.8 })).toBe('structure')
    expect(occupantAt(grid, { x: 1.8, z: 0 })).toBe('free')
  })

  it('keeps the higher-priority occupant', () => {
    const grid = createGrid({ minX: -2, maxX: 2, minZ: -2, maxZ: 2 })
    markCircle(grid, { x: 0, z: 0 }, 1, 'water')
    markCircle(grid, { x: 0, z: 0 }, 1, 'road')
    expect(occupantAt(grid, { x: 0, z: 0 })).toBe('water')
  })

  it('marks fence segments and polygons', () => {
    const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
    markSegment(grid, { x: -2, z: 1 }, { x: 2, z: 1 }, 0.15, 'fence')
    markPolygon(grid, [{ x: -2, z: -2 }, { x: 0, z: -2 }, { x: -1, z: -0.5 }], 'water')
    expect(occupantAt(grid, { x: 0.3, z: 1 })).toBe('fence')
    expect(occupantAt(grid, { x: 0.3, z: 1.4 })).toBe('free')
    expect(occupantAt(grid, { x: -1, z: -1.5 })).toBe('water')
  })
})
