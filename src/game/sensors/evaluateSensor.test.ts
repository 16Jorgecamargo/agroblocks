import { evaluateSensor } from '@/game/sensors/evaluateSensor'
import { makeState } from '@/game/testing/makeState'

describe('evaluateSensor', () => {
  it('isPlotEmpty is true for untilled, tilled and harvested soil only', () => {
    expect(evaluateSensor(makeState(['.']), 'isPlotEmpty')).toBe(true)
    expect(evaluateSensor(makeState(['t']), 'isPlotEmpty')).toBe(true)
    expect(evaluateSensor(makeState(['h']), 'isPlotEmpty')).toBe(true)
    expect(evaluateSensor(makeState(['s']), 'isPlotEmpty')).toBe(false)
    expect(evaluateSensor(makeState(['m']), 'isPlotEmpty')).toBe(false)
    expect(evaluateSensor(makeState(['R']), 'isPlotEmpty')).toBe(false)
  })

  it('isSoilDry reads moisture of soil only', () => {
    expect(evaluateSensor(makeState(['s']), 'isSoilDry')).toBe(true)
    expect(evaluateSensor(makeState(['sw']), 'isSoilDry')).toBe(false)
    expect(evaluateSensor(makeState(['R']), 'isSoilDry')).toBe(false)
  })

  it('isPlantMature is true only for mature plants', () => {
    expect(evaluateSensor(makeState(['m']), 'isPlantMature')).toBe(true)
    expect(evaluateSensor(makeState(['g']), 'isPlantMature')).toBe(false)
  })

  it('isObstacleAhead detects obstacles, blocked cells and map edges', () => {
    expect(evaluateSensor(makeState(['. #']), 'isObstacleAhead')).toBe(true)
    expect(evaluateSensor(makeState(['. X']), 'isObstacleAhead')).toBe(true)
    expect(evaluateSensor(makeState(['.']), 'isObstacleAhead')).toBe(true)
    expect(evaluateSensor(makeState(['. .']), 'isObstacleAhead')).toBe(false)
    expect(evaluateSensor(makeState(['. R']), 'isObstacleAhead')).toBe(false)
  })

  it('hasSeeds treats unlimited seeds as available', () => {
    expect(evaluateSensor(makeState(['.']), 'hasSeeds')).toBe(true)
    expect(evaluateSensor(makeState(['.'], {}, { seeds: 1 }), 'hasSeeds')).toBe(true)
    expect(evaluateSensor(makeState(['.'], {}, { seeds: 0 }), 'hasSeeds')).toBe(false)
  })
})
