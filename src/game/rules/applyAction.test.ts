import { applyAction, ENERGY_COST } from '@/game/rules/applyAction'
import { makeState } from '@/game/testing/makeState'
import { ACTION_TYPES } from '@/game/world/types'

describe('applyAction', () => {
  it('defines an energy cost for every action, zero only for turns', () => {
    for (const action of ACTION_TYPES) {
      const expected = action === 'turnLeft' || action === 'turnRight' ? 0 : 1
      expect(ENERGY_COST[action]).toBe(expected)
    }
  })

  it('ticks the world after every successful action', () => {
    const state = makeState(['sw .'], { x: 1 })
    const result = applyAction(state, 'turnLeft', { growTicks: 1, forbidWaterWet: false })
    expect(result.state.cells[0][0].plot).toBe('growing')
    expect(result.events.at(-2)).toEqual({ type: 'plotChanged', x: 0, y: 0, from: 'seeded', to: 'growing' })
  })

  it('grows a plant watered in the same action', () => {
    const state = makeState(['s'], {}, { water: 1 })
    const result = applyAction(state, 'water', { growTicks: 2, forbidWaterWet: false })
    expect(result.state.cells[0][0]).toMatchObject({ moisture: 'wet', growth: 1 })
  })

  it('does not tick the world when the action fails', () => {
    const state = makeState(['sw #'])
    const result = applyAction(state, 'moveForward', { growTicks: 1, forbidWaterWet: false })
    expect(result.state).toBe(state)
  })

  it('checks energy before every action with cost', () => {
    const state = makeState(['t'], {}, { energy: 0, seeds: 1 })
    expect(applyAction(state, 'plant', { growTicks: 1, forbidWaterWet: false }).error?.code).toBe('NO_ENERGY')
    expect(applyAction(state, 'turnRight', { growTicks: 1, forbidWaterWet: false }).error).toBeUndefined()
  })
})
