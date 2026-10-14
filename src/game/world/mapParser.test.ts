import { MapParseError, parseMap } from '@/game/world/mapParser'

describe('parseMap', () => {
  it('parses soil states, moisture suffix and terrain tokens', () => {
    const map = parseMap(['. tw g mw', '# X R S'])
    expect(map.width).toBe(4)
    expect(map.height).toBe(2)
    expect(map.cells[0][0]).toEqual({ terrain: 'soil', plot: 'untilled', moisture: 'dry', growth: 0 })
    expect(map.cells[0][1]).toEqual({ terrain: 'soil', plot: 'tilled', moisture: 'wet', growth: 0 })
    expect(map.cells[0][2].plot).toBe('growing')
    expect(map.cells[0][3]).toMatchObject({ plot: 'mature', moisture: 'wet' })
    expect(map.cells[1].map((cell) => cell.terrain)).toEqual(['obstacle', 'blocked', 'reservoir', 'seedDepot'])
  })

  it('parses seeded and harvested tokens', () => {
    const map = parseMap(['s h'])
    expect(map.cells[0].map((cell) => cell.plot)).toEqual(['seeded', 'harvested'])
  })

  it('tolerates repeated spaces between tokens', () => {
    expect(parseMap(['.   .  .']).width).toBe(3)
  })

  it('rejects rows of different widths', () => {
    expect(() => parseMap(['. .', '.'])).toThrow(MapParseError)
  })

  it('rejects unknown tokens and moisture on non-soil terrain', () => {
    expect(() => parseMap(['. q'])).toThrow(MapParseError)
    expect(() => parseMap(['#w'])).toThrow(MapParseError)
    expect(() => parseMap(['.x'])).toThrow(MapParseError)
  })

  it('rejects an empty map', () => {
    expect(() => parseMap([])).toThrow(MapParseError)
  })
})
