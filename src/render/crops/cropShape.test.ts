import { cropShape, cropStageFor } from '@/render/crops/cropShape'

describe('cropStageFor', () => {
  it('maps plot states to the three tomato stages', () => {
    expect(cropStageFor('seeded')).toBe('planted')
    expect(cropStageFor('growing')).toBe('growing')
    expect(cropStageFor('mature')).toBe('ready')
    expect(cropStageFor('untilled')).toBeNull()
    expect(cropStageFor('tilled')).toBeNull()
    expect(cropStageFor('harvested')).toBeNull()
  })
})

describe('cropShape', () => {
  it('shows a full bush with big red tomatoes and a glow when ready', () => {
    const ready = cropShape('ready')
    const red = ready.fruits.filter((fruit) => fruit.color === 'red')
    expect(red.length).toBeGreaterThanOrEqual(5)
    for (const fruit of red) expect(fruit.radius).toBeGreaterThanOrEqual(0.08)
    expect(ready.glow).toBe(true)
  })

  it('keeps growing plants green and without glow', () => {
    const growing = cropShape('growing')
    expect(growing.fruits.filter((fruit) => fruit.color === 'red')).toHaveLength(0)
    expect(growing.glow).toBe(false)
  })

  it('makes each stage clearly bigger than the previous one', () => {
    const planted = cropShape('planted')
    const growing = cropShape('growing')
    const ready = cropShape('ready')
    expect(growing.width).toBeGreaterThanOrEqual(planted.width * 2)
    expect(ready.width).toBeGreaterThanOrEqual(growing.width * 1.25)
    expect(ready.height).toBeGreaterThan(growing.height)
    expect(ready.width).toBeLessThanOrEqual(0.8)
  })

  it('puts a soil mound only under the fresh sprout', () => {
    expect(cropShape('planted').mound).toBe(true)
    expect(cropShape('growing').mound).toBe(false)
    expect(cropShape('ready').mound).toBe(false)
  })
})
