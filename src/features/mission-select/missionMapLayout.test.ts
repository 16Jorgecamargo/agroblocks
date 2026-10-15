import * as layout from '@/features/mission-select/missionMapLayout'

describe('missionMapLayout', () => {
  it('has one distinct node per mission', () => {
    expect(layout.NODE_POSITIONS).toHaveLength(7)
    expect(new Set(layout.NODE_POSITIONS.map(([x, z]) => `${x},${z}`)).size).toBe(7)
  })

  it('leaves scenery to the shared world builder', () => {
    expect(Object.keys(layout).sort()).toEqual(['NODE_POSITIONS', 'lockReason'])
  })

  it('explains why a mission is locked', () => {
    expect(layout.lockReason(3)).toBe('Conclua a fase 2 para desbloquear.')
  })
})
