import { recentSchools, rememberSchool, SCHOOLS_KEY } from '@/services/storage/schoolHistory'

describe('school history', () => {
  beforeEach(() => window.localStorage.removeItem(SCHOOLS_KEY))

  it('keeps the ten most recent distinct schools, newest first', () => {
    for (let index = 0; index < 12; index += 1) rememberSchool(window.localStorage, `Escola ${index}`)
    rememberSchool(window.localStorage, '  Escola   3 ')
    const schools = recentSchools(window.localStorage)
    expect(schools).toHaveLength(10)
    expect(schools[0]).toBe('Escola 3')
    expect(schools.filter((school) => school === 'Escola 3')).toHaveLength(1)
  })

  it('survives broken storage data', () => {
    window.localStorage.setItem(SCHOOLS_KEY, '{bad')
    expect(recentSchools(window.localStorage)).toEqual([])
    expect(recentSchools(null)).toEqual([])
  })
})
