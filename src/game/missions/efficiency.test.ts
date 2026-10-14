import { computeEfficiencyStars } from '@/game/missions/efficiency'

describe('computeEfficiencyStars', () => {
  const reference = { referenceActions: 10, referenceBlocks: 5 }

  it('gives 3 stars at or near the reference', () => {
    expect(computeEfficiencyStars({ actions: 10, blocks: 5 }, reference)).toBe(3)
    expect(computeEfficiencyStars({ actions: 11, blocks: 5 }, reference)).toBe(3)
    expect(computeEfficiencyStars({ actions: 8, blocks: 4 }, reference)).toBe(3)
  })

  it('gives 2 stars up to 50% above the reference', () => {
    expect(computeEfficiencyStars({ actions: 15, blocks: 5 }, reference)).toBe(2)
    expect(computeEfficiencyStars({ actions: 10, blocks: 7 }, reference)).toBe(2)
  })

  it('gives 1 star beyond that but never zero', () => {
    expect(computeEfficiencyStars({ actions: 40, blocks: 30 }, reference)).toBe(1)
  })
})
