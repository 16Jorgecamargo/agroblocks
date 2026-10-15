import { columnsAt, IDLE_COLUMNS, RUNNING_COLUMNS } from '@/features/gameplay/gameplayLayout'

describe('columnsAt', () => {
  it('starts at the idle layout and ends at the running layout', () => {
    expect(columnsAt(0)).toBe(IDLE_COLUMNS)
    expect(columnsAt(1)).toBe(RUNNING_COLUMNS)
  })

  it('moves the program and farm shares continuously in between', () => {
    const fractions = (columns: string) => [...columns.matchAll(/([\d.]+)fr/g)].map((match) => Number(match[1]))
    const [programHalf, farmHalf] = fractions(columnsAt(0.5))
    const [programIdle, farmIdle] = fractions(IDLE_COLUMNS)
    const [programRun, farmRun] = fractions(RUNNING_COLUMNS)
    expect(programHalf).toBeCloseTo((programIdle + programRun) / 2)
    expect(farmHalf).toBeCloseTo((farmIdle + farmRun) / 2)
  })
})
