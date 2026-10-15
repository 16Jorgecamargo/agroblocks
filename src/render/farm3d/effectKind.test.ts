import { effectKind } from '@/render/farm3d/effectKind'

describe('effectKind', () => {
  it('maps farm events to particle effects', () => {
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'untilled', to: 'tilled' })).toBe('soil')
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'tilled', to: 'seeded' })).toBe('seed')
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'mature', to: 'harvested' })).toBe('harvest')
    expect(effectKind({ type: 'moistureChanged', x: 0, y: 0, moisture: 'wet' })).toBe('water')
  })

  it('shows nothing for growth, drying or movement', () => {
    expect(effectKind({ type: 'plotChanged', x: 0, y: 0, from: 'seeded', to: 'growing' })).toBeNull()
    expect(effectKind({ type: 'moistureChanged', x: 0, y: 0, moisture: 'dry' })).toBeNull()
    expect(effectKind({ type: 'robotTurned', facing: 'N' })).toBeNull()
  })
})
