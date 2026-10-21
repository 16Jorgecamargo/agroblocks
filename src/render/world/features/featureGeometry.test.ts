import { describe, expect, it } from 'vitest'
import { featureGeometry, featureGlass, groupFeatures } from '@/render/world/features/featureGeometry'
import { FEATURE_KINDS, type WorldFeature } from '@/render/world/worldTypes'

function feature(kind: WorldFeature['kind'], tint?: string): WorldFeature {
  return tint === undefined ? { kind, x: 0, z: 0, rotation: 0, scale: 1 } : { kind, x: 0, z: 0, rotation: 0, scale: 1, tint }
}

describe('feature geometry', () => {
  it.each(FEATURE_KINDS)('%s builds one colored geometry standing on the ground', (kind) => {
    const geometry = featureGeometry(kind)
    geometry.computeBoundingBox()
    expect(geometry.attributes.position.count).toBeGreaterThan(0)
    expect(geometry.attributes.color.count).toBe(geometry.attributes.position.count)
    expect(Math.abs(geometry.boundingBox?.min.y ?? 1)).toBeLessThan(0.1)
  })

  it('builds the same geometry once per kind and tint', () => {
    expect(featureGeometry('cornStalk')).toBe(featureGeometry('cornStalk'))
    expect(featureGeometry('fruitTree', '#e0473c')).not.toBe(featureGeometry('fruitTree', '#f29a2e'))
  })

  it('keeps the greenhouse glass apart so it can be see-through', () => {
    expect(featureGlass('greenhouse')?.attributes.position.count).toBeGreaterThan(0)
    expect(featureGlass('cornStalk')).toBeNull()
  })

  it('groups features by kind and tint for instancing', () => {
    const groups = groupFeatures([feature('fruitTree', '#e0473c'), feature('fruitTree', '#f29a2e'), feature('cornStalk'), feature('cornStalk')])
    expect(groups.get('fruitTree|#e0473c')).toHaveLength(1)
    expect(groups.get('fruitTree|#f29a2e')).toHaveLength(1)
    expect(groups.get('cornStalk|')).toHaveLength(2)
  })

  it('merges the whole corn stalk into one colored geometry about one and a half units tall', () => {
    const geometry = featureGeometry('cornStalk')
    geometry.computeBoundingBox()
    expect(geometry.attributes.position.count).toBeGreaterThan(100)
    expect(geometry.boundingBox?.max.y).toBeGreaterThan(1.4)
    expect(geometry.boundingBox?.max.y).toBeLessThan(1.8)
  })
})
