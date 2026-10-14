import {
  act,
  changeVar,
  call,
  compare,
  ifThen,
  not,
  and,
  program,
  repeat,
  sensor,
  setVar,
  variable,
  whileDo,
  arith,
} from '@/blocks/interpreter/programBuilder'
import { exprToText, programToPseudocode } from '@/blocks/pseudocode/pseudocode'

describe('pseudocode', () => {
  it('renders nested statements with four-space indentation', () => {
    const text = programToPseudocode(
      program([
        repeat(3, [ifThen(sensor('isSoilDry'), [act('water')], [act('harvest')]), act('moveForward')]),
      ]),
    )
    expect(text).toBe(
      [
        'quando executar:',
        '    repita 3 vezes:',
        '        se o solo está seco?:',
        '            regar canteiro',
        '        senão:',
        '            colher planta',
        '        mover para frente',
      ].join('\n'),
    )
  })

  it('renders procedures before the main program', () => {
    const text = programToPseudocode(program([call('cuidar')], { cuidar: [act('prepareSoil'), act('plant')] }))
    expect(text).toBe(
      [
        'procedimento cuidar:',
        '    preparar solo',
        '    plantar semente',
        '',
        'quando executar:',
        '    executar cuidar',
      ].join('\n'),
    )
  })

  it('renders variables, while loops and empty bodies', () => {
    const text = programToPseudocode(
      program([setVar('agua', 3), changeVar('agua', -1), changeVar('agua', 2), whileDo(not(sensor('isObstacleAhead')), [])]),
    )
    expect(text).toBe(
      [
        'quando executar:',
        '    agua ← 3',
        '    agua ← agua - 1',
        '    agua ← agua + 2',
        '    enquanto não (existe obstáculo à frente?):',
        '        (nada)',
      ].join('\n'),
    )
  })

  it('renders an empty program', () => {
    expect(programToPseudocode(program([]))).toBe(['quando executar:', '    (nada)'].join('\n'))
  })

  it('parenthesizes nested binary expressions', () => {
    const expr = and(compare('GTE', variable('x'), arith('ADD', 1, 2)), sensor('hasSeeds'))
    expect(exprToText(expr)).toBe('(x ≥ (1 + 2)) e há sementes disponíveis?')
  })
})
