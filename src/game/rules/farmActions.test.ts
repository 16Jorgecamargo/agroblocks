import { applyAction } from '@/game/rules/applyAction'
import { makeState } from '@/game/testing/makeState'
import type { ActionType, ErrorCode } from '@/game/world/types'

const rules = { growTicks: 5, forbidWaterWet: false }

function codeOf(row: string, action: ActionType, resources = {}): ErrorCode | undefined {
  return applyAction(makeState([row], {}, resources), action, rules).error?.code
}

describe('farm actions', () => {
  it('prepares untilled and harvested soil', () => {
    expect(applyAction(makeState(['.']), 'prepareSoil', rules).state.cells[0][0].plot).toBe('tilled')
    expect(applyAction(makeState(['h']), 'prepareSoil', rules).state.cells[0][0].plot).toBe('tilled')
  })

  it('refuses to prepare occupied soil', () => {
    for (const token of ['t', 's', 'g', 'm']) expect(codeOf(token, 'prepareSoil')).toBe('PLOT_OCCUPIED')
  })

  it('plants on tilled soil spending one seed', () => {
    const result = applyAction(makeState(['t'], {}, { seeds: 2 }), 'plant', rules)
    expect(result.state.cells[0][0]).toMatchObject({ plot: 'seeded', growth: 0 })
    expect(result.state.resources.seeds).toBe(1)
    expect(result.events).toContainEqual({ type: 'plotChanged', x: 0, y: 0, from: 'tilled', to: 'seeded' })
    expect(result.events).toContainEqual({ type: 'resourceChanged', resource: 'seeds', value: 1 })
  })

  it('maps planting errors', () => {
    expect(codeOf('s', 'plant')).toBe('PLOT_OCCUPIED')
    expect(codeOf('g', 'plant')).toBe('PLOT_OCCUPIED')
    expect(codeOf('m', 'plant')).toBe('PLOT_OCCUPIED')
    expect(codeOf('.', 'plant')).toBe('SOIL_NOT_READY')
    expect(codeOf('h', 'plant')).toBe('SOIL_NOT_READY')
    expect(codeOf('t', 'plant', { seeds: 0 })).toBe('NO_SEEDS')
  })

  it('waters soil spending one water', () => {
    const result = applyAction(makeState(['t'], {}, { water: 1 }), 'water', rules)
    expect(result.state.cells[0][0].moisture).toBe('wet')
    expect(result.state.resources.water).toBe(0)
    expect(result.state.usage.water).toBe(1)
  })

  it('fails with NO_WATER when the tank is empty', () => {
    expect(codeOf('t', 'water', { water: 0 })).toBe('NO_WATER')
  })

  it('allows watering wet soil unless the mission forbids it', () => {
    expect(codeOf('tw', 'water')).toBeUndefined()
    const strict = applyAction(makeState(['tw']), 'water', { ...rules, forbidWaterWet: true })
    expect(strict.error?.code).toBe('WATER_WASTED')
  })

  it('harvests mature plants and counts production', () => {
    const result = applyAction(makeState(['m']), 'harvest', rules)
    expect(result.state.cells[0][0].plot).toBe('harvested')
    expect(result.state.resources.harvested).toBe(1)
  })

  it('maps harvesting errors', () => {
    expect(codeOf('s', 'harvest')).toBe('PLANT_NOT_MATURE')
    expect(codeOf('g', 'harvest')).toBe('PLANT_NOT_MATURE')
    expect(codeOf('.', 'harvest')).toBe('NOTHING_TO_HARVEST')
    expect(codeOf('t', 'harvest')).toBe('NOTHING_TO_HARVEST')
    expect(codeOf('h', 'harvest')).toBe('NOTHING_TO_HARVEST')
  })

  it('rejects farm actions outside soil', () => {
    for (const action of ['prepareSoil', 'plant', 'water', 'harvest'] as const) {
      expect(codeOf('R', action)).toBe('NOT_SOIL')
    }
  })

  it('refills water at a reservoir up to capacity', () => {
    const state = makeState(['R'], {}, { water: 1, waterCapacity: 4 })
    const result = applyAction(state, 'collectResources', rules)
    expect(result.state.resources.water).toBe(4)
    expect(result.events).toContainEqual({ type: 'resourcesCollected', resource: 'water', amount: 3 })
  })

  it('refills seeds at a seed depot up to capacity', () => {
    const state = makeState(['S'], {}, { seeds: 0, seedCapacity: 6 })
    expect(applyAction(state, 'collectResources', rules).state.resources.seeds).toBe(6)
  })

  it('fails to collect away from supplies', () => {
    expect(codeOf('.', 'collectResources')).toBe('NOT_AT_SUPPLY')
  })

  it('does not count refills as usage', () => {
    const state = makeState(['R'], {}, { water: 0, waterCapacity: 3 })
    expect(applyAction(state, 'collectResources', rules).state.usage.water).toBe(0)
  })
})
