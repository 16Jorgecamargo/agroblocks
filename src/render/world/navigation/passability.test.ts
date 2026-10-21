import { createGrid, markCircle, markRect, markSegment } from '@/render/world/navigation/occupancy'
import { isOpen, walkMask } from '@/render/world/navigation/passability'

describe('walk masks', () => {
  it('lets people walk the road and free ground but not into beds or water', () => {
    const grid = createGrid({ minX: -4, maxX: 4, minZ: -4, maxZ: 4 })
    markRect(grid, { x: 0, z: 0 }, 1.4, 0.8, 0, 'crop')
    markCircle(grid, { x: 3, z: 3 }, 0.6, 'water')
    const person = walkMask(grid, 'person')
    expect(isOpen(person, { x: 0, z: 0 })).toBe(false)
    expect(isOpen(person, { x: 0, z: 0.75 })).toBe(true)
    expect(isOpen(person, { x: 3, z: 3 })).toBe(false)
  })

  it('rejects a free gap too narrow for a person between two beds', () => {
    const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
    markRect(grid, { x: 0, z: -0.5 }, 2, 0.8, 0, 'crop')
    markRect(grid, { x: 0, z: 0.5 }, 2, 0.8, 0, 'crop')
    expect(isOpen(walkMask(grid, 'person'), { x: 0, z: 0 })).toBe(false)
  })

  it('keeps tractors further from obstacles than people', () => {
    const grid = createGrid({ minX: -4, maxX: 4, minZ: -4, maxZ: 4 })
    markRect(grid, { x: 0, z: 0 }, 1, 1, 0, 'structure')
    expect(isOpen(walkMask(grid, 'person'), { x: 0.9, z: 0 })).toBe(true)
    expect(isOpen(walkMask(grid, 'tractor'), { x: 0.9, z: 0 })).toBe(false)
  })

  it('keeps animals off roads, troughs and fences', () => {
    const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
    markRect(grid, { x: 0, z: 0 }, 1.2, 0.5, 0, 'feed')
    markSegment(grid, { x: -3, z: 2 }, { x: 3, z: 2 }, 0.15, 'fence')
    const animal = walkMask(grid, 'animal')
    expect(isOpen(animal, { x: 0, z: 0 })).toBe(false)
    expect(isOpen(animal, { x: 0, z: 1.9 })).toBe(false)
    expect(isOpen(animal, { x: -2, z: -2 })).toBe(true)
  })
})
