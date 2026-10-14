import { detectRepetition, findRepeatedSequence } from '@/blocks/analysis/detectRepetition'
import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'

const triple = () => [act('moveForward'), act('prepareSoil'), act('plant')]

describe('detectRepetition', () => {
  it('finds a sequence of two or more commands repeated three times', () => {
    const stmts = [act('turnLeft'), ...triple(), ...triple(), ...triple()]
    expect(findRepeatedSequence(stmts)).toEqual({ length: 3, times: 3, startIndex: 1 })
  })

  it('ignores sequences repeated only twice', () => {
    expect(findRepeatedSequence([...triple(), ...triple()])).toBeNull()
  })

  it('ignores a single command repeated', () => {
    expect(findRepeatedSequence([act('moveForward'), act('moveForward'), act('moveForward')])).toBeNull()
  })

  it('searches inside nested bodies and procedures', () => {
    expect(detectRepetition(program([ifThen(sensor('isSoilDry'), [...triple(), ...triple(), ...triple()])]))).toBe(true)
    expect(detectRepetition(program([], { p: [...triple(), ...triple(), ...triple()] }))).toBe(true)
  })

  it('does not flag programs that already use loops', () => {
    expect(detectRepetition(program([repeat(3, triple())]))).toBe(false)
  })
})
