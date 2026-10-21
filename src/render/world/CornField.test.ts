import { describe, expect, it } from 'vitest'
import { cornGeometry } from '@/render/world/CornField'

describe('cornGeometry', () => {
  it('merges the whole stalk into one colored geometry', () => {
    const geometry = cornGeometry()
    expect(geometry.attributes.position.count).toBeGreaterThan(100)
    expect(geometry.attributes.color.count).toBe(geometry.attributes.position.count)
  })

  it('keeps the stalk standing about one and a half units tall', () => {
    const geometry = cornGeometry()
    geometry.computeBoundingBox()
    expect(geometry.boundingBox?.min.y).toBeCloseTo(0, 1)
    expect(geometry.boundingBox?.max.y).toBeGreaterThan(1.4)
    expect(geometry.boundingBox?.max.y).toBeLessThan(1.8)
  })
})
