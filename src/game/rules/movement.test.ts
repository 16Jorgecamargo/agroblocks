import { applyAction } from '@/game/rules/applyAction'
import { makeState } from '@/game/testing/makeState'

const rules = { growTicks: 3, forbidWaterWet: false }

describe('movement', () => {
  it('moves forward one cell, spends one energy and emits robotMoved', () => {
    const state = makeState(['. .'], { facing: 'E' }, { energy: 5 })
    const result = applyAction(state, 'moveForward', rules)
    expect(result.error).toBeUndefined()
    expect(result.state.robot).toEqual({ x: 1, y: 0, facing: 'E' })
    expect(result.state.resources.energy).toBe(4)
    expect(result.state.usage.energy).toBe(1)
    expect(result.state.actionCount).toBe(1)
    expect(result.events[0]).toEqual({ type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } })
  })

  it('turns without spending energy', () => {
    const state = makeState(['.'], { facing: 'N' }, { energy: 1 })
    const left = applyAction(state, 'turnLeft', rules)
    const right = applyAction(state, 'turnRight', rules)
    expect(left.state.robot.facing).toBe('W')
    expect(right.state.robot.facing).toBe('E')
    expect(left.state.resources.energy).toBe(1)
    expect(left.events).toEqual([{ type: 'robotTurned', facing: 'W' }])
  })

  it('fails with OUT_OF_BOUNDS at the map edge and keeps the state', () => {
    const state = makeState(['.'], { facing: 'N' })
    const result = applyAction(state, 'moveForward', rules)
    expect(result.error?.code).toBe('OUT_OF_BOUNDS')
    expect(result.state).toBe(state)
    expect(result.events).toEqual([])
  })

  it('fails with HIT_OBSTACLE on obstacles and blocked areas', () => {
    expect(applyAction(makeState(['. #']), 'moveForward', rules).error?.code).toBe('HIT_OBSTACLE')
    expect(applyAction(makeState(['. X']), 'moveForward', rules).error?.code).toBe('HIT_OBSTACLE')
  })

  it('walks onto reservoirs and seed depots', () => {
    const result = applyAction(makeState(['. R']), 'moveForward', rules)
    expect(result.state.robot.x).toBe(1)
  })

  it('fails with NO_ENERGY before moving when energy is zero', () => {
    const result = applyAction(makeState(['. .'], {}, { energy: 0 }), 'moveForward', rules)
    expect(result.error?.code).toBe('NO_ENERGY')
  })

  it('applies mission specific hints to errors', () => {
    const result = applyAction(makeState(['. #']), 'moveForward', {
      ...rules,
      mistakes: { HIT_OBSTACLE: 'A pedra está logo à frente.' },
    })
    expect(result.error?.hint).toBe('A pedra está logo à frente.')
  })
})
