import { shakeTrack } from '@/render/farm3d/robotMotion'

describe('robot shake', () => {
  it('shakes around the cell center and ends exactly on it', () => {
    const track = shakeTrack(2.5)
    expect(track[0]).toBe(2.5)
    expect(track.at(-1)).toBe(2.5)
    expect(Math.max(...track)).toBeGreaterThan(2.5)
    expect(Math.min(...track)).toBeLessThan(2.5)
  })
})
