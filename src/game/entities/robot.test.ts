import { positionAhead, rotateLeft, rotateRight } from '@/game/entities/robot'

describe('robot orientation', () => {
  it('rotates right through a full cycle', () => {
    expect(rotateRight('N')).toBe('E')
    expect(rotateRight('E')).toBe('S')
    expect(rotateRight('S')).toBe('W')
    expect(rotateRight('W')).toBe('N')
  })

  it('rotates left through a full cycle', () => {
    expect(rotateLeft('N')).toBe('W')
    expect(rotateLeft('W')).toBe('S')
    expect(rotateLeft('S')).toBe('E')
    expect(rotateLeft('E')).toBe('N')
  })

  it('computes the position ahead for each facing with y growing south', () => {
    expect(positionAhead({ x: 2, y: 2, facing: 'N' })).toEqual({ x: 2, y: 1 })
    expect(positionAhead({ x: 2, y: 2, facing: 'E' })).toEqual({ x: 3, y: 2 })
    expect(positionAhead({ x: 2, y: 2, facing: 'S' })).toEqual({ x: 2, y: 3 })
    expect(positionAhead({ x: 2, y: 2, facing: 'W' })).toEqual({ x: 1, y: 2 })
  })
})
