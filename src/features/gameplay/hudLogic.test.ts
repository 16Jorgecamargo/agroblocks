import { arcKeyframes, resourceLevel, resourceMaxima } from '@/features/gameplay/hudLogic'
import { getMission } from '@/data/missions'

describe('hudLogic', () => {
  it('classifies resource levels', () => {
    expect(resourceLevel(null, 10)).toBe('ok')
    expect(resourceLevel(5, null)).toBe('ok')
    expect(resourceLevel(0, 10)).toBe('empty')
    expect(resourceLevel(2, 10)).toBe('low')
    expect(resourceLevel(3, 10)).toBe('ok')
  })

  it('derives maxima from capacities and initial values', () => {
    const fifth = getMission('m5-limited-resources')
    const sixth = getMission('m6-efficient-farm')
    if (!fifth || !sixth) throw new Error('missing')
    expect(resourceMaxima(fifth)).toEqual({ seeds: 6, water: 3, energy: null })
    expect(resourceMaxima(sixth)).toEqual({ seeds: 16, water: 16, energy: 70 })
  })

  it('builds an arc that ends at the target and rises in the middle', () => {
    const arc = arcKeyframes({ x: 100, y: 400 }, { x: 900, y: 40 }, 120)
    expect(arc.x).toEqual([0, 400, 800])
    expect(arc.y[0]).toBe(0)
    expect(arc.y[2]).toBe(-360)
    expect(arc.y[1]).toBe(-300)
  })
})
