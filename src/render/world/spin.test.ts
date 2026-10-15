import { spinAxis } from '@/render/world/spin'

describe('spinAxis', () => {
  it('spins blades around their thinnest local axis', () => {
    expect(spinAxis([2, 0.11, 2])).toBe('y')
    expect(spinAxis([0.1, 2, 2])).toBe('x')
    expect(spinAxis([2, 2, 0.2])).toBe('z')
  })
})
