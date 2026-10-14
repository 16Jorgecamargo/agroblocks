import { tickWorld } from '@/game/rules/growth'
import { makeState } from '@/game/testing/makeState'

describe('tickWorld', () => {
  it('grows a seeded plant on wet soil by one point per tick', () => {
    const result = tickWorld(makeState(['sw']), 3)
    expect(result.state.cells[0][0]).toMatchObject({ plot: 'seeded', growth: 1, moisture: 'wet' })
    expect(result.events).toEqual([])
  })

  it('does not grow plants on dry soil and does not kill them', () => {
    const result = tickWorld(makeState(['s g']), 1)
    expect(result.state.cells[0][0]).toMatchObject({ plot: 'seeded', growth: 0 })
    expect(result.state.cells[0][1]).toMatchObject({ plot: 'growing', growth: 0 })
  })

  it('advances seeded to growing at the threshold and dries the soil', () => {
    const first = tickWorld(makeState(['sw']), 2)
    const second = tickWorld(first.state, 2)
    expect(second.state.cells[0][0]).toEqual({ terrain: 'soil', plot: 'growing', moisture: 'dry', growth: 0 })
    expect(second.events).toEqual([
      { type: 'plotChanged', x: 0, y: 0, from: 'seeded', to: 'growing' },
      { type: 'moistureChanged', x: 0, y: 0, moisture: 'dry' },
    ])
  })

  it('advances growing to mature', () => {
    const result = tickWorld(makeState(['gw']), 1)
    expect(result.state.cells[0][0].plot).toBe('mature')
  })

  it('ignores mature, tilled and non-soil cells', () => {
    const state = makeState(['mw tw R'])
    const result = tickWorld(state, 1)
    expect(result.state.cells).toEqual(state.cells)
  })
})
