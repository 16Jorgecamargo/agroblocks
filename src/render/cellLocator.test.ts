import { locateCell, registerCellLocator } from '@/render/cellLocator'

describe('cellLocator', () => {
  it('returns null without a registered view', () => {
    expect(locateCell(0, 0)).toBeNull()
  })

  it('uses the latest registered locator and unregisters cleanly', () => {
    const first = registerCellLocator((x, y) => ({ x: x * 10, y: y * 10 }))
    expect(locateCell(2, 3)).toEqual({ x: 20, y: 30 })
    const second = registerCellLocator(() => ({ x: 1, y: 1 }))
    first()
    expect(locateCell(2, 3)).toEqual({ x: 1, y: 1 })
    second()
    expect(locateCell(2, 3)).toBeNull()
  })
})
