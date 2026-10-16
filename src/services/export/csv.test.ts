import { toCsv } from '@/services/export/csv'

describe('csv', () => {
  it('adds BOM, uses semicolons and CRLF, quotes and guards formulas', () => {
    const csv = toCsv(['a', 'b'], [['x;y', 'diz "oi"'], ['=1+1', null], [-3, '+5']])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual(['a;b', '"x;y";"diz ""oi"""', "'=1+1;", "-3;'+5", ''])
  })
})
