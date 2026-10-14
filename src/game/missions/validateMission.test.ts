import { validateMission } from '@/game/missions/validateMission'
import { makeState } from '@/game/testing/makeState'

describe('validateMission', () => {
  it('checks harvest count and explains what is missing', () => {
    const state = { ...makeState(['.']), resources: { seeds: null, water: null, energy: null, harvested: 1 } }
    const result = validateMission(state, { objectives: [{ kind: 'harvestAtLeast', count: 3 }] })
    expect(result.success).toBe(false)
    expect(result.objectives[0]).toEqual({
      description: 'Colher pelo menos 3 planta(s)',
      met: false,
      detail: 'Ainda faltam 2 planta(s) para colher.',
    })
  })

  it('checks a list of cells in a plot state', () => {
    const state = makeState(['s s t'])
    const ok = validateMission(state, { objectives: [{ kind: 'cellsInState', cells: [[0, 0], [1, 0]], state: 'seeded' }] })
    const missing = validateMission(state, { objectives: [{ kind: 'cellsInState', cells: [[0, 0], [2, 0]], state: 'seeded' }] })
    expect(ok.success).toBe(true)
    expect(missing.success).toBe(false)
    expect(missing.objectives[0].detail).toBe('1 canteiro(s) ainda não estão com semente plantada.')
  })

  it('checks all soil cells ignoring other terrain', () => {
    expect(validateMission(makeState(['t # t']), { objectives: [{ kind: 'allSoilInState', state: 'tilled' }] }).success).toBe(true)
    expect(validateMission(makeState(['t . R']), { objectives: [{ kind: 'allSoilInState', state: 'tilled' }] }).success).toBe(false)
  })

  it('checks robot position and wet cells', () => {
    const state = makeState(['sw s'], { x: 1 })
    expect(validateMission(state, { objectives: [{ kind: 'robotAt', x: 1, y: 0 }] }).success).toBe(true)
    expect(validateMission(state, { objectives: [{ kind: 'cellsWet', cells: [[0, 0]] }] }).success).toBe(true)
    expect(validateMission(state, { objectives: [{ kind: 'cellsWet', cells: [[0, 0], [1, 0]] }] }).success).toBe(false)
  })

  it('fails when a resource constraint is exceeded even if objectives are met', () => {
    const state = { ...makeState(['.']), usage: { seeds: 0, water: 5, energy: 0 } }
    const result = validateMission(state, {
      objectives: [{ kind: 'robotAt', x: 0, y: 0 }],
      constraints: [{ kind: 'maxWaterUsed', value: 4 }],
    })
    expect(result.success).toBe(false)
    expect(result.constraints[0]).toEqual({
      description: 'Usar no máximo 4 unidade(s) de água',
      met: false,
      detail: 'Usou 5, o limite é 4.',
    })
  })
})
