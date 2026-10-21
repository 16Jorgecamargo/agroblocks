import { findPath, segmentClear } from '@/render/world/navigation/findPath'
import { createGrid, markCircle, markRect, markSegment } from '@/render/world/navigation/occupancy'
import { walkMask, type WalkMask } from '@/render/world/navigation/passability'
import type { Vec2 } from '@/render/world/worldTypes'

const legsClear = (mask: WalkMask, path: Vec2[]) => path.every((point, index) => index === 0 || segmentClear(mask, path[index - 1], point))

describe('find path', () => {
  it('goes straight on open ground', () => {
    const mask = walkMask(createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 }), 'person')
    expect(findPath(mask, { x: -4, z: 0 }, { x: 4, z: 0 })).toEqual([{ x: -4, z: 0 }, { x: 4, z: 0 }])
  })

  it('walks around a wall with every leg clear', () => {
    const grid = createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 })
    markRect(grid, { x: 0, z: 0 }, 0.5, 6, 0, 'structure')
    const mask = walkMask(grid, 'person')
    const path = findPath(mask, { x: -3, z: 0 }, { x: 3, z: 0 })!
    expect(path.length).toBeGreaterThan(2)
    expect(legsClear(mask, path)).toBe(true)
  })

  it('returns null when the goal is closed or unreachable', () => {
    const grid = createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 })
    markSegment(grid, { x: 0, z: -5 }, { x: 0, z: 5 }, 0.3, 'fence')
    const mask = walkMask(grid, 'person')
    expect(findPath(mask, { x: -3, z: 0 }, { x: 3, z: 0 })).toBeNull()
    expect(findPath(mask, { x: -3, z: 0 }, { x: 0, z: 0 })).toBeNull()
  })

  it('bends around a mission marker on the road', () => {
    const grid = createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 })
    markSegment(grid, { x: -5, z: 0 }, { x: 5, z: 0 }, 1.3, 'road')
    markCircle(grid, { x: 0, z: 0 }, 0.8, 'marker')
    const mask = walkMask(grid, 'person')
    const path = findPath(mask, { x: -4, z: 0 }, { x: 4, z: 0 })!
    expect(path.length).toBeGreaterThan(2)
    expect(legsClear(mask, path)).toBe(true)
  })
})
