import { createInitialState, UNLIMITED_RESOURCES } from '@/game/world/createInitialState'
import { MapParseError } from '@/game/world/mapParser'
import { getCell, isInside, updateCell } from '@/game/world/grid'

describe('createInitialState', () => {
  const setup = {
    map: { cells: ['. .', '. #'] },
    robot: { x: 0, y: 0, facing: 'E' as const },
    resources: { seeds: 3, water: 2, energy: 10, seedCapacity: 5, waterCapacity: 4 },
  }

  it('builds the state with resources, capacity and zero usage', () => {
    const state = createInitialState(setup)
    expect(state.robot).toEqual({ x: 0, y: 0, facing: 'E' })
    expect(state.resources).toEqual({ seeds: 3, water: 2, energy: 10, harvested: 0 })
    expect(state.capacity).toEqual({ seeds: 5, water: 4 })
    expect(state.usage).toEqual({ seeds: 0, water: 0, energy: 0 })
    expect(state.actionCount).toBe(0)
  })

  it('accepts unlimited resources', () => {
    const state = createInitialState({ ...setup, resources: UNLIMITED_RESOURCES })
    expect(state.resources.water).toBeNull()
  })

  it('rejects a robot outside the map or on an obstacle', () => {
    expect(() => createInitialState({ ...setup, robot: { x: 5, y: 0, facing: 'E' } })).toThrow(MapParseError)
    expect(() => createInitialState({ ...setup, robot: { x: 1, y: 1, facing: 'E' } })).toThrow(MapParseError)
  })

  it('updates a cell immutably', () => {
    const state = createInitialState(setup)
    const next = updateCell(state, { x: 1, y: 0 }, { plot: 'tilled' })
    expect(getCell(next, { x: 1, y: 0 }).plot).toBe('tilled')
    expect(getCell(state, { x: 1, y: 0 }).plot).toBe('untilled')
    expect(next.cells[1]).toBe(state.cells[1])
  })

  it('knows the map bounds', () => {
    const state = createInitialState(setup)
    expect(isInside(state, { x: 1, y: 1 })).toBe(true)
    expect(isInside(state, { x: -1, y: 0 })).toBe(false)
    expect(isInside(state, { x: 0, y: 2 })).toBe(false)
    expect(() => getCell(state, { x: 2, y: 0 })).toThrow(RangeError)
  })
})
