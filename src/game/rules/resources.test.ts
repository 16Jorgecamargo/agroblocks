import { canSpend, resourceEvents, spend } from '@/game/rules/resources'
import { makeState } from '@/game/testing/makeState'

describe('resources', () => {
  it('treats null as unlimited', () => {
    expect(canSpend({ seeds: null, water: 0, energy: 1, harvested: 0 }, 'seeds', 99)).toBe(true)
    expect(canSpend({ seeds: null, water: 0, energy: 1, harvested: 0 }, 'water', 1)).toBe(false)
  })

  it('decrements limited resources and always tracks usage', () => {
    const state = makeState(['.'], {}, { water: 3, seeds: null })
    const next = spend(spend(state, 'water', 1), 'seeds', 2)
    expect(next.resources.water).toBe(2)
    expect(next.resources.seeds).toBeNull()
    expect(next.usage).toEqual({ seeds: 2, water: 1, energy: 0 })
  })

  it('emits events only for resources that changed', () => {
    const before = { seeds: 2, water: 3, energy: null, harvested: 0 }
    const after = { seeds: 1, water: 3, energy: null, harvested: 1 }
    expect(resourceEvents(before, after)).toEqual([
      { type: 'resourceChanged', resource: 'seeds', value: 1 },
      { type: 'resourceChanged', resource: 'harvested', value: 1 },
    ])
  })
})
