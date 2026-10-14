import { lockReason, mapScenery, NODE_POSITIONS, pathStones } from '@/features/mission-select/missionMapLayout'

describe('missionMapLayout', () => {
  it('has one distinct node per mission', () => {
    expect(NODE_POSITIONS).toHaveLength(7)
    expect(new Set(NODE_POSITIONS.map(([x, z]) => `${x},${z}`)).size).toBe(7)
  })

  it('lays stones between consecutive nodes', () => {
    expect(pathStones()).toHaveLength(6 * 3)
  })

  it('keeps scenery away from nodes', () => {
    for (const item of mapScenery('map', 40)) {
      for (const [x, z] of NODE_POSITIONS) expect(Math.hypot(item.x - x, item.z - z)).toBeGreaterThan(1.3)
    }
  })

  it('explains why a mission is locked', () => {
    expect(lockReason(3)).toBe('Conclua a fase 2 para desbloquear.')
  })
})
